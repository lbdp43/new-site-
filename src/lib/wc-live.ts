/**
 * wc-live — helper de lecture du stock WooCommerce live
 *
 * Le fichier `src/data/wc-live.json` est généré/écrasé par
 * `scripts/sync-wc-stock.mjs` exécuté AU PREBUILD. À l'import (build Astro),
 * on lit donc toujours la dernière photo stock connue.
 *
 * Si le script n'a pas pu joindre WC (clés manquantes, WP down) : le fichier
 * contient `source: "empty"` ou conserve l'ancien. Dans tous les cas, les
 * helpers retournent `InStock` par défaut — comportement sûr pour le SEO.
 */
import wcLive from '../data/wc-live.json' with { type: 'json' };

export type WcStockStatus = 'instock' | 'outofstock' | 'onbackorder';

export interface WcLiveProduct {
  stockStatus: WcStockStatus;
  stockQuantity: number | null;
  /** Prix par contenance (cl → EUR). Renseigné pour les produits variables
   *  lorsque `sync-wc-stock.mjs` a pu lire les variations WC. Clés = strings
   *  car JSON. */
  prices?: Record<string, number>;
}

interface WcLiveData {
  generatedAt: string;
  source: 'wc-api' | 'fallback' | 'empty';
  note?: string;
  products: Record<string, WcLiveProduct>;
}

const data = wcLive as WcLiveData;

/**
 * Statut stock brut d'un produit WC. Retourne "instock" par défaut si
 * le produit n'a pas de wcId (ex: coffret-original pas encore créé) ou
 * si aucune donnée live n'a été récupérée.
 */
export function getStockStatus(wcId?: number): WcStockStatus {
  if (!wcId) return 'instock';
  const entry = data.products[String(wcId)];
  return entry?.stockStatus ?? 'instock';
}

/**
 * Valeur Schema.org `availability` correspondante — à injecter directement
 * dans l'Offer / AggregateOffer du schema Product.
 */
export function getSchemaAvailability(wcId?: number): string {
  const status = getStockStatus(wcId);
  switch (status) {
    case 'outofstock':
      return 'https://schema.org/OutOfStock';
    case 'onbackorder':
      return 'https://schema.org/BackOrder';
    case 'instock':
    default:
      return 'https://schema.org/InStock';
  }
}

/** Helper UI : true si le produit est en rupture. */
export function isOutOfStock(wcId?: number): boolean {
  return getStockStatus(wcId) === 'outofstock';
}

/** Helper UI : true si le produit est sur commande (précommande). */
export function isOnBackorder(wcId?: number): boolean {
  return getStockStatus(wcId) === 'onbackorder';
}

/** Quantité en stock (si WC la renvoie, sinon null). */
export function getStockQuantity(wcId?: number): number | null {
  if (!wcId) return null;
  return data.products[String(wcId)]?.stockQuantity ?? null;
}

/** Prix par contenance en cl (synced depuis les variations WC au prebuild).
 *  Retourne `{}` si aucun prix par format n'est disponible — l'UI peut alors
 *  retomber sur le range priceMin/priceMax. */
export function getSizePrices(wcId?: number): Record<number, number> {
  if (!wcId) return {};
  const entry = data.products[String(wcId)];
  if (!entry?.prices) return {};
  const out: Record<number, number> = {};
  for (const [cl, price] of Object.entries(entry.prices)) {
    const clNum = Number(cl);
    if (Number.isFinite(clNum) && Number.isFinite(price) && price > 0) {
      out[clNum] = price;
    }
  }
  return out;
}

/** Prix d'une contenance donnée (cl). Retourne null si non disponible. */
export function getSizePrice(wcId: number | undefined, cl: number): number | null {
  const prices = getSizePrices(wcId);
  return prices[cl] ?? null;
}

/** Méta-info sur la fraîcheur des données (utile pour un badge admin). */
export function getWcLiveMeta() {
  return {
    generatedAt: data.generatedAt,
    source: data.source,
    note: data.note,
    productCount: Object.keys(data.products).length,
  };
}
