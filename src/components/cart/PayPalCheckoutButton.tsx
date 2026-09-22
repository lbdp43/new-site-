import { useEffect, useRef, useState } from "react";
import { cartActions, setCart } from "../../lib/cart-store";
import { wc, type WcAddress } from "../../lib/woocommerce";
import { loadPayPalSdk } from "../../lib/paypal";

interface Props {
  billing: WcAddress;
  shipping: WcAddress;
  customerNote: string;
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
 *   3. `POST /wc/store/v1/checkout` → **la commande WooCommerce est créée**,
 *      en attente, toujours sans le moindre mouvement d'argent ;
 *   4. `wc.payExistingOrder()` → le plugin `astro-cors` appelle
 *      `process_payment()` sur la passerelle, **côté serveur** : c'est là, et
 *      seulement là, que l'argent est encaissé ;
 *   5. on relit le statut réel de la commande avant d'afficher quoi que ce
 *      soit au client.
 *
 * 🔒 **Pourquoi la commande est créée AVANT l'encaissement.** Le 22/09/2026,
 * le tunnel qui encaissait d'abord a débité deux fois 16 € sans qu'aucune
 * commande n'existe — donc sans e-mail, sans préparation, sans trace. Ici,
 * tout débit est nécessairement rattaché à une commande : visible en
 * back-office et remboursable depuis WooCommerce.
 *
 * ⚠️ **Ne jamais inverser les étapes 3 et 4**, et ne jamais revenir à
 * `/wc-ppcp/v1/cart/checkout` : cette route encaisse sans créer de commande.
 * C'est la cause exacte de l'incident.
 *
 * ⚠️ **Les callbacks PayPal sont figés au rendu des boutons** : les valeurs du
 * formulaire passent donc par une `ref`. Ne pas « simplifier » en lisant les
 * props directement — l'adresse envoyée serait celle d'avant la saisie.
 */
export default function PayPalCheckoutButton({
  billing,
  shipping,
  customerNote,
  onError,
  onBusyChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  const latest = useRef({ billing, shipping, customerNote });
  useEffect(() => {
    latest.current = { billing, shipping, customerNote };
  }, [billing, shipping, customerNote]);

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
              await cartActions.updateCustomer({
                billing_address: b,
                shipping_address: s,
              });
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

              // 1) La commande d'abord. Aucun argent en jeu à cette étape.
              const order = await wc.startPaypalOrderPayment({
                billing: b,
                shipping: s,
                customerNote: note,
              });
              created = { orderId: order.orderId, orderKey: order.orderKey };

              // 2) L'encaissement ensuite, côté serveur.
              const paid = await wc.payExistingOrder({
                orderId: order.orderId,
                orderKey: order.orderKey,
                paypalOrderId: data.orderID,
              });

              // 3) On ne croit que la commande relue en base : `is_paid` et un
              //    `transaction_id` non vide. Un « success » de passerelle a
              //    déjà menti (#26518).
              if (!paid.isPaid || !paid.transactionId) {
                console.error("[PayPal] encaissement non confirmé", {
                  order: order.orderId,
                  ...paid,
                });
                onError(
                  `Ta commande n° ${order.orderId} a bien été enregistrée, mais le paiement n'a pas pu être confirmé. ` +
                    "Termine-le depuis le lien ci-dessous, ou contacte-nous en indiquant ce numéro — " +
                    "rien ne sera débité deux fois.",
                );
                // On expose la page de paiement WooCommerce comme issue de
                // secours plutôt que de laisser le client sans recours.
                window.setTimeout(() => {
                  window.location.href = order.payUrl;
                }, 6000);
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
