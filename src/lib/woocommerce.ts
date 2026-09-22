/**
 * Client WooCommerce Store API (navigateur).
 *
 * Docs : https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce-blocks/docs/third-party-developers/extensibility/rest-api/store-api.md
 *
 * Le Cart-Token est un JWT renvoyé par WC à la première requête panier ; on le
 * stocke dans localStorage pour persister le panier entre les visites. Le Nonce
 * change à chaque mutation : on le met à jour depuis les headers de réponse.
 */


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

/**
 * Page de paiement d'une commande existante, côté WooCommerce.
 *
 * Forme relevée sur de vraies commandes — c'est le champ `payment_url` que
 * WooCommerce renvoie lui-même (ex. #26519) :
 *
 *   {base}/checkout/order-pay/{id}/?pay_for_order=true&key=wc_order_xxx
 *
 * ⚠️ `/checkout/` est le **slug de la page de commande WordPress**. C'est la
 * seule valeur de ce fichier qui dépende d'un réglage WP : la renommer
 * là-bas casserait le tunnel PayPal ici.
 */
function orderPayUrl(orderId: string, orderKey: string): string {
  const base = (BASE ?? "").replace(/\/$/, "");
  return (
    `${base}/checkout/order-pay/${encodeURIComponent(orderId)}/` +
    `?pay_for_order=true&key=${encodeURIComponent(orderKey)}`
  );
}

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
   * Prépare un paiement PayPal en créant la commande WooCommerce **en
   * attente**, puis renvoie l'adresse de sa page de paiement WordPress.
   *
   * ⚠️ **Le front Astro ne parle JAMAIS à PayPal dans ce tunnel.** Il crée
   * une commande, rien d'autre. L'approbation et l'encaissement se font
   * entièrement sur la page WooCommerce, celle que le WordPress sert déjà
   * aujourd'hui à ses vrais clients.
   *
   * C'est la conséquence directe de l'incident du 22/09/2026 : appelée
   * depuis Astro, `POST /wc-ppcp/v1/cart/checkout` **encaisse** puis renvoie
   * vers sa page de relecture **sans créer de commande**. Deux paiements de
   * 16 € ont été débités sans qu'aucune commande n'existe. Aucune
   * vérification côté navigateur ne pouvait l'empêcher : elle juge la
   * réponse, donc après coup.
   *
   * 🔒 **Ce tunnel rend ce scénario impossible, par construction et non par
   * prudence** : la commande existe AVANT qu'une page de paiement ne
   * s'affiche, et le front n'a aucun moyen de déclencher un encaissement.
   * Tout débit est donc nécessairement rattaché à une commande, donc visible
   * en back-office et remboursable depuis WooCommerce.
   *
   * L'étape de création est éprouvée : #26516, #26518 et #26519 ont toutes
   * été créées ainsi, avec les bons montants et la bonne adresse, et aucune
   * n'a donné lieu au moindre débit.
   *
   * ⚠️ `payment_data` ne porte QUE `payment_method`, volontairement. On
   * n'envoie aucun identifiant PayPal : il n'y en a pas à ce stade, et c'est
   * précisément ce qui garantit qu'aucune capture ne peut partir d'ici. Le
   * doublon de `payment_method` reste nécessaire — `Legacy.php` remplace
   * `$_POST`, donc la valeur de premier niveau n'y arriverait jamais.
   */
  async startPaypalOrderPayment(args: {
    billing: WcAddress;
    shipping: WcAddress;
    customerNote?: string;
  }): Promise<{ orderId: string; orderKey: string; payUrl: string }> {
    const result = await this.checkout({
      billing_address: args.billing,
      shipping_address: args.shipping,
      customer_note: args.customerNote || undefined,
      payment_method: "ppcp",
      payment_data: [{ key: "payment_method", value: "ppcp" }],
    });

    const orderId = result.order_id != null ? String(result.order_id) : "";
    const orderKey = result.order_key ?? "";

    if (!orderId || !orderKey) {
      console.error("[PayPal] commande non créée", result);
      throw new Error(
        "La commande n'a pas pu être enregistrée et aucun montant n'a été débité. " +
          "Choisis la carte bancaire, ou réessaie dans un instant.",
      );
    }

    return { orderId, orderKey, payUrl: orderPayUrl(orderId, orderKey) };
  },

  /**
   * Encaisse une commande **déjà créée**, via la route maison du plugin
   * `astro-cors` ≥ 1.4.0 (`POST /lbdp-astro/v1/pay-order`).
   *
   * Côté WordPress, elle appelle `process_payment()` sur la passerelle de la
   * commande — la même méthode publique que WooCommerce invoque sur sa propre
   * page de paiement. On ne passe donc par aucune route de l'extension PayPal :
   * les deux qu'elle expose ont été essayées et écartées (`cart/checkout`
   * renvoie vers sa page de relecture — flux express — et `order/pay` ne fait
   * rien).
   *
   * 🔒 **L'ordre des opérations est la garantie de sûreté** : la commande
   * existe avant tout encaissement, donc un débit sans commande est impossible
   * et tout débit reste visible en back-office et remboursable depuis
   * WooCommerce.
   *
   * ⚠️ **On ne se fie pas à ce que la passerelle prétend.** La route relit la
   * commande en base et renvoie son `status` et son `transaction_id` réels ;
   * c'est sur eux qu'on décide, jamais sur un `result: "success"`.
   */
  async payExistingOrder(args: {
    orderId: string;
    orderKey: string;
    paypalOrderId: string;
  }): Promise<{ status: string | null; transactionId: string; isPaid: boolean }> {
    const raw = await requestWpJson<unknown>("/lbdp-astro/v1/pay-order", {
      method: "POST",
      body: JSON.stringify({
        order_id: args.orderId,
        order_key: args.orderKey,
        ppcp_paypal_order_id: args.paypalOrderId,
      }),
    });

    const res = (raw ?? {}) as {
      status?: string | null;
      transaction_id?: string;
      is_paid?: boolean;
    };

    return {
      status: res.status ?? null,
      transactionId: res.transaction_id ?? "",
      isPaid: res.is_paid === true,
    };
  },

  /**
   * Crée une commande PayPal à partir du panier courant et renvoie son
   * identifiant (ex. `"8L3502990F093683F"`).
   *
   * ⚠️ Exige `astro-cors` ≥ 1.3.0 côté WordPress : WooCommerce n'installe son
   * gestionnaire de session « Store API » que sur `/wc/store/*`, et le plugin
   * étend ce mécanisme aux routes `wc-ppcp`. Sans lui, la route répond 200
   * avec un corps vide — d'où le message explicite plutôt qu'un plantage
   * obscur.
   *
   * ℹ️ Créer une commande PayPal **ne débite rien** : avec `intent=capture`,
   * l'argent ne bouge qu'à l'encaissement, déclenché côté serveur.
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
