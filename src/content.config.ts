import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  author: z.enum(['Étienne', 'Guillaume', 'La Brasserie des Plantes']).default('La Brasserie des Plantes'),
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
    author: z.enum(['Étienne', 'Guillaume', 'La Brasserie des Plantes']).default('La Brasserie des Plantes'),
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
// Sveltia CMS ajoute des valeurs vides (null, '', []) sur tous les champs
// optionnels quand l'utilisateur laisse un champ vide dans l'éditeur. On utilise
// donc .nullish() (= .nullable().optional()) pour accepter null + undefined,
// et on preprocess les strings vides en undefined pour éviter des propriétés
// polluantes dans le JSON généré.
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    // ─── Champs obligatoires ─────────────────────────────────────
    name: z.string().min(1),
    range: z.enum(['brasserie', 'aperitif', 'lumiere-obscure', 'edition-limitee', 'accessoire']),
    priceMin: z.number(),
    priceMax: z.number(),
    image: z.string().min(1),
    alcohol: z.number(),
    usage: z.string().min(1),

    // ─── Listes (Sveltia peut renvoyer [] au lieu de null) ───────
    composition: z.array(z.string()).default([]),
    awards: z.array(z.string()).nullish().transform((v) => v ?? undefined),
    sizes: z.array(z.string()).nullish().transform((v) => v ?? undefined),

    // ─── Strings optionnels (nullish + empty → undefined) ────────
    image2: emptyToUndefined(z.string()),
    tagline: emptyToUndefined(z.string()),
    highlight: emptyToUndefined(z.string()),
    serving: emptyToUndefined(z.string()),
    wcSizeAttribute: emptyToUndefined(z.string()),

    // ─── Numbers optionnels (nullish → undefined) ────────────────
    wcId: z.number().nullish().transform((v) => v ?? undefined),
    defaultSize: z.number().nullish().transform((v) => v ?? undefined),
    order: z.number().nullish().transform((v) => v ?? undefined),

    // ─── Objet tasting — accepte null ou champs vides ────────────
    tasting: z
      .object({
        nose: emptyToUndefined(z.string()),
        palate: emptyToUndefined(z.string()),
        finish: emptyToUndefined(z.string()),
      })
      .nullish()
      .transform((v) => {
        if (!v) return undefined;
        // Si tous les champs sont undefined, retourne undefined (pas d'objet vide)
        if (!v.nose && !v.palate && !v.finish) return undefined;
        return v;
      }),

    // ─── sizeImages en FORMAT LIST (anti-bug CMS avec clés numériques) ─
    // Converti en Record<number, string> par generate-products.mjs.
    sizeImages: z
      .array(
        z.object({
          size: z.coerce.number(),
          image: z.string().min(1),
        })
      )
      .nullish()
      .transform((v) => v ?? undefined),

    // ─── Booleans avec valeur par défaut ─────────────────────────
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, 'blog-en': blogEn, products };
