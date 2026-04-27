/**
 * featurable.ts — fetch des avis Google en temps réel via Featurable au build.
 *
 * Featurable expose l'API publique `https://featurable.com/api/v1/widgets/{id}`
 * qui renvoie l'agrégat (note moyenne + nombre d'avis Google) du widget
 * configuré dans Google Business Profile, ainsi que la liste des derniers
 * avis. Aucune clé API requise (gratuit, no-auth).
 *
 * Ce module mémoïse l'appel : qu'il soit utilisé par 1 ou 50 pages au build,
 * un seul fetch part. Évite de hitter Featurable 116× pour 116 pages générées.
 *
 * Usage typique :
 *   import { getFeaturableAggregate } from '@/lib/featurable';
 *   const agg = await getFeaturableAggregate(); // { ratingValue, reviewCount } | null
 *
 * Si l'API est down (offline build, widgetId invalide, rate limit), le
 * helper renvoie `null` — les composants/templates doivent gérer ce
 * fallback gracieusement (typiquement : ne pas émettre l'aggregateRating
 * dans le schema, plutôt qu'inventer des valeurs).
 */

import { site } from '../data/site';

export interface FeaturableReview {
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: number;
  comment: string;
  createTime: string;
}

export interface FeaturableWidget {
  totalReviewCount: number;
  averageRating: number;
  reviews: FeaturableReview[];
}

export interface FeaturableAggregate {
  /** Note moyenne Google sur 5 (ex : 4.9). */
  ratingValue: number;
  /** Nombre total d'avis Google. */
  reviewCount: number;
}

let _cached: FeaturableWidget | null | undefined;

/**
 * Fetch (mémoïsé) du widget Featurable. Renvoie `null` si le widgetId
 * n'est pas configuré, si l'API échoue, ou si la réponse est invalide.
 * Renvoie l'objet `FeaturableWidget` complet sinon.
 */
export async function getFeaturableWidget(): Promise<FeaturableWidget | null> {
  if (_cached !== undefined) return _cached;

  const id = site.googleBusiness.featurableWidgetId;
  if (!id) {
    _cached = null;
    return null;
  }

  try {
    const res = await fetch(`https://featurable.com/api/v1/widgets/${id}`);
    if (!res.ok) {
      _cached = null;
      return null;
    }
    const data = (await res.json()) as FeaturableWidget;
    // Validation minimale du payload
    if (
      typeof data?.averageRating !== 'number' ||
      typeof data?.totalReviewCount !== 'number' ||
      !Array.isArray(data?.reviews)
    ) {
      _cached = null;
      return null;
    }
    _cached = data;
    return data;
  } catch {
    _cached = null;
    return null;
  }
}

/**
 * Helper raccourci : ne renvoie que l'agrégat (ratingValue + reviewCount).
 * Idéal pour injecter `aggregateRating` dans un schema Schema.org.
 */
export async function getFeaturableAggregate(): Promise<FeaturableAggregate | null> {
  const w = await getFeaturableWidget();
  if (!w) return null;
  return {
    ratingValue: w.averageRating,
    reviewCount: w.totalReviewCount,
  };
}

/**
 * Construit le bloc `aggregateRating` Schema.org à partir des données
 * Featurable. Renvoie `null` si l'API n'a rien donné — le caller doit
 * alors omettre la propriété `aggregateRating` du schema parent.
 *
 * Garanties :
 * - `ratingValue` arrondi à 1 décimale (4.86 → 4.9)
 * - `reviewCount` ≥ 1 (sinon Google ignore le rich-snippet)
 * - `bestRating: 5` et `worstRating: 1` toujours émis pour clarté
 */
export async function buildAggregateRatingSchema(): Promise<{
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
} | null> {
  const agg = await getFeaturableAggregate();
  if (!agg || agg.reviewCount < 1) return null;
  return {
    '@type': 'AggregateRating',
    ratingValue: Math.round(agg.ratingValue * 10) / 10,
    reviewCount: agg.reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}
