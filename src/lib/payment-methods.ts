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
 * PayPal — l'ordre des opérations est toute la sûreté du tunnel
 *
 * Le tunnel retenu (`PayPalCheckoutButton`) fait, dans cet ordre :
 *
 *   1. `wc.createPaypalOrder()`        commande PayPal, rien n'est débité
 *   2. approbation du client           toujours rien, `intent=capture`
 *   3. `POST /wc/store/v1/checkout`    la commande WooCommerce est créée
 *   4. `wc.payExistingOrder()`         encaissement, **côté serveur**
 *   5. relecture du statut réel        `is_paid` + `transaction_id`
 *
 * 🔒 **La commande est créée AVANT l'encaissement**, et ce n'est pas un
 * détail : tout débit est ainsi rattaché à une commande, donc visible en
 * back-office et remboursable depuis WooCommerce. Encaisser d'abord
 * laisserait la porte ouverte à un débit sans trace côté boutique.
 *
 * ⚠️ **Aucun garde-fou côté navigateur n'empêche une passerelle de débiter.**
 * Le front juge la réponse HTTP, donc *après* coup. La sûreté vient de
 * l'ordre des appels, pas des vérifications.
 *
 * ⚠️ **Une sonde ne prouve rien sur l'encaissement** : elle travaille sur une
 * commande PayPal non approuvée, donc incapturable par construction. Elle ne
 * dit que « le plugin a compris la requête ».
 *
 * ⚠️ **Ne jamais revenir à `/wc-ppcp/v1/cart/checkout`** : c'est la route du
 * flux **express**, elle renvoie vers la page de relecture du plugin au lieu
 * de finaliser. Écartée le 22/09/2026, ne pas y retourner sans élément neuf.
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Le tunnel PayPal existe et ne peut pas encaisser sans commande.
 *
 * ⚠️ Ce verrou ne doit **jamais** être remis à `true` pour un tunnel qui
 * encaisserait avant d'avoir créé la commande WooCommerce. Ce qui l'autorise
 * ici, ce n'est pas la confiance dans le code : c'est que l'ordre des appels
 * rend la faute structurellement impossible.
 */
const PPCP_FLOW_IMPLEMENTED = true;

const PPCP_ENABLED = import.meta.env.PUBLIC_PPCP_ENABLED === "true";
const PAYPAL_CLIENT_ID = import.meta.env.PUBLIC_PAYPAL_CLIENT_ID as string | undefined;

/**
 * true seulement si le tunnel existe ET qu'il est activé et configuré.
 *
 * ⚠️ `PUBLIC_PAYPAL_CLIENT_ID` est **de nouveau requise** : le client restant
 * sur le site Astro (arbitrage Guillaume du 22/09/2026), c'est bien nous qui
 * chargeons le SDK PayPal. Sans elle, le bouton ne peut pas s'afficher — on
 * préfère donc ne pas proposer PayPal du tout plutôt qu'un bouton mort.
 */
export function isPpcpConfigured(): boolean {
  return PPCP_FLOW_IMPLEMENTED && PPCP_ENABLED && Boolean(PAYPAL_CLIENT_ID);
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
 * Ce qu'on sait des commandes PayPal réelles
 *
 * Lu sur deux vraies commandes du WP live (#26042, #25926) :
 *
 *   payment_method       = "ppcp"
 *   payment_method_title = "PayPal - {email du payeur}"
 *   transaction_id       = ID de CAPTURE PayPal   (ex 5KY21287UR815640M)
 *   meta _ppcp_paypal_order_id = ID de COMMANDE PayPal
 *   meta _ppcp_environment, _paypal_fee, _paypal_net
 *
 * 👉 **C'est le seul critère valable pour dire « c'est payé »** :
 * `transaction_id` non vide et statut « En cours ». Ni une page de
 * confirmation, ni un `payment_status: "success"` dans une réponse HTTP ne
 * prouvent quoi que ce soit — les deux ont déjà menti (#26518).
 *
 * ⚠️ **Routes de l'extension, statut au 22/09/2026** :
 *
 *   `/wc-ppcp/v1/cart/order`    crée une commande PayPal depuis le panier ;
 *                               fonctionne en headless avec le seul
 *                               `Cart-Token` (pont `astro-cors` ≥ 1.3.0).
 *                               ✅ C'est l'étape 1 du tunnel.
 *   `/wc-ppcp/v1/cart/checkout` flux **express** : renvoie vers la page de
 *                               relecture (`_ppcp_order_review`) au lieu de
 *                               finaliser. Écartée.
 *   `/wc-ppcp/v1/order/pay`     200, corps vide, aucune note de commande,
 *                               aucun effet (essayé sur #26519). Écartée.
 *
 * La création de commande, elle, est fiable par `POST /wc/store/v1/checkout`
 * et ne débite rien (#26516, #26518, #26519 : aucune n'a donné lieu à un
 * mouvement d'argent). C'est ce que fait `wc.startPaypalOrderPayment()`.
 * L'encaissement passe ensuite par `wc.payExistingOrder()`.
 * ────────────────────────────────────────────────────────────────────── */
