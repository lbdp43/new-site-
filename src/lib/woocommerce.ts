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
const STORE_API = BASE ? `${BASE.replace(/\/$/, "")}/wp-json/wc/store/v1` : null;

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!STORE_API) {
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
    res = await fetch(`${STORE_API}${path}`, { ...init, headers });
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
    line_subtotal: string;
    line_total: string;
    currency_code: string;
    currency_minor_unit: number;
  };
}

export interface WcCart {
  items: WcCartItem[];
  items_count: number;
  needs_shipping: boolean;
  needs_payment: boolean;
  totals: {
    total_items: string;
    total_shipping: string;
    total_tax: string;
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
      price: string;
      selected: boolean;
    }>;
  }>;
  payment_methods: string[]; // slugs ex "stripe"
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
  payment_method: string;           // "stripe"
  payment_data: Array<{ key: string; value: string }>; // dont stripe_source = pm_xxx
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
