import { useSyncExternalStore } from "react";
import { wc, type WcCart } from "./woocommerce";

/**
 * Store de panier niveau module — partagé entre toutes les îles Astro (Header,
 * bouton Ajouter, page panier). Pas de React Context : chaque île est un arbre
 * indépendant, donc on passe par un singleton + useSyncExternalStore.
 */

interface CartState {
  cart: WcCart | null;
  loading: boolean;
  error: string | null;
  /** true tant que la première récupération panier n'a pas eu lieu. */
  initialized: boolean;
}

let state: CartState = {
  cart: null,
  loading: false,
  error: null,
  initialized: false,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setState(patch: Partial<CartState>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot(): CartState {
  return {
    cart: null,
    loading: false,
    error: null,
    initialized: false,
  };
}

async function run(fn: () => Promise<WcCart>) {
  setState({ loading: true, error: null });
  try {
    const next = await fn();
    setState({ cart: next, loading: false, initialized: true });
    return next;
  } catch (e) {
    setState({
      loading: false,
      error: e instanceof Error ? e.message : String(e),
      initialized: true,
    });
    throw e;
  }
}

/** Met à jour le panier partagé avec une réponse déjà obtenue (ex: checkout). */
export function setCart(cart: WcCart | null) {
  setState({ cart, initialized: true });
}

export const cartActions = {
  refresh: () => run(() => wc.getCart()),
  addItem: (args: {
    id: number;
    quantity?: number;
    variation?: Array<{ attribute: string; value: string }>;
    cart_item_data?: Record<string, string | number | boolean>;
  }) =>
    run(() => wc.addItem({ quantity: 1, ...args })),
  updateItem: (key: string, quantity: number) => run(() => wc.updateItem(key, quantity)),
  removeItem: (key: string) => run(() => wc.removeItem(key)),
  applyCoupon: (code: string) => run(() => wc.applyCoupon(code)),
  selectShippingRate: (packageId: number, rateId: string) =>
    run(() => wc.selectShippingRate(packageId, rateId)),
  updateCustomer: (args: Parameters<typeof wc.updateCustomer>[0]) =>
    run(() => wc.updateCustomer(args)),
};

/** Hook d'accès depuis n'importe quelle île React. */
export function useCart() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...s,
    itemCount: s.cart?.items_count ?? 0,
    total: s.cart?.totals.total_price ?? "0",
    currency: s.cart?.totals.currency_code ?? "EUR",
    currencySymbol: s.cart?.totals.currency_symbol ?? "€",
    minorUnit: s.cart?.totals.currency_minor_unit ?? 2,
    ...cartActions,
  };
}

/** Formate une somme WC (ex: "1200" en minor units, 2) en "12,00 €". */
export function formatMoney(amount: string, minorUnit: number, symbol = "€"): string {
  const n = Number(amount) / 10 ** minorUnit;
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
}

/**
 * Déclenche un refresh du panier au chargement de l'app. À appeler une seule
 * fois depuis un composant monté très tôt (ex: CartIcon dans le Header).
 */
export function ensureCartLoaded() {
  if (state.initialized || state.loading) return;
  // Tant que PUBLIC_WC_BASE_URL n'est pas configuré, on ne tape pas sur le
  // réseau : on marque comme initialisé avec un panier vide pour afficher
  // "Panier vide" côté UI, sans spammer de 404.
  if (!import.meta.env.PUBLIC_WC_BASE_URL) {
    setState({ initialized: true });
    return;
  }
  void cartActions.refresh().catch(() => {
    /* erreur déjà stockée dans state.error */
  });
}
