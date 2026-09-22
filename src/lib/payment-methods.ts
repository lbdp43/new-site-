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
 * PayPal — pourquoi le tunnel headless a été abandonné
 *
 * 🛑 **Incident du 22/09/2026.** Appelée depuis Astro,
 * `POST /wc-ppcp/v1/cart/checkout` **encaisse réellement l'argent**, puis
 * renvoie vers sa page de relecture **sans créer la moindre commande
 * WooCommerce**. Deux paiements de 16 € ont été débités et aucune commande
 * n'existait côté boutique : ni #26520 ni #26521, total resté à 512.
 *
 * Pire que la commande fantôme #26518 : là, une commande existait au moins.
 * Ici, pas de commande — donc pas d'e-mail, pas de préparation, pas de stock
 * décrémenté, rien dans EasyBeer.
 *
 * ⚠️ **Le garde-fou du front n'y pouvait rien, et aucun autre ne le pourrait.**
 * Il juge la réponse HTTP, donc *après* l'encaissement. Aucune vérification
 * côté navigateur n'empêche une passerelle de débiter.
 *
 * ⚠️ **Et aucune sonde ne pouvait le prévoir** : toutes utilisaient une
 * commande PayPal non approuvée, donc incapturable par construction. Elles
 * concluaient « cette route ne fait rien ». Elle débite.
 *
 * ✅ **D'où le tunnel actuel** (`wc.startPaypalOrderPayment`) : Astro crée la
 * commande WooCommerce **en attente**, puis redirige vers la page de paiement
 * WordPress. Le front ne parle jamais à PayPal et n'a aucun moyen technique
 * de déclencher un débit. Un encaissement sans commande n'est plus
 * improbable, il est **impossible** — et tout débit reste remboursable depuis
 * WooCommerce.
 *
 * Le prix à payer est une page WordPress en fin de tunnel. C'est assumé.
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Le tunnel PayPal existe et ne peut pas encaisser sans commande.
 *
 * ⚠️ Ce verrou ne doit **jamais** être remis à `true` pour un tunnel où le
 * front déclenche lui-même l'encaissement. Ce qui l'autorise ici, ce n'est
 * pas la confiance dans le code : c'est que ce chemin rend la faute
 * structurellement impossible.
 */
const PPCP_FLOW_IMPLEMENTED = true;

const PPCP_ENABLED = import.meta.env.PUBLIC_PPCP_ENABLED === "true";

/**
 * true seulement si le tunnel existe ET qu'il est activé côté environnement.
 *
 * ℹ️ `PUBLIC_PAYPAL_CLIENT_ID` n'est **plus requise** : le SDK JavaScript de
 * PayPal n'est plus chargé du tout, puisque c'est WooCommerce qui présente le
 * bouton sur sa propre page. La variable peut être retirée de Vercel.
 */
export function isPpcpConfigured(): boolean {
  return PPCP_FLOW_IMPLEMENTED && PPCP_ENABLED;
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
 * ⚠️ **Routes de l'extension essayées et écartées le 22/09/2026.** Ne pas y
 * retourner sans élément nouveau :
 *
 *   `/wc-ppcp/v1/cart/order`    crée une commande PayPal depuis le panier ;
 *                               fonctionne en headless, mais n'est plus
 *                               utilisée — le front ne parle plus à PayPal
 *   `/wc-ppcp/v1/cart/checkout` flux **express** : ENCAISSE puis renvoie vers
 *                               la page de relecture sans créer de commande.
 *                               C'est la cause de l'incident.
 *   `/wc-ppcp/v1/order/pay`     200, corps vide, aucune note de commande,
 *                               aucun effet (essayé sur #26519)
 *
 * La création de commande, elle, est fiable par `POST /wc/store/v1/checkout`
 * et ne débite rien (#26516, #26518, #26519 : aucune n'a donné lieu à un
 * mouvement d'argent). C'est ce que fait `wc.startPaypalOrderPayment()`.
 * ────────────────────────────────────────────────────────────────────── */
