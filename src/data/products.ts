// Catalogue produits — 18+ références
//
// ⚠️  Ce fichier est un THIN WRAPPER. La source de vérité éditoriale est
//     désormais la Content Collection `products` (src/content/products/*.md).
//     Édition possible via Sveltia CMS à /admin/ (collection "Produits").
//
//     Au `prebuild`, le script `scripts/generate-products.mjs` lit les .md
//     et écrit `src/data/products.generated.json` que ce fichier consomme.
//
//     Les 14 fichiers qui importaient `products` / `ranges` / `Product` /
//     `featuredProducts` / `productsBySlug` continuent de fonctionner sans
//     modification — l'API publique est strictement identique à l'ancien
//     fichier all-in-TS.

import generated from './products.generated.json' with { type: 'json' };

export type ProductRange = 'brasserie' | 'aperitif' | 'lumiere-obscure' | 'edition-limitee' | 'accessoire';

export interface Product {
  slug: string;
  name: string;
  range: ProductRange;
  priceMin: number;
  priceMax: number;
  image: string;
  image2?: string;
  alcohol: number;
  composition: string[];
  usage: string;
  tagline?: string;
  highlight?: string;
  description?: string;
  tasting?: {
    nose?: string;
    palate?: string;
    finish?: string;
  };
  awards?: string[];
  serving?: string;
  sizes?: string[];
  sizeImages?: Record<number, string>;
  wcId?: number;
  wcSizeAttribute?: string;
  defaultSize?: number;
  order?: number;
}

// Metadata des 5 gammes — reste en code (texte SEO stable, non éditable via
// CMS pour éviter des erreurs). À déplacer en collection si besoin.
export const ranges: Record<ProductRange, { name: string; baseline: string; description: string }> = {
  brasserie: {
    name: 'Brasserie des Plantes',
    baseline: "Nos liqueurs signature — digestifs et apéritifs aux plantes oubliées d'Auvergne.",
    description:
      "Le cœur de notre savoir-faire. Des liqueurs de 18 à 50°, conçues autour d'assemblages complexes de plantes médicinales et aromatiques. Digestifs de prestige, liqueurs florales, fruits rouges — la gamme couvre toute une palette de moments.",
  },
  aperitif: {
    name: 'Gamme Apéritif',
    baseline: 'Des apéritifs amers ou gourmands, 15 à 17,5°, à servir givrés.',
    description:
      "Plus légers en alcool, plus vifs, conçus pour ouvrir les rassemblements. De l'alternative française à la Suze (Cerf'Gent) à la menthe en triple alliance (Menthor), en passant par la praline (Pralicoquine) et les agrumes (Zéleste).",
  },
  'lumiere-obscure': {
    name: 'Lumière Obscure',
    baseline: 'Liqueurs au CBD — chanvre sans THC, associé aux plantes.',
    description:
      "Une gamme à part, où le chanvre rencontre nos plantes signatures — menthe verte, verveine, absinthe. Sans effet psychoactif, une autre approche de la détente botanique.",
  },
  'edition-limitee': {
    name: 'Éditions limitées & cuvées',
    baseline: 'Vieillissements en fût, hommages, tirages confidentiels.',
    description:
      "Quelques bouteilles par an, numérotées. L'Herbe des Druides en finition fût de chêne, l'Alchimie Végétale Cuvée Michel — des produits rares, à offrir ou à garder.",
  },
  accessoire: {
    name: 'Coffrets & accessoires',
    baseline: 'Pour emporter la Brasserie avec soi.',
    description:
      "Coffret d'initiation, flasque 20cl + entonnoir — nos indispensables pour découvrir ou offrir.",
  },
};

// Cast du JSON en tableau typé. Le JSON a été généré selon le schéma Zod de
// content.config.ts — on fait confiance au build-time pour la validité.
export const products: Product[] = (generated as { products: Product[] }).products;

export const featuredProducts: Product[] = [
  'alchimie-vegetale',
  'herbe-des-druides',
  'gorgeon-des-machures',
  'cerf-gent',
  'nectar-ostara',
  'fleche-ardente',
]
  .map((slug) => products.find((p) => p.slug === slug))
  .filter((p): p is Product => p !== undefined);

export const productsBySlug: Record<string, Product> = Object.fromEntries(
  products.map((p) => [p.slug, p])
);
