/**
 * Choix du moyen de paiement sur le checkout Astro.
 *
 * Jusqu'en septembre 2026, le checkout n'avait qu'une seule passerelle
 * (`woocommerce_payments`, écrite en dur) et donc aucune notion de choix.
 * WooCommerce en déclare pourtant deux — relevé sur le WP live :
 *
 *     "payment_methods": ["woocommerce_payments", "ppcp"]
 *
 * Ce module est le seul endroit qui décide ce qu'on propose au client. La
 * règle : on n'affiche JAMAIS une passerelle que WooCommerce ne déclare pas
 * pour le panier courant — sinon on envoie le client dans un tunnel que le
 * serveur refusera.
 */

import type { WcCart, WcPpcpExtension } from "./woocommerce";

export type PaymentMethodId = "woocommerce_payments" | "ppcp";

export interface PaymentMethodOption {
  id: PaymentMethodId;
  /** Libellé affiché dans le sélecteur. */
  label: string;
  /** Sous-titre court sous le libellé. */
  hint: string;
}

/**
 * Ordre d'affichage souhaité. La carte reste en premier : c'est le moyen
 * majoritaire et celui dont le tunnel est éprouvé en production.
 */
const CATALOGUE: Record<PaymentMethodId, PaymentMethodOption> = {
  woocommerce_payments: {
    id: "woocommerce_payments",
    label: "Carte bancaire",
    hint: "Visa, Mastercard, Apple Pay, Google Pay",
  },
  ppcp: {
    id: "ppcp",
    label: "PayPal",
    hint: "Paiement via votre compte PayPal",
  },
};

const DISPLAY_ORDER: PaymentMethodId[] = ["woocommerce_payments", "ppcp"];

/* ──────────────────────────────────────────────────────────────────────
 * PayPal — garde-fou
 *
 * 🔴 Le tunnel PayPal n'est PAS encore opérationnel. Il manque trois
 * informations qui ne sont pas devinables depuis l'environnement de dev
 * (le WordPress est injoignable via le proxy réseau, et la source du plugin
 * `pymntpl-paypal-woocommerce` n'est récupérable ni sur wordpress.org ni via
 * un CDN — vérifié le 22/09/2026). Détail et mode opératoire du relevé :
 * `docs/paypal-checkout.md`.
 *
 * Tant que les deux variables ci-dessous ne sont pas posées, PayPal n'est
 * jamais proposé au client — même si WooCommerce le déclare disponible.
 * C'est volontaire : mieux vaut un checkout sans PayPal qu'un bouton PayPal
 * qui échoue sur une boutique qui encaisse réellement.
 * ────────────────────────────────────────────────────────────────────── */

/**
 * ✅ Le tunnel d'approbation PayPal est écrit (22/09/2026) : chargement du
 * SDK, boutons, création de commande, finalisation, annulation et erreurs.
 *
 * Il reste néanmoins **verrouillé par deux variables d'environnement**
 * absentes de Vercel à ce jour. Tant qu'elles ne sont pas posées, PayPal
 * n'est jamais proposé — le temps qu'un vrai paiement de bout en bout ait
 * été passé puis remboursé.
 */
const PPCP_FLOW_IMPLEMENTED = true;

const PPCP_ENABLED = import.meta.env.PUBLIC_PPCP_ENABLED === "true";
const PAYPAL_CLIENT_ID = import.meta.env.PUBLIC_PAYPAL_CLIENT_ID as string | undefined;

/** true seulement si le tunnel existe ET qu'il a été activé et configuré. */
export function isPpcpConfigured(): boolean {
  return PPCP_FLOW_IMPLEMENTED && PPCP_ENABLED && Boolean(PAYPAL_CLIENT_ID);
}

export function getPaypalClientId(): string | null {
  return PAYPAL_CLIENT_ID ?? null;
}

/** Lit le bloc publié par l'extension PayPal dans le panier, ou null. */
export function getPpcpExtension(cart: WcCart | null): WcPpcpExtension | null {
  const ext = cart?.extensions?.wc_ppcp;
  return ext && typeof ext === "object" ? ext : null;
}

/**
 * Moyens de paiement réellement proposables pour ce panier.
 *
 * Intersection de trois choses :
 *   1. ce que WooCommerce déclare (`cart.payment_methods`) ;
 *   2. ce que le front Astro sait faire (`CATALOGUE`) ;
 *   3. les garde-fous locaux (PayPal tant qu'il n'est pas configuré).
 *
 * Si le panier n'est pas encore chargé, on retombe sur la carte seule :
 * c'est le comportement historique, et il évite un écran vide.
 */
