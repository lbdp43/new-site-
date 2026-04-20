import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  author: z.enum(['Étienne', 'Guillaume', 'Bastien', 'La Brasserie des Plantes']).default('La Brasserie des Plantes'),
  cover: z.string().optional(),
  category: z.enum(['Plantes', 'Recettes', 'Terroir', 'Fabrication', 'Actualité']),
  readingTime: z.string().default('5 min'),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: blogSchema,
});

// English blog — miroir partiel du blog FR. Les slugs correspondent
// (traduction en sous-dossier plutôt qu'en slug distinct pour simplifier le
// mapping hreflang). Catégories EN mappées à l'affichage.
const blogEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog-en' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.enum(['Étienne', 'Guillaume', 'Bastien', 'La Brasserie des Plantes']).default('La Brasserie des Plantes'),
    cover: z.string().optional(),
    category: z.enum(['Plants', 'Recipes', 'Terroir', 'Craft', 'News']),
    readingTime: z.string().default('5 min'),
  }),
});

// ─── Catalogue produits ──────────────────────────────────────────────────
// Chaque produit a son fichier .md dans `src/content/products/<slug>.md`.
// Le frontmatter YAML porte les données structurées (prix, images, taste
// notes…), le body markdown porte la description longue.
//
// Source de vérité éditoriale : ces .md (éditables via Sveltia CMS à /admin/).
// Source de vérité e-commerce : WooCommerce (prix, stock, variations) via
// `sync-wc-stock.mjs` au prebuild → `src/data/wc-live.json`.
//
// Au prebuild, `scripts/generate-products.mjs` lit ces .md et écrit un
// `src/data/products.generated.json` consommé par `src/data/products.ts`.
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    range: z.enum(['brasserie', 'aperitif', 'lumiere-obscure', 'edition-limitee', 'accessoire']),
    priceMin: z.number(),
    priceMax: z.number(),
    image: z.string(),
    image2: z.string().optional(),
    alcohol: z.number(),
    composition: z.array(z.string()).default([]),
    usage: z.string(),
    tagline: z.string().optional(),
    highlight: z.string().optional(),
    tasting: z
      .object({
        nose: z.string().optional(),
        palate: z.string().optional(),
        finish: z.string().optional(),
      })
      .optional(),
    awards: z.array(z.string()).optional(),
    serving: z.string().optional(),
    sizes: z.array(z.string()).optional(),
    // YAML keys are strings ; on les coerce en number pour sizeImages
    sizeImages: z.record(z.string(), z.string()).optional(),
    wcId: z.number().optional(),
    wcSizeAttribute: z.string().optional(),
    defaultSize: z.number().optional(),
    // draft: true = produit détecté côté WC mais pas encore complété éditorialement
    // → pas affiché sur le site (ni boutique, ni sitemap)
    draft: z.boolean().default(false),
    // ordre d'affichage dans la gamme (plus petit = en premier)
    order: z.number().optional(),
  }),
});

export const collections = { blog, 'blog-en': blogEn, products };
