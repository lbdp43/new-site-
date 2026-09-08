import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  author: z.enum(['Étienne', 'Guillaume', 'La Brasserie des Plantes']).default('La Brasserie des Plantes'),
  cover: z.string().optional(),
  // Description alt de l'image cover (accessibilité + SEO image).
  // Si absent, le template fallback sur `title` (comportement historique).
  // À renseigner pour les articles dont le cover apporte une info distincte
  // du titre (ex: photo d'atelier, plante, coulisses).
  coverAlt: z.string().optional(),
  category: z.enum(['Plantes', 'Recettes', 'Terroir', 'Fabrication', 'Actualité']),
  readingTime: z.string().default('5 min'),
  // Recipes structurées (opt-in) — émet du schema Recipe @ Schema.org
  // pour les articles de la catégorie "Recettes" qui contiennent des
  // recettes complètes (cocktails). Un article peut en avoir plusieurs.
  // Si présent, un bloc <script type="application/ld+json"> par recette
  // est ajouté dans le <head> par le template [...slug].astro.
  schemaRecipes: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        recipeYield: z.string().default('1 verre'),
        prepTime: z.string().default('PT5M'),
        totalTime: z.string().default('PT5M'),
        recipeCategory: z.string().default('Cocktail'),
        keywords: z.string().optional(),
        recipeIngredient: z.array(z.string()),
        recipeInstructions: z.array(z.string()),
        image: z.string().optional(),
      })
    )
    .optional(),
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
    coverAlt: z.string().optional(),
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
    /** Catégorie SEO descriptive (mot-clé cible). Ex : "Liqueur de
     *  verveine artisanale", "Liqueur de gentiane" — apparaît en kicker
     *  au-dessus du H1 + dans le <title>, la meta description, le schema
     *  Product.category. Sans casser le branding du nom de marque. */
    seoCategory: emptyToUndefined(z.string()),

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

// ─── Pages statiques (contenu éditorial des pages du site) ──────────────
// Chaque page = un .md dans `src/content/static-pages/<slug>.md`.
// Le frontmatter porte les blocs (hero, sections, images, listes) éditables
// via Sveltia CMS. Le body markdown est facultatif (utile pour de la prose).
//
// Objectif : que Guillaume/Étienne puissent modifier textes ET images des
// pages statiques (Ateliers, etc.) sans toucher aux fichiers .astro.
// La structure HTML/Tailwind reste dans le template ; seul le contenu
// éditorial est extrait ici.
const staticPages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/static-pages' }),
  schema: z.object({
    // ─── Meta SEO ────────────────────────────────────────────────
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),

    // ─── Hero (haut de page, vidéo/image + accroche) ─────────────
    hero: z.object({
      kicker: emptyToUndefined(z.string()),
      title: z.string(),
      titleAccent: emptyToUndefined(z.string()),
      intro: emptyToUndefined(z.string()),
      ctaPrimaryLabel: emptyToUndefined(z.string()),
      ctaPrimaryHref: emptyToUndefined(z.string()),
      ctaSecondaryLabel: emptyToUndefined(z.string()),
      ctaSecondaryHref: emptyToUndefined(z.string()),
      video: emptyToUndefined(z.string()),
      videoPoster: emptyToUndefined(z.string()),
      videoAlt: emptyToUndefined(z.string()),
    }),

    // ─── Section "Les deux ateliers" ─────────────────────────────
    workshopsSection: z.object({
      kicker: emptyToUndefined(z.string()),
      title: z.string(),
      intro: emptyToUndefined(z.string()),
    }),

    // ─── Liste des ateliers (2 items) ────────────────────────────
    workshops: z
      .array(
        z.object({
          id: z.string(),
          kicker: z.string(),
          title: z.string(),
          subtitle: z.string(),
          price: z.number(),
          duration: z.string(),
          participants: z.string(),
          ageMin: z.number(),
          language: z.string(),
          includes: z.array(z.string()).default([]),
          steps: z.array(z.string()).default([]),
          image: z.string(),
          gallery: z.array(z.string()).default([]),
          flipped: z.boolean().default(false),
          bookingUrl: z.string(),
        })
      )
      .default([]),

    // ─── Section "Où ça se passe" (lieu + adresse) ───────────────
    locationSection: z.object({
      kicker: emptyToUndefined(z.string()),
      titleLine1: z.string(),
      titleLine2: emptyToUndefined(z.string()),
      intro: emptyToUndefined(z.string()),
      address: z.string(),
      access: emptyToUndefined(z.string()),
      parking: emptyToUndefined(z.string()),
      mapsUrl: emptyToUndefined(z.string()),
      video: emptyToUndefined(z.string()),
      videoPoster: emptyToUndefined(z.string()),
      videoAlt: emptyToUndefined(z.string()),
    }),

    // ─── Section "Votre hôte" (artisan) ──────────────────────────
    artisanSection: z.object({
      kicker: emptyToUndefined(z.string()),
      name: z.string(),
      role: z.string(),
      image: z.string(),
      imageAlt: emptyToUndefined(z.string()),
      bio: z.array(z.string()).default([]),
    }),

    // ─── Section "Privatisation groupes" ─────────────────────────
    groupsSection: z
      .object({
        kicker: emptyToUndefined(z.string()),
        title: z.string(),
        intro: emptyToUndefined(z.string()),
        ctaPrimaryLabel: emptyToUndefined(z.string()),
        ctaPrimaryHref: emptyToUndefined(z.string()),
        ctaSecondaryLabel: emptyToUndefined(z.string()),
        ctaSecondaryHref: emptyToUndefined(z.string()),
      })
      .nullish(),

    // ─── CTA final ───────────────────────────────────────────────
    ctaSection: z
      .object({
        script: emptyToUndefined(z.string()),
        title: z.string(),
        intro: emptyToUndefined(z.string()),
        ctaPrimaryLabel: emptyToUndefined(z.string()),
        ctaPrimaryHref: emptyToUndefined(z.string()),
        ctaSecondaryLabel: emptyToUndefined(z.string()),
        ctaSecondaryHref: emptyToUndefined(z.string()),
      })
      .nullish(),
  }),
});

export const collections = { blog, 'blog-en': blogEn, products, 'static-pages': staticPages };
