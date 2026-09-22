import { useEffect, useRef, useState } from "react";
import { setCart } from "../../lib/cart-store";
import { wc, type WcAddress } from "../../lib/woocommerce";
import { buildPpcpPaymentData } from "../../lib/payment-methods";
import { loadPayPalSdk } from "../../lib/paypal";

interface Props {
  billing: WcAddress;
  shipping: WcAddress;
  customerNote: string;
  onError: (message: string | null) => void;
  onBusyChange: (busy: boolean) => void;
}

/** Champs sans lesquels WooCommerce refusera la commande au retour de PayPal. */
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
 * Bouton PayPal du checkout.
 *
 * Déroulé, entièrement vérifié côté serveur le 22/09/2026 :
 *
 *   1. clic → `createOrder` appelle `POST /wc-ppcp/v1/cart/order`, qui renvoie
 *      un identifiant de commande PayPal ;
 *   2. PayPal ouvre sa fenêtre, le client approuve (`commit=true` : il valide
 *      définitivement là-bas) ;
 *   3. `onApprove` envoie cet identifiant à `POST /wc/store/v1/checkout` dans
 *      `payment_data.ppcp_paypal_order_id` — le même endpoint que la carte,
 *      qui crée la commande WooCommerce et déclenche la capture côté serveur ;
 *   4. redirection vers la page de confirmation Astro.
 *
 * Le front ne capture jamais lui-même : c'est WooCommerce qui le fait, ce qui
 * garantit que la commande, les e-mails, le stock et EasyBeer restent
 * synchronisés exactement comme pour un paiement par carte.
 */
export default function PayPalButtons({
  billing,
  shipping,
  customerNote,
  onError,
  onBusyChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  // Les callbacks passés à PayPal sont figés au moment du rendu des boutons.
  // Sans cette référence, ils captureraient l'adresse telle qu'elle était à
  // ce moment-là et enverraient un formulaire périmé à WooCommerce.
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
            try {
              const { billing: b, shipping: s, customerNote: note } = latest.current;

              const result = await wc.checkout({
                billing_address: b,
                shipping_address: s,
                customer_note: note || undefined,
                payment_method: "ppcp",
                payment_data: buildPpcpPaymentData(data.orderID),
              });

              if (result.payment_result.payment_status !== "success") {
                onError(
                  "Le paiement PayPal n'a pas abouti. Aucun montant n'a été débité — réessaie ou choisis la carte bancaire.",
                );
                return;
              }

              // Même nettoyage que le tunnel carte : sans clearSession(), le
              // prochain getCart() ressort le panier en cache et l'icône du
              // header garde les anciens articles après un paiement réussi.
              setCart(null);
              wc.clearSession();
              window.location.href = `/commande/confirmation?order=${result.order_id}&key=${encodeURIComponent(
                result.order_key,
              )}`;
            } catch (err) {
              onError(
                err instanceof Error
                  ? err.message
                  : "Erreur lors de la finalisation de la commande.",
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
          Vous serez redirigé vers PayPal pour valider le paiement, puis ramené
          ici. Paiement en plusieurs fois disponible selon votre compte.
        </p>
      )}
    </div>
  );
}
