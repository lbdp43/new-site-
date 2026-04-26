import { useSyncExternalStore } from "react";
import { wc, type WcCart } from "./woocommerce";

/* ──────────────────────────────────────────────────────────────────────
 * MINI-CART DRAWER
 * État booléen séparé du cart pour piloter l'ouverture/fermeture du
 * MiniCartDrawer (panneau slide-in à droite). Géré au niveau module
 * pour que n'importe quelle île React puisse l'ouvrir ou la fermer.
 * ────────────────────────────────────────────────────────────────────── */

let miniCartOpen = false;
const miniCartListeners = new Set<() => void>();

function emitMiniCart() {
  for (const l of miniCartListeners) l();
}

export function openMiniCart() {
  if (miniCartOpen) return;
  miniCartOpen = true;
  emitMiniCart();
}

export function closeMiniCart() {
  if (!miniCartOpen) return;
  miniCartOpen = false;
  emitMiniCart();
}

export function useMiniCart(): boolean {
  return useSyncExternalStore(
    (l) => {
      miniCartListeners.add(l);
      return () => miniCartListeners.delete(l);
    },
    () => miniCartOpen,
    () => false,
  );
}

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

function hasShippingRates(c: WcCart | null): boolean {
  return (c?.shipping_rates?.[0]?.shipping_rates?.length ?? 0) > 0;
}

async function run(fn: () => Promise<WcCart>, options: { autoPickup?: boolean } = {}) {
  // Auto-pickup : on ne bascule sur le retrait boutique que la **première
  // fois** qu'on voit des shipping_rates dans la session (typiquement
  // l'ajout du premier produit). Sur les opérations suivantes — changement
  // d'adresse, sélection explicite d'un autre mode, ajout d'item après
  // hydratation — on respecte le choix de l'utilisateur, sinon on écrase
  // sa sélection en boucle.
  //
  // Bug avant le 26 avril 2026 : maybeAutoSelectPickup tournait à chaque
  // mutation. Quand l'utilisateur cliquait "Forfait", on partait avec
  // flat_rate, WC répondait OK, puis on relançait maybeAutoSelectPickup
  // qui détectait que pickup n'était plus selected → 2e requête qui
  // remettait pickup. Résultat visuel : "je clique Forfait, ça repasse
  // sur Retrait".
  const previousHadRates = hasShippingRates(state.cart);
  setState({ loading: true, error: null });
  try {
    const next = await fn();
    setState({ cart: next, loading: false, initialized: true });
    if (!previousHadRates && options.autoPickup !== false) {
      void maybeAutoSelectPickup(next);
    }
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

/**
 * Si le panier propose un mode "retrait/pickup" et que c'est PAS lui qui est
 * actuellement sélectionné, on bascule dessus. WooCommerce sélectionne par
 * défaut le mode défini en admin (souvent Colissimo) — sur le front on
 * préfère que la valeur affichée par défaut soit la moins chère pour ne pas
 * "imposer" la livraison payante.
 */
async function maybeAutoSelectPickup(cart: WcCart) {
  const pkg = cart.shipping_rates?.[0];
  if (!pkg) return;
  const rates = pkg.shipping_rates ?? [];
  if (rates.length < 2) return; // Un seul mode → pas de choix à imposer.

  const isPickup = (r: { method_id?: string; rate_id: string; name: string }) => {
    const id = (r.method_id ?? r.rate_id ?? "").toLowerCase();
    const name = (r.name ?? "").toLowerCase();
    return (
      id.includes("local_pickup") ||
      id.includes("pickup") ||
      name.includes("retrait") ||
      name.includes("pickup") ||
      name.includes("boutique")
    );
  };

  const pickup = rates.find(isPickup);
  if (!pickup) return;
  if (pickup.selected) return;

  try {
    const updated = await wc.selectShippingRate(pkg.package_id, pickup.rate_id);
    setState({ cart: updated });
  } catch {
    /* silencieux — le user pourra basculer manuellement */
  }
}

/** Met à jour le panier partagé avec une réponse déjà obtenue (ex: checkout). */
export function setCart(cart: WcCart | null) {
  setState({ cart, initialized: true });
  // Notifie les autres onglets ouverts (header de l'autre onglet va refresh).
  try {
    window.localStorage.setItem("lbdp_cart_synced_at", String(Date.now()));
  } catch {
    /* localStorage indispo */
  }
}

/**
 * À appeler depuis un composant monté très tôt (ex: CartIcon) pour écouter
 * les changements localStorage faits par les AUTRES onglets ouverts (notamment
 * la suppression du Cart-Token après checkout sur un autre onglet, ou les
 * synchros explicites via `lbdp_cart_synced_at`). Quand un changement est
 * détecté, on refresh le panier dans l'onglet courant.
 */
export function subscribeCrossTabSync(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (
      e.key === "lbdp_cart_token" ||
      e.key === "lbdp_wc_nonce" ||
      e.key === "lbdp_cart_synced_at"
    ) {
      void cartActions.refresh().catch(() => {});
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
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
  // autoPickup: false → respect du choix utilisateur. Sans ça, si l'utilisateur
  // sélectionne explicitement Forfait/Colissimo, le run() relancerait
  // maybeAutoSelectPickup juste après et écraserait la sélection.
  selectShippingRate: (packageId: number, rateId: string) =>
    run(() => wc.selectShippingRate(packageId, rateId), { autoPickup: false }),
  // autoPickup: false → un changement d'adresse client (code postal, ville…)
  // ne doit jamais réinitialiser le mode de livraison choisi explicitement.
  updateCustomer: (args: Parameters<typeof wc.updateCustomer>[0]) =>
    run(() => wc.updateCustomer(args), { autoPickup: false }),
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
