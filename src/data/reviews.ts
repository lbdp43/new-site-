// Avis clients — vidé le 2026-04-28 suite à audit compliance.
//
// 🚨 Historique : ce fichier contenait jusqu'au 2026-04-27 17 avis avec
// "noms d'emprunt" (mention explicite dans le commentaire de tête)
// affichés sur les fiches produit + home avec un badge `verified: true`.
// L'audit conformité a flaggé un risque DGCCRF :
//   - L. 121-2 du Code de la consommation (pratique commerciale trompeuse)
//   - Directive Omnibus 2022 (transparence sur l'authenticité des avis)
// Sanction théorique : amende jusqu'à 300 000 € + 2 ans de prison.
//
// Décision : les avis internes sont retirés. Les rich-snippets étoiles +
// la preuve sociale sont désormais alimentés UNIQUEMENT par les vrais
// avis Google via Featurable (38 avis, note 5/5) — voir
// `src/lib/featurable.ts` et `src/components/GoogleReviewsEmbed.astro`.
// Le composant `GoogleReviewsEmbed` détecte automatiquement l'absence
// d'avis internes et utilise Featurable comme source unique.
//
// Si on veut un jour réintroduire des avis "internes" :
//  - Soit collecter de VRAIS avis (via WooCommerce Reviews ou Trustpilot)
//  - Soit clairement étiqueter "Témoignage éditorial" (pas un avis)
// Dans tous les cas, plus jamais de noms d'emprunt avec verified: true.

export interface Review {
  productSlug: string | null;
  author: string;
  context: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified?: boolean;
}

export const reviews: Review[] = [];

export const reviewsByProduct = (_slug: string) => [] as Review[];

export const globalReviews: Review[] = [];

/** Moyenne & comptage pour AggregateRating schema. */
export const aggregateRating = (subset: Review[]) => {
  if (subset.length === 0) return null;
  const avg = subset.reduce((s, r) => s + r.rating, 0) / subset.length;
  return {
    ratingValue: Math.round(avg * 10) / 10,
    reviewCount: subset.length,
  };
};

export const globalAggregate = aggregateRating(reviews);
