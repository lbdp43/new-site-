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
 * ✅ **Vérifié en production le 22/09/2026**, depuis
 * `test.labrasseriedesplantes.fr`, sans qu'aucun paiement n'ait eu lieu :
 * `POST /wc-ppcp/v1/cart/order` avec `{payment_method:"ppcp",
 * context:"checkout"}` renvoie une chaîne JSON nue, l'ID de commande PayPal
 * (ex. `"8L3502990F093683F"`). Le `Cart-Token` suffit : ni cookie, ni
 * `woocommerce-process-checkout-nonce`. Exige `astro-cors` ≥ 1.3.0 côté WP.
 *
 * ⚠️ **Les deux autres routes de l'extension ne finalisent pas** — vérifié le
 * 22/09/2026, ne pas y retourner :
 *
 *   `/wc-ppcp/v1/cart/checkout` → route du flux **express** (bouton PayPal
 *      sur une fiche produit ou le panier). Même avec une commande PayPal
 *      réellement approuvée, elle renvoie vers la page de relecture
 *      WordPress et ne crée aucune commande.
 *   `/wc-ppcp/v1/order/pay` → répond 200 avec un corps vide, n'inscrit
 *      aucune note de commande et ne modifie rien (essayé sur #26519).
 *
 * La commande WooCommerce se crée donc par `POST /wc/store/v1/checkout`,
 * comme pour la carte. Reste l'encaissement, dont le nom de champ attendu
 * est traité ci-dessous — voir `wc.finalizePaypalOrder()`.
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Construit le `payment_data` d'un checkout PayPal.
 *
 * 🔑 **Les trois noms candidats sont envoyés ensemble, volontairement.**
 * `payment_data` est une liste de couples clé/valeur que
 * `WooCommerce/StoreApi/Legacy.php` déverse dans `$_POST` ; une clé inconnue
 * de la passerelle est simplement ignorée. Plutôt que de parier sur un nom —
 * ce qui a produit la commande fantôme #26518 — on pose les trois et le
 * plugin lit celui qu'il connaît.
 *
 * Aucun n'est inventé :
 *
 *   `ppcp_paypal_order_id` — champ du formulaire de commande classique
 *                            (relevé réseau), accepté par `cart/checkout`
 *   `paypal_order`         — nom **interne**, renvoyé par le plugin dans son
 *                            `_ppcp_order_review`
 *   `paypal_order_id`      — la métadonnée `_ppcp_paypal_order_id` des
 *                            commandes réellement payées, sans son préfixe
 *
 * `payment_method` est dupliqué ici exprès, comme pour WooPayments :
 * `Legacy.php` **remplace** `$_POST`, donc la valeur de premier niveau du
 * JSON n'atterrit jamais dans `$_POST['payment_method']`.
 *
 * ⚠️ Si un jour le relevé désigne un seul nom avec certitude, réduire cette
 * liste — mais ne jamais la réduire sur une intuition.
 */
export function buildPpcpPaymentData(
  paypalOrderId: string,
): Array<{ key: string; value: string }> {
  return [
    { key: "payment_method", value: "ppcp" },
    { key: "ppcp_paypal_order_id", value: paypalOrderId },
    { key: "paypal_order", value: paypalOrderId },
    { key: "paypal_order_id", value: paypalOrderId },
  ];
}
