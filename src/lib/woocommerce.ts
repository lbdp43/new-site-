/**
 * Client WooCommerce Store API (navigateur).
 *
 * Docs : https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce-blocks/docs/third-party-developers/extensibility/rest-api/store-api.md
 *
 * Le Cart-Token est un JWT renvoyé par WC à la première requête panier ; on le
 * stocke dans localStorage pour persister le panier entre les visites. Le Nonce
 * change à chaque mutation : on le met à jour depuis les headers de réponse.
 */

// `payment-methods.ts` ne dépend de ce fichier que pour des TYPES (effacés au
// build), donc cet import de valeur ne crée pas de cycle à l'exécution.
import { buildPpcpPaymentData } from "./payment-methods";

const BASE = import.meta.env.PUBLIC_WC_BASE_URL as string | undefined;

/**
 * Racine `/wp-json`, et non la Store API directement : le tunnel PayPal a
 * besoin d'appeler `/wc-ppcp/v1/…`, qui vit dans un autre espace de noms.
 * Les deux partagent la même mécanique d'en-têtes (Cart-Token, Nonce), d'où
 * la factorisation dans `requestWpJson`.
 */
const WP_JSON = BASE ? `${BASE.replace(/\/$/, "")}/wp-json` : null;
const STORE_API_PREFIX = "/wc/store/v1";

const CART_TOKEN_KEY = "lbdp_cart_token";
const NONCE_KEY = "lbdp_wc_nonce";

function getCartToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CART_TOKEN_KEY);
}

function setCartToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(CART_TOKEN_KEY, token);
  else window.localStorage.removeItem(CART_TOKEN_KEY);
}

function getNonce(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NONCE_KEY);
}

function setNonce(nonce: string | null) {
  if (typeof window === "undefined") return;
  if (nonce) window.localStorage.setItem(NONCE_KEY, nonce);
  else window.localStorage.removeItem(NONCE_KEY);
}

export interface WcStoreError {
  code: string;
  message: string;
  data?: { status: number };
}

/** Requête vers n'importe quelle route `/wp-json/…` du WordPress. */
async function requestWpJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!WP_JSON) {
    throw new Error(
      "PUBLIC_WC_BASE_URL n'est pas défini — copie .env.example vers .env et renseigne l'URL de ton WordPress.",
    );
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const token = getCartToken();
  if (token) headers.set("Cart-Token", token);

  const nonce = getNonce();
  if (nonce) headers.set("Nonce", nonce);

  let res: Response;
  try {
    res = await fetch(`${WP_JSON}${path}`, { ...init, headers });
  } catch (err) {
    // fetch() lui-même a rejeté (network, CORS preflight, CSP…).
    // On enrichit le message générique "Failed to fetch" avec le contexte utile.
    const reason = err instanceof Error ? err.message : "erreur réseau";
    throw new Error(
      `Impossible de joindre le serveur de paiement (${reason}). Vérifie ta connexion et réessaie. Si le problème persiste, contacte-nous.`,
    );
  }

  // Met à jour le Cart-Token / Nonce si WC en renvoie de nouveaux.
  const newToken = res.headers.get("Cart-Token");
  if (newToken) setCartToken(newToken);
  const newNonce = res.headers.get("Nonce");
  if (newNonce) setNonce(newNonce);

  // Essaie d'abord JSON, sinon récupère le texte brut (pour les 500 HTML).
  const rawText = await res.text();
  let body: unknown = null;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = body as WcStoreError | null;
    if (err?.message) {
      throw new Error(err.message);
    }
    // Pas de JSON parsable — log la réponse brute pour diagnostic + message lisible.
    if (rawText) {
      console.error(`[WC] ${res.status} ${path} — body brut :`, rawText.slice(0, 500));
    }
    const ctx = res.status >= 500 ? "Erreur serveur de paiement" : "Erreur de paiement";
    throw new Error(`${ctx} (HTTP ${res.status}). Réessaie ou contacte-nous si ça persiste.`);
  }

  return body as T;
}

/** Requête vers la Store API (`/wp-json/wc/store/v1/…`). */
function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return requestWpJson<T>(`${STORE_API_PREFIX}${path}`, init);
}

// ---------- Types (sous-ensemble utile) ----------

export interface WcMoney {
  amount: string;        // ex "1200" = 12,00 €
  currency_minor_unit: number; // 2 pour EUR
  currency_code: string; // "EUR"
  currency_symbol: string;
}

