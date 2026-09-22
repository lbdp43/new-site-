import { useRef, useState } from "react";
import { cartActions } from "../../lib/cart-store";
import { wc, type WcAddress } from "../../lib/woocommerce";

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
 * Bouton PayPal du checkout — **le front ne parle jamais à PayPal.**
 *
 * Déroulé :
 *
 *   1. clic → `wc.startPaypalOrderPayment()` crée la commande WooCommerce
 *      **en attente** via la Store API, et renvoie l'adresse de sa page de
 *      paiement WordPress ;
 *   2. on y redirige le client. Approbation PayPal, encaissement, e-mails,
 *      stock et EasyBeer : tout se fait côté WooCommerce, sur la page que le
 *      WordPress sert déjà à ses vrais clients aujourd'hui.
 *
 * 🔒 **Pourquoi ce détour.** Le 22/09/2026, le tunnel entièrement headless a
 * débité deux fois 16 € **sans qu'aucune commande n'existe** : appelée depuis
 * Astro, la route `cart/checkout` de l'extension encaisse puis renvoie vers
 * sa page de relecture sans rien créer. Le garde-fou du front n'y pouvait
 * rien : il juge la réponse, donc après l'encaissement.
 *
 * Ici la commande existe **avant** toute page de paiement, et ce composant
 * n'a aucun moyen technique de déclencher un débit. Un encaissement sans
 * commande n'est donc pas « improbable » : il est impossible.
 *
 * ⚠️ Ne pas « moderniser » en réintroduisant le SDK PayPal et une
 * finalisation en JavaScript. C'est exactement ce qui a échoué, deux fois.
 * Le prix à payer est une page WordPress en fin de tunnel — c'est voulu.
 */
export default function PayPalCheckoutButton({
  billing,
  shipping,
  customerNote,
  onError,
  onBusyChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  // Empêche un double-clic de créer deux commandes : la redirection n'est pas
  // instantanée, et le bouton reste à l'écran pendant ce temps.
  const startedRef = useRef(false);

  async function handleClick() {
    if (startedRef.current) return;

    onError(null);

    const missing = missingFields(billing, shipping);
    if (missing.length > 0) {
      onError(`Complète ${missing.join(", ")} avant de payer avec PayPal.`);
      return;
    }

    startedRef.current = true;
    setBusy(true);
    onBusyChange(true);

    try {
      // WooCommerce lit l'adresse dans la session : on la resynchronise avant
      // de créer la commande, le checkout ne la poussant que sur changement
      // de code postal, ville ou pays.
      await cartActions.updateCustomer({
        billing_address: billing,
        shipping_address: shipping,
      });

      const { payUrl } = await wc.startPaypalOrderPayment({
        billing,
        shipping,
        customerNote,
      });

      // Pas de nettoyage du panier ici : WooCommerce le vide lui-même en
      // créant la commande. Et si le client abandonne sur la page de
      // paiement, la commande reste « en attente » côté boutique — état
      // normal, que WooCommerce annule tout seul après son délai.
      window.location.href = payUrl;
    } catch (err) {
      startedRef.current = false;
      setBusy(false);
      onBusyChange(false);
      onError(
        err instanceof Error
          ? err.message
          : "La commande n'a pas pu être enregistrée. Choisis la carte bancaire, ou réessaie.",
      );
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#ffc439] hover:bg-[#f0b72f] text-[#003087] font-semibold disabled:opacity-60 transition-colors"
      >
        {busy ? (
          <>
            <span className="inline-block w-4 h-4 rounded-full border-2 border-[#003087]/30 border-t-[#003087] animate-spin" />
            Préparation…
          </>
        ) : (
          "Payer avec PayPal"
        )}
      </button>

      <p className="mt-3 text-xs text-ink-500">
        Votre commande est enregistrée, puis vous terminez le paiement sur la
        page sécurisée de la boutique. Rien n'est débité avant cette étape.
      </p>
    </div>
  );
}
