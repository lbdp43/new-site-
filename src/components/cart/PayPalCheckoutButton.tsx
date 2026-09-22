import { useEffect, useRef, useState } from "react";
import { cartActions, setCart } from "../../lib/cart-store";
import {
  wc,
  PAID_ORDER_STATUSES,
  type WcAddress,
  type WcCart,
} from "../../lib/woocommerce";
import { loadPayPalSdk } from "../../lib/paypal";

interface Props {
  billing: WcAddress;
  shipping: WcAddress;
  customerNote: string;
  /** Mode de livraison choisi à l'écran — voir `createOrder`. */
  shippingRateId?: string;
  shippingPackageId?: number;
  onError: (message: string | null) => void;
  onBusyChange: (busy: boolean) => void;
}

/** Champs sans lesquels WooCommerce refusera de créer la commande. */
function missingFields(billing: WcAddress, shipping: WcAddress): string[] {
  const missing: string[] = [];
  if (!billing.email) missing.push("l'e-mail");
  if (!billing.first_name || !billing.last_name) missing.push("le nom");

  for (const [label, addr] of [
    ["de facturation", billing],
    ["de livraison", shipping],
  ] as const) {
    if (!addr.address_1 || !addr.postcode || !addr.city || !addr.country) {
      missing.push(`l'adresse ${label}`);
    }
  }

  return missing;
}

/**
 * Bouton PayPal du checkout — le client ne quitte jamais le site Astro.
 *
 * Déroulé, et **l'ordre compte plus que tout le reste** :
 *
 *   1. `wc.createPaypalOrder()` → commande PayPal (rien n'est débité :
 *      avec `intent=capture`, l'argent ne bouge qu'à l'encaissement) ;
 *   2. le client approuve dans la fenêtre PayPal ;
 *   3. `POST /wc/store/v1/checkout` → **la commande WooCommerce est créée**.
 *      La commande PayPal approuvée étant dans la session, la passerelle
 *      encaisse ici même et renvoie `processing` (relevé sur #26530) ;
 *   4. `wc.payExistingOrder()` → **filet**, appelé seulement si l'étape 3 a
 *      laissé la commande en attente. Le plugin `astro-cors` appelle alors
 *      `process_payment()` côté serveur ;
 *   5. on n'affiche la confirmation que sur un statut de commande payé, lu
 *      chez WooCommerce.
 *
 * 🔒 **Pourquoi la commande est créée AVANT l'encaissement.** Ainsi tout débit
 * est nécessairement rattaché à une commande : visible en back-office et
 * remboursable depuis WooCommerce. L'inverse — encaisser puis créer — laisse
 * la porte ouverte à un débit sans trace côté boutique.
 *
 * ⚠️ **Ne jamais inverser les étapes 3 et 4**, et ne jamais revenir à
 * `/wc-ppcp/v1/cart/checkout` : c'est la route du flux **express**, elle
 * renvoie vers la page de relecture du plugin au lieu de finaliser.
 *
 * ⚠️ **Les callbacks PayPal sont figés au rendu des boutons** : les valeurs du
 * formulaire passent donc par une `ref`. Ne pas « simplifier » en lisant les
 * props directement — l'adresse envoyée serait celle d'avant la saisie.
 */