export interface WcProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  permalink: string;
  description: string;
  short_description: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    price_range: { min_amount: string; max_amount: string } | null;
    currency_code: string;
    currency_minor_unit: number;
    currency_symbol: string;
  };
  images: Array<{ id: number; src: string; thumbnail: string; alt: string }>;
  variations?: Array<{ id: number; attributes: Array<{ name: string; value: string }> }>;
  is_in_stock: boolean;
  is_purchasable: boolean;
}

export interface WcCartItem {
  key: string;          // identifiant unique de ligne de panier
  id: number;           // product ID
  variation?: Array<{ attribute: string; value: string }>;
  quantity: number;
  name: string;
  short_description: string;
  images: Array<{ src: string; thumbnail: string; alt: string }>;
  prices: WcProduct["prices"];
  totals: {
    // ⚠️ Les montants `*_total` / `*_subtotal` de la Store API sont HORS TAXE,
    // la TVA arrivant à part dans les champs `*_tax`. Voir la note fiscale sur
    // `WcCart.totals`. Pour afficher un prix TTC : `addMinor(a, b)`.
    line_subtotal: string;
    line_subtotal_tax: string;
    line_total: string;
    line_total_tax: string;
    currency_code: string;
    currency_minor_unit: number;
  };
}

export interface WcCart {
  items: WcCartItem[];
  items_count: number;
  needs_shipping: boolean;
  needs_payment: boolean;
  /**
   * ⚠️ **TOUS ces montants sont HORS TAXE, sauf `total_price`.**
   *
   * C'est le piège fiscal de la Store API, et il est contre-intuitif sur une
   * boutique française : WooCommerce est réglé en prix TTC
   * (`prices_include_tax: true`), les fiches produit affichent 55 €… mais la
   * Store API renvoie `total_items: "4583"` et la TVA à part dans
   * `total_items_tax`. Idem pour la livraison : `total_shipping: "1250"` plus
   * `total_shipping_tax: "250"`, pour un forfait facturé **15 € TTC**.
   *
   * Seul `total_price` est TTC. Les deux présentations tombent donc juste
   * (45,83 + 12,50 + 11,67 TVA = 70,00 comme 55,00 + 15,00 = 70,00), ce qui
   * rend l'erreur invisible à un contrôle arithmétique — elle a vécu jusqu'à
   * ce que Guillaume repère « Forfait 12,50 € » le 22/09/2026.
   *
   * **Règle : tout ce qui est montré au client se calcule en TTC**, avec
   * `addMinor()`, et la TVA s'affiche en « dont TVA » puisqu'elle est déjà
   * comprise. Ne jamais afficher un `total_*` brut, sauf `total_price`.
   */
  totals: {
    total_items: string;
    total_items_tax: string;
    total_shipping: string;
    total_shipping_tax: string;
    /** TVA totale, déjà comprise dans `total_price`. */
    total_tax: string;
    /** Le seul montant TTC de ce bloc. */
    total_price: string;
    currency_code: string;
    currency_minor_unit: number;
    currency_symbol: string;
  };
  shipping_rates: Array<{
    destination: unknown;
    package_id: number;
    shipping_rates: Array<{
      rate_id: string;
      name: string;
      /** HORS TAXE — la TVA est dans `taxes`. */
      price: string;
      /** TVA du tarif, à ajouter à `price` pour obtenir le prix payé. */
      taxes: string;
      selected: boolean;
    }>;
  }>;
  /**
   * Passerelles déclarées disponibles par WooCommerce pour CE panier.
   * Relevé le 21/09/2026 sur le WP live : ["woocommerce_payments", "ppcp"].
   * C'est la source de vérité du choix offert au client — on ne code jamais
   * la liste en dur côté Astro.
   */
  payment_methods: string[];
  /**
   * Données publiées par les extensions qui se sont enregistrées auprès de la
   * Store API (`ExtendSchema`). On y trouve notamment `wc_ppcp`, posé par
   * l'extension PayPal (pymntpl-paypal-woocommerce).
   */
  extensions?: Record<string, unknown> & { wc_ppcp?: WcPpcpExtension };
}

/**
 * Bloc `extensions.wc_ppcp` du panier Store API, publié par l'extension
 * « Plugins de paiement pour PayPal WooCommerce » (pymntpl-paypal-woocommerce).
 *
 * ⚠️ Forme relevée à la main sur une réponse réelle le 21/09/2026, PAS lue
 * dans le code du plugin (le WordPress est injoignable depuis l'environnement
 * de dev, et la source du plugin n'est pas récupérable non plus). Tous les
 * champs sont donc optionnels et doivent être lus défensivement : une montée
 * de version du plugin peut en renommer ou en retirer.
 */