export function getAvailablePaymentMethods(cart: WcCart | null): PaymentMethodOption[] {
  const declared = cart?.payment_methods;
  if (!Array.isArray(declared) || declared.length === 0) {
    return [CATALOGUE.woocommerce_payments];
  }

  const available = DISPLAY_ORDER.filter((id) => {
    if (!declared.includes(id)) return false;
    if (id === "ppcp" && !isPpcpConfigured()) return false;
    return true;
  }).map((id) => CATALOGUE[id]);

  // Filet : si l'intersection est vide (passerelle renommée côté WC, panier
  // exotique…), on garde la carte plutôt que d'afficher un checkout sans
  // aucun moyen de paiement.
  return available.length > 0 ? available : [CATALOGUE.woocommerce_payments];
}

/* ──────────────────────────────────────────────────────────────────────
 * Contrat `payment_data` de la passerelle PPCP
 *
 * ⚠️ TOUT CE QUI SUIT EST UNE HYPOTHÈSE À CONFIRMER, pas un fait vérifié.
 *
 * Ce qui EST établi, en lisant deux vraies commandes PayPal du WP live
 * (#26042 et #25926, relevées le 22/09/2026 via le MCP WooCommerce) :
 *
 *   payment_method       = "ppcp"
 *   payment_method_title = "PayPal - {email du payeur}"
 *   transaction_id       = ID de CAPTURE PayPal   (ex 5KY21287UR815640M)
 *   meta _ppcp_paypal_order_id = ID de COMMANDE PayPal (ex 26D99705JH087882R)
 *   meta _ppcp_environment     = "production"
 *   meta _paypal_fee / _paypal_net
 *
 * Et la note de commande générée par le plugin :
 *   « Commande PayPal {order_id} créée. ID de capture : {capture_id} »
 *
 * On en déduit la forme du tunnel : le front fait approuver une **commande
 * PayPal** par le client, puis transmet son identifiant à WooCommerce, qui
 * déclenche la capture côté serveur. Le front n'a donc jamais à capturer
 * lui-même — c'est cohérent avec le fait que la commande WC passe directement
 * en « En cours » avec les frais PayPal déjà enregistrés.
 *
 * ✅ **Tout ce qui suit est vérifié en production le 22/09/2026**, depuis
 * `test.labrasseriedesplantes.fr`, sans qu'aucun paiement n'ait eu lieu :
 *
 *   1. `POST /wc-ppcp/v1/cart/order` avec `{payment_method:"ppcp",
 *      context:"checkout"}` → renvoie une chaîne JSON nue, l'ID de commande
 *      PayPal (ex. `"8L3502990F093683F"`). Le `Cart-Token` suffit : ni
 *      cookie, ni `woocommerce-process-checkout-nonce`.
 *   2. `POST /wc/store/v1/checkout` avec `payment_method:"ppcp"` et
 *      `ppcp_paypal_order_id` dans `payment_data` → crée la commande
 *      WooCommerce (`order_id`, `order_key`, statut `pending`) et renvoie
 *      `payment_status:"success"`.
 *
 * C'est donc le **même endpoint que la carte** qui finalise, ce qui était
 * l'issue souhaitée : lui seul renvoie `order_id` + `order_key`, dont la page
 * de confirmation a besoin.
 *
 * ⚠️ L'étape 1 exige le plugin **`astro-cors` ≥ 1.3.0** côté WordPress.
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Construit le `payment_data` d'un checkout PayPal.
 *
 * `payment_method` est volontairement DUPLIQUÉ dans payment_data, exactement
 * comme pour WooPayments : `WooCommerce/StoreApi/Legacy.php` fait
 * `$_POST = $payment_data` (il REMPLACE `$_POST`), donc le `payment_method`
 * de premier niveau n'atterrit jamais dans `$_POST['payment_method']`. Toute
 * passerelle qui lit cette valeur côté PHP ne la trouve pas — c'est ce qui
 * provoquait la TypeError fatale de WooPayments en avril 2026.
 *
 * @param paypalOrderId ID de commande PayPal approuvé par le client.
 * @param orderIdKey    Nom de la clé attendue par le plugin. La valeur par
 *                      défaut `ppcp_paypal_order_id` n'est pas devinée : elle
 *                      a été relevée dans le formulaire réel du checkout
 *                      WordPress, correspond à la métadonnée
 *                      `_ppcp_paypal_order_id` des commandes payées, et a été
 *                      **confirmée par un appel réel** à la Store API le
 *                      22/09/2026 (commande WooCommerce créée avec succès).
 */
export function buildPpcpPaymentData(
  paypalOrderId: string,
  orderIdKey = "ppcp_paypal_order_id",
): Array<{ key: string; value: string }> {
  return [
    { key: "payment_method", value: "ppcp" },
    { key: orderIdKey, value: paypalOrderId },
  ];
}