export default function PayPalCheckoutButton({
  billing,
  shipping,
  customerNote,
  shippingRateId,
  shippingPackageId,
  onError,
  onBusyChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  const latest = useRef({
    billing,
    shipping,
    customerNote,
    shippingRateId,
    shippingPackageId,
  });
  useEffect(() => {
    latest.current = {
      billing,
      shipping,
      customerNote,
      shippingRateId,
      shippingPackageId,
    };
  }, [billing, shipping, customerNote, shippingRateId, shippingPackageId]);

  /** Total TTC du panier au moment où le client approuve chez PayPal. */
  const approvedTotal = useRef<string | null>(null);

  /**
   * Rétablit le mode de livraison choisi par le client si WooCommerce l'a
   * réinitialisé, et renvoie le panier à jour.
   *
   * ⚠️ À rappeler après **chaque** opération qui pousse une adresse : le
   * serveur recalcule les tarifs et re-sélectionne le sien par défaut, sans
   * rien signaler. Le faire une seule fois ne suffit pas — c'est ce qui a
   * produit #26534.
   */
  async function restoreShippingRate(cart: WcCart | null): Promise<WcCart | null> {
    const { shippingRateId: rateId, shippingPackageId: pkgId } = latest.current;
    if (!rateId) return cart;

    const stillSelected = cart?.shipping_rates?.[0]?.shipping_rates?.some(
      (r) => r.rate_id === rateId && r.selected,
    );
    if (stillSelected) return cart;

    return await cartActions.selectShippingRate(pkgId ?? 0, rateId);
  }

  useEffect(() => {
    let cancelled = false;
    let instance: { close?: () => void } | null = null;

    loadPayPalSdk()
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;

        const buttons = paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal" },

          createOrder: async () => {
            onError(null);
            const { billing: b, shipping: s } = latest.current;

            const missing = missingFields(b, s);
            if (missing.length > 0) {
              const msg = `Complète ${missing.join(", ")} avant de payer avec PayPal.`;
              onError(msg);
              throw new Error(msg);
            }

            onBusyChange(true);
            try {
              // L'extension lit l'adresse dans la session WooCommerce, que le
              // checkout ne pousse que sur changement de code postal, ville ou
              // pays. On resynchronise avant d'ouvrir la fenêtre PayPal.
              const synced = await cartActions.updateCustomer({
                billing_address: b,
                shipping_address: s,
              });

              // ⚠️ **Cet appel RÉINITIALISE le mode de livraison côté
              // WooCommerce**, qui recalcule les tarifs pour la nouvelle
              // adresse et re-sélectionne le sien par défaut.
              //
              // Le 22/09/2026, la commande #26523 est née de là : « Retrait à
              // la Brasserie » (offert) était coché à l'écran, la commande
              // est partie en « Forfait » à 12,50 €. PayPal avait approuvé
              // 16 €, WooCommerce attendait 31 € — l'encaissement ne pouvait
              // pas aboutir.
              //
              // On rétablit donc le choix du client AVANT de créer la
              // commande PayPal, sans quoi le montant approuvé serait faux.
              const cart = await restoreShippingRate(synced);

              // Le montant que le client s'apprête à approuver chez PayPal.
              // On le retient pour pouvoir vérifier, au retour, que la
              // commande WooCommerce porte bien le MÊME total — cf. `onApprove`.
              approvedTotal.current = cart?.totals?.total_price ?? null;

              return await wc.createPaypalOrder();
            } catch (err) {
              onError(err instanceof Error ? err.message : "Erreur PayPal.");
              throw err;
            } finally {
              onBusyChange(false);
            }
          },

          onApprove: async (data) => {
            onBusyChange(true);
            onError(null);

            let created: { orderId: string; orderKey: string } | null = null;

            try {
              const { billing: b, shipping: s, customerNote: note } = latest.current;

              // 0) 🔒 **Le montant approuvé fait loi.** WooCommerce recalcule
              //    les frais de port à chaque fois qu'on lui pousse une
              //    adresse, et re-sélectionne le sien par défaut. Rétablir le
              //    choix du client une fois ne suffit donc pas : on le
              //    rétablit à nouveau ici, puis on VÉRIFIE que le total n'a
              //    pas bougé depuis l'approbation.
              //
              //    Sans ce contrôle, la commande #26534 est partie en
              //    « Forfait » à 31 € alors que le client avait approuvé 16 €
              //    avec une livraison offerte. On refuse donc de créer la
              //    commande plutôt que d'en créer une au mauvais montant :
              //    rien n'est enregistré, rien n'est débité, le panier est
              //    intact.
              const cart = await restoreShippingRate(await cartActions.refresh());
              const expected = approvedTotal.current;
              const current = cart?.totals?.total_price ?? null;

              if (expected && current && expected !== current) {
                console.error("[PayPal] montant divergent — commande non créée", {
                  approuvéChezPayPal: expected,
                  totalWooCommerceMaintenant: current,
                  livraison: cart?.shipping_rates?.[0]?.shipping_rates?.find(
                    (r) => r.selected,
                  )?.name,
                });
                onError(
                  "Le montant de ta commande a changé pendant le paiement " +
                    "(les frais de livraison ont été recalculés). Rien n'a été " +
                    "débité et ton panier est intact. Revérifie le mode de " +
                    "livraison, puis relance le paiement.",
                );
                return;
              }

              // 1) La commande ensuite. Aucun argent en jeu à cette étape.
              const order = await wc.startPaypalOrderPayment({
                billing: b,
                shipping: s,
                customerNote: note,
              });
              created = { orderId: order.orderId, orderKey: order.orderKey };

              // 2) L'encaissement — **sauf si la commande est déjà payée**.
              //    Relevé sur #26530 : quand la commande PayPal approuvée est
              //    dans la session, `/wc/store/v1/checkout` encaisse lui-même
              //    et renvoie `processing`. Rappeler `pay-order` ne ferait que
              //    se heurter au verrou anti-double-encaissement (409).
              const alreadyPaid =
                order.status != null && PAID_ORDER_STATUSES.includes(order.status);

              const paid = alreadyPaid
                ? { isPaid: true, status: order.status, transactionId: "" }
                : await wc.payExistingOrder({
                    orderId: order.orderId,
                    orderKey: order.orderKey,
                    paypalOrderId: data.orderID,
                  });

              // 3) On ne croit que l'état réel de la commande. Un « success »
              //    de passerelle a déjà menti (#26518) — mais un statut payé,
              //    lui, vient de WooCommerce et fait foi.
              if (!paid.isPaid) {
                console.error("[PayPal] encaissement non confirmé", {
                  order: order.orderId,
                  ...paid,
                });
                onError(
                  `Ta commande n° ${order.orderId} a bien été enregistrée, mais le paiement ` +
                    "n'a pas pu être confirmé, et rien n'a été débité. " +
                    "Contacte-nous en indiquant ce numéro, nous la finaliserons avec toi.",
                );
                // ⚠️ **Pas de redirection automatique vers `order.payUrl`.**
                // Elle existait, et elle était dangereuse : elle envoyait le
                // client payer une commande dont on vient justement
                // d'établir qu'on ne sait pas l'encaisser, donc à un montant
                // qu'on n'a pas vérifié. Sur #26534 elle menait à une page
                // réclamant 31 € pour une commande approuvée à 16 €.
                // Elle effaçait aussi la console au bout de 6 s, avec la
                // seule trace exploitable de l'échec.
                return;
              }

              setCart(null);
              wc.clearSession();
              window.location.href = `/commande/confirmation?order=${order.orderId}&key=${encodeURIComponent(
                order.orderKey,
              )}`;
            } catch (err) {
              const base =
                err instanceof Error
                  ? err.message
                  : "Erreur lors de la finalisation de la commande.";
              // Si la commande a été créée avant l'échec, son numéro est la
              // seule information qui permette de retrouver un éventuel débit.
              onError(
                created
                  ? `${base} (Ta commande porte le n° ${created.orderId} — garde-le si tu nous contactes.)`
                  : base,
              );
            } finally {
              onBusyChange(false);
            }
          },

          onCancel: () => {
            onBusyChange(false);
            onError("Paiement PayPal annulé. Ton panier est intact.");
          },

          onError: (err: unknown) => {
            onBusyChange(false);
            console.error("[PayPal]", err);
            onError(
              "PayPal a rencontré une erreur. Réessaie, ou choisis la carte bancaire.",
            );
          },
        });

        instance = buttons;
        return buttons.render(containerRef.current).then(() => {
          if (!cancelled) setStatus("ready");
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[PayPal] chargement", err);
        setStatus("failed");
        onError(
          "PayPal n'a pas pu se charger. Choisis la carte bancaire, ou réessaie dans un instant.",
        );
      });

    return () => {
      cancelled = true;
      try {
        instance?.close?.();
      } catch {
        /* le SDK a déjà été retiré du DOM */
      }
    };
    // Monté une seule fois : les valeurs à jour passent par `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {status === "loading" && (
        <p className="text-sm text-ink-500 py-4">Chargement de PayPal…</p>
      )}

      <div ref={containerRef} />

      {status === "ready" && (
        <p className="mt-3 text-xs text-ink-500">
          Vous validez le paiement dans la fenêtre PayPal, puis vous revenez ici
          — sans quitter le site.
        </p>
      )}
    </div>
  );
}