export interface WcPpcpExtension {
  needsSetupToken?: boolean;
  cart?: {
    total?: string;
    totalCents?: number;
    needsShipping?: boolean;
    currency?: string;
    countryCode?: string;
    availablePaymentMethods?: string[];
    lineItems?: unknown[];
    shippingOptions?: unknown[];
    selectedShippingMethod?: string | null;
  };
  fastlane?: {
    features?: string[];
    fastlane_flow?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

// ---------- API ----------

export const wc = {
  async listProducts(params: { per_page?: number; search?: string } = {}): Promise<WcProduct[]> {
    const q = new URLSearchParams();
    if (params.per_page) q.set("per_page", String(params.per_page));
    if (params.search) q.set("search", params.search);
    return request<WcProduct[]>(`/products?${q.toString()}`);
  },

  async getProductBySlug(slug: string): Promise<WcProduct | null> {
    const list = await request<WcProduct[]>(`/products?slug=${encodeURIComponent(slug)}`);
    return list[0] ?? null;
  },

  async getCart(): Promise<WcCart> {
    return request<WcCart>("/cart");
  },

  async addItem(args: {
    id: number;
    quantity: number;
    variation?: Array<{ attribute: string; value: string }>;
    /** Metadata libre attachée à la ligne du panier — visible dans l'admin WC.
     *  Utilisé ici pour marquer les bouteilles d'un Coffret DIY (ex:
     *  { cart_item_data: { _coffret_diy: "3", _coffret_position: "1/3" } }).
     *  WC conserve ces données et les affiche sous la ligne dans le BO. */
    cart_item_data?: Record<string, string | number | boolean>;
  }): Promise<WcCart> {
    return request<WcCart>("/cart/add-item", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },

  async updateItem(key: string, quantity: number): Promise<WcCart> {
    return request<WcCart>("/cart/update-item", {
      method: "POST",
      body: JSON.stringify({ key, quantity }),
    });
  },

  async removeItem(key: string): Promise<WcCart> {
    return request<WcCart>("/cart/remove-item", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
  },

  async updateCustomer(args: {
    billing_address?: Partial<WcAddress>;
    shipping_address?: Partial<WcAddress>;
  }): Promise<WcCart> {
    return request<WcCart>("/cart/update-customer", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },

  async selectShippingRate(packageId: number, rateId: string): Promise<WcCart> {
    return request<WcCart>("/cart/select-shipping-rate", {
      method: "POST",
      body: JSON.stringify({ package_id: packageId, rate_id: rateId }),
    });
  },

  async applyCoupon(code: string): Promise<WcCart> {
    return request<WcCart>("/cart/apply-coupon", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  /**
   * Crée une commande PayPal à partir du panier courant et renvoie son
   * identifiant (ex. `"8L3502990F093683F"`).
   *
   * Vérifié en production le 22/09/2026 depuis `test.` : un corps minimal
   * suffit, et le `Cart-Token` identifie le panier — ni cookie de session ni
   * `woocommerce-process-checkout-nonce` ne sont nécessaires ici.
   *
   * ⚠️ Cette route ne lit le `Cart-Token` que si le plugin **`astro-cors`
   * 1.3.0 ou supérieur** est installé sur le WordPress : WooCommerce
   * n'installe son gestionnaire de session « Store API » que sur les routes
   * `/wc/store/*`, et le plugin étend ce mécanisme à `wc-ppcp`. Sans lui, la
   * route répond 200 avec un corps vide — d'où le message explicite
   * ci-dessous plutôt qu'un plantage obscur.
   */
  async createPaypalOrder(): Promise<string> {
    const raw = await requestWpJson<unknown>("/wc-ppcp/v1/cart/order", {
      method: "POST",
      body: JSON.stringify({ payment_method: "ppcp", context: "checkout" }),
    });

    if (typeof raw !== "string" || !raw.trim()) {
      throw new Error(
        "PayPal n'a pas pu préparer le paiement (réponse vide de la boutique). " +
          "Réessaie, ou choisis la carte bancaire.",
      );
    }

    return raw;
  },

  /**
   * Finalise un paiement PayPal **approuvé** par le client.
   *
   * Retour à `POST /wc/store/v1/checkout`, la route de la carte — parce que
   * c'est la seule qui crée la commande WooCommerce de façon fiable et qui
   * renvoie `order_id` + `order_key`. Relevés du 22/09/2026 :
   *
   *   /wc-ppcp/v1/cart/checkout  crée 0 commande, renvoie la page de
   *                              relecture même avec une commande PayPal
   *                              approuvée → c'est la route du flux EXPRESS
   *   /wc-ppcp/v1/order/pay      répond 200 vide, n'inscrit aucune note de
   *                              commande, ne change rien (essayé sur #26519)
   *   /wc/store/v1/checkout      ✅ crée la commande, montants et adresse
   *                              justes (#26516, #26518, #26519)
   *
   * 🔑 **Les trois noms de champ candidats sont envoyés ENSEMBLE.**
   * `payment_data` est une liste de couples clé/valeur que
   * `WooCommerce/StoreApi/Legacy.php` déverse dans `$_POST` ; une clé que la
   * passerelle ne connaît pas est simplement ignorée. Plutôt que de parier
   * sur un nom — ce qui a déjà produit la commande fantôme #26518 — on pose
   * les trois et le plugin prend celui qu'il lit.
   *
   * Les trois ne sont pas inventés : `ppcp_paypal_order_id` est le champ du
   * formulaire de commande classique (relevé réseau) et celui que
   * `cart/checkout` accepte ; `paypal_order` est le nom **interne** que le
   * plugin renvoie dans son `_ppcp_order_review` ; `paypal_order_id` est la
   * métadonnée `_ppcp_paypal_order_id` des commandes payées, sans préfixe.
   *
   * ⚠️ **`payment_method` est dupliqué** dans `payment_data`, comme pour
   * WooPayments : `Legacy.php` REMPLACE `$_POST`, donc la valeur de premier
   * niveau n'y arriverait jamais.
   *
   * **La fonction échoue plutôt que de supposer.** Le plugin répond
   * `payment_status: "success"` aussi bien pour « c'est payé » que pour « il
   * reste à faire approuver » — c'est ce qui avait fait afficher « Merci pour
   * votre commande » sur la commande impayée #26518. On exige donc trois
   * conditions, et on refuse au moindre doute.
   */
  async finalizePaypalOrder(
    paypalOrderId: string,
    args: {
      billing: WcAddress;
      shipping: WcAddress;
      customerNote?: string;
    },
  ): Promise<{ orderId: string; orderKey: string }> {
    const result = await this.checkout({
      billing_address: args.billing,
      shipping_address: args.shipping,
      customer_note: args.customerNote || undefined,
      payment_method: "ppcp",
      payment_data: buildPpcpPaymentData(paypalOrderId),
    });

    const redirect = result.payment_result?.redirect_url ?? "";
    const stillNeedsPayPal = /paypal\.com|_ppcp_order_review/i.test(redirect);
    const notPaidYet = result.status === "pending" || result.status === "failed";

    if (
      result.payment_result?.payment_status !== "success" ||
      stillNeedsPayPal ||
      notPaidYet
    ) {
      console.error("[PayPal] finalisation refusée", {
        order_id: result.order_id,
        status: result.status,
        payment_status: result.payment_result?.payment_status,
        redirect,
      });
      throw new Error(
        "Le paiement n'a pas pu être finalisé et aucun montant n'a été débité. " +
          "Choisis la carte bancaire, ou contacte-nous — ta commande n'a pas été enregistrée comme payée.",
      );
    }

    return { orderId: String(result.order_id), orderKey: result.order_key };
  },

  async checkout(args: WcCheckoutPayload): Promise<WcCheckoutResponse> {
    return request<WcCheckoutResponse>("/checkout", {
      method: "POST",
      body: JSON.stringify(args),
    });
  },

  clearSession() {
    setCartToken(null);
    setNonce(null);
  },
};

// ---------- Types checkout ----------

export interface WcAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;       // ISO-2, ex "FR"
  email?: string;
  phone?: string;
}

export interface WcCheckoutPayload {
  billing_address: WcAddress;
  shipping_address: WcAddress;
  customer_note?: string;
  /** Slug de la passerelle : "woocommerce_payments" (carte) ou "ppcp" (PayPal). */
  payment_method: string;
  /**
   * Couples clé/valeur transmis à la passerelle côté PHP.
   *
   * ⚠️ `WooCommerce/StoreApi/Legacy.php` fait `$_POST = $payment_data`
   * (REMPLACE), donc toute valeur que la passerelle lit dans `$_POST` doit
   * figurer ici — y compris `payment_method`, qu'on duplique volontairement.
   * Cf. le commentaire détaillé dans CheckoutPage.tsx.
   */
  payment_data: Array<{ key: string; value: string }>;
}

export interface WcCheckoutResponse {
  order_id: number;
  status: string;
  order_key: string;
  customer_note: string;
  customer_id: number;
  billing_address: WcAddress;
  shipping_address: WcAddress;
  payment_method: string;
  payment_result: {
    payment_status: "success" | "failure" | "pending" | "error";
    payment_details: Array<{ key: string; value: string }>;
    redirect_url: string;
  };
}
