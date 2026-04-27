# Audit Schema.org — La Brasserie des Plantes
**Date** : 2026-04-27  
**Périmètre** : 8 pages échantillon sur https://test.labrasseriedesplantes.fr  
**Outil** : fetch + extraction JSON-LD par regex Python  
**Statut** : COMPLET

---

## 1. Tableau de couverture

| Type Schema | Présent sur | Absent de | Validité |
|---|---|---|---|
| `LocalBusiness` + `Organization` (tableau) | `/`, `/en/` | toutes les autres pages | ✅ Valide |
| `WebSite` (avec `SearchAction`) | `/`, `/en/` | toutes les autres pages | ✅ Valide |
| `VideoObject` | `/`, `/en/` | toutes les autres pages | ✅ Valide |
| `Product` (avec `AggregateOffer`) | `/boutique/alchimie-vegetale`, `/boutique/cerf-gent` | — | ⚠️ Voir §2 |
| `BreadcrumbList` | toutes les pages auditées | — | ✅ Valide |
| `ItemList` | `/boutique` | — | ✅ Valide |
| `CollectionPage` | `/boutique` | — | ✅ Valide |
| `BlogPosting` | 3 articles auditées | — | ⚠️ Voir §2 |
| `FAQPage` | `/faq` | — | ⚠️ Voir §4 (info) |
| `Person` (inline dans BlogPosting) | 3 articles auditées | — | ✅ Valide |
| **`Recipe`** | **AUCUNE** | `/blog/nos-cocktails-signature` | **MANQUANT** |
| **`keywords` sur BlogPosting** | **AUCUN** | tous les articles | **MANQUANT** |
| **`AggregateRating` sur Product** | **AUCUN** | fiches produit | **MANQUANT** (si vous avez des avis) |

---

## 2. Validation errors

### 2a. `Product` — fiches alchimie-vegetale et cerf-gent

| Champ | Statut | Détail |
|---|---|---|
| `@context` | ✅ `https://schema.org` | |
| `@type` | ✅ `Product` | |
| `name` | ✅ | |
| `description` | ✅ Présent | **Attention** : contient du Markdown brut (astérisques, crochets de liens) — Google peut l'afficher tel quel dans les rich results. Voir §2b. |
| `image` | ✅ Array d'URLs absolues | |
| `brand` | ✅ | |
| `sku` | ✅ | |
| `mpn` | ✅ | |
| `offers` | ✅ `AggregateOffer` avec `lowPrice`, `highPrice`, `priceCurrency`, `availability` | |
| `offers.availability` | ✅ `https://schema.org/InStock` | Valeur live. Correct. |
| `offers.priceValidUntil` | ✅ `2027-12-31` | |
| `offers.seller` | ❌ **Absent** | Google recommande `seller` dans `Offer`/`AggregateOffer` pour lier le marchand. Ajouter `"seller": {"@id": "https://labrasseriedesplantes.fr#localbusiness"}` |
| `gtin` | ❌ Absent | Pas critique si vous n'avez pas de code-barres EAN enregistré — à sauter |
| `aggregateRating` | ❌ Absent | À ajouter si/quand vous collectez des avis clients (voir §4) |
| `category` | ✅ Présent (`seoCategory`) | |
| `award` | ✅ Présent | Non-standard mais Google le tolère |
| `inLanguage` | ✅ `fr-FR` | Propriété non standard sur `Product` — sans gravité |

### 2b. `Product.description` contient du Markdown brut

La description extraite du `.md` contient des `**gras**`, `[liens](/url)`, `##` titres, etc. Google les affiche tels quels dans les rich results de type Shopping Graph. Ce n'est pas un bris de validation mais c'est une mauvaise UX dans les SERP.

**Correction** : dans `src/pages/boutique/[slug].astro`, nettoyer la description avant injection dans le schema :

```ts
// Nettoyage Markdown → texte brut pour le schema JSON-LD
const plainDescription = (product.description ?? '')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // liens Markdown → texte
  .replace(/#{1,6}\s+/g, '')                   // titres
  .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')   // gras/italique
  .replace(/\n+/g, ' ')
  .trim()
  .slice(0, 5000);
```

### 2c. `BlogPosting` — articles

| Champ | Statut | Détail |
|---|---|---|
| `@context` | ✅ `https://schema.org` | |
| `@type` | ✅ `BlogPosting` | |
| `headline` | ✅ | |
| `description` | ✅ | |
| `datePublished` | ✅ ISO 8601 | |
| `dateModified` | ✅ ISO 8601 | |
| `author` | ✅ `Person` avec `jobTitle`, `description`, `worksFor` | |
| `publisher` | ✅ `@id` vers LocalBusiness | |
| `image` | ⚠️ **Chemin `.jpg` pour alchimie-vegetale** alors que le fichier est `.webp` | `"image": "https://labrasseriedesplantes.fr/images/products/alchimie-vegetale-2.jpg"` — si le fichier n'existe pas, c'est un 404 côté Googlebot. Corriger en `.webp`. |
| `wordCount` | ✅ | |
| `mainEntityOfPage` | ✅ | |
| `articleSection` | ✅ | |
| `keywords` | ❌ **Absent** | Propriété recommandée pour Article — voir §4 |
| `inLanguage` | ✅ | |

### 2d. `LocalBusiness` / `Organization` — Home FR

| Champ | Statut | Détail |
|---|---|---|
| `@type` | ✅ Tableau `["LocalBusiness","Organization"]` | |
| `@id` | ✅ URL absolue | |
| `image` | ⚠️ **Dupliqué** : même URL deux fois dans le tableau `image` | `"image":["https://labrasseriedesplantes.fr/images/brand/logo-complet-fond-blanc.webp","https://labrasseriedesplantes.fr/images/brand/logo-complet-fond-blanc.webp"]` — doublon inutile, supprimer le second. |
| `openingHours` | ⚠️ **Dupliqué avec `openingHoursSpecification`** | Les deux sont présents et encodent les mêmes horaires. Garder uniquement `openingHoursSpecification` (plus riche, recommandé par Google). |
| `vatID` et `taxID` | ⚠️ **Identiques** | SIRET `89920152900018` mis dans les deux champs. `vatID` = numéro TVA intracommunautaire (FR + 11 chiffres). `taxID` = identifiant fiscal. Le SIRET n'est ni l'un ni l'autre. Corriger ou supprimer les deux. |
| `founders` | ⚠️ `Person` sans `url` ni `sameAs` | Pas bloquant mais incomplet. |

### 2e. `LocalBusiness` Home EN — slogan problématique

```json
"slogan": "Craft botanical liqueurs from Auvergne"
```

Ce slogan contient `from Auvergne` appliqué à la marque, ce qui est acceptable (la maison est en Auvergne). Mais le champ `keywords` contient `"Auvergne liqueur"` — à surveiller selon la règle plantes/sourcing du projet (ici on qualifie la maison, pas les plantes, donc conforme).

---

## 3. Schemas en double sur une même page

| Page | Problème |
|---|---|
| `/` et `/en/` | `LocalBusiness` + `Organization` en tableau `@type` dans le **même** bloc JSON-LD : correct, pas de doublon. |
| `/` et `/en/` | `openingHours` ET `openingHoursSpecification` encodent les mêmes horaires → doublon sémantique. |
| `/` et `/en/` | Tableau `image` avec deux fois la même URL → doublon. |
| Fiches produit | `Product` + `BreadcrumbList` dans un seul tableau JSON-LD avec deux `@context` séparés → structure correcte (tableau de deux blocs distincts). Pas de problème. |

---

## 4. Opportunités d'enrichissement

### 4a. `Recipe` sur `/blog/nos-cocktails-signature` — PRIORITÉ HAUTE

L'article contient 5 recettes de cocktails complètes avec ingrédients et instructions. Google peut afficher des rich results Recipe (carrousel, Google Discover). L'article est catégorie `Recettes`, le contenu est parfait. Voir §5 pour le JSON-LD complet.

### 4b. `ItemList` de `Recipe` sur `/blog/nos-cocktails-signature` — ALTERNATIVE

Si on ne veut pas 5 blocs `Recipe` séparés : un seul bloc `ItemList` pointant vers une `Recipe` par position. Moins riche visuellement mais plus simple. La solution §5 utilise un tableau de 5 `Recipe` (format recommandé pour les rich results carrousel).

### 4c. `keywords` sur `BlogPosting` — PRIORITÉ MOYENNE

Google n'affiche pas `keywords` dans les rich results mais le champ renforce le signal sémantique pour le Knowledge Graph et les citations LLM/IA.

**Où ajouter** : dans `src/content.config.ts` (champ `keywords` optionnel) + dans `[...slug].astro` (injection dans `articleSchema`). Voir §6.

### 4d. `AggregateRating` sur `Product` — PRIORITÉ BASSE (conditionnel)

Si vous intégrez un jour des avis clients (WooCommerce reviews, Trustpilot, etc.), ajouter :

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.9",
  "reviewCount": "47",
  "bestRating": "5",
  "worstRating": "1"
}
```

Sans données réelles, ne pas inventer de valeurs — pénalité manuelle Google.

### 4e. `FAQPage` sur `/faq` — PRIORITÉ INFO (pas d'action requise)

La page `/faq` émet déjà un bloc `FAQPage` avec 12 questions. Techniquement valide.

**Contexte** : depuis août 2023, Google a **restreint** les rich results FAQ aux sites gouvernementaux et de santé. Pour un site e-commerce de liqueurs artisanales, ce schema ne génèrera **pas** de rich result Google Search.

**Ce qui reste valide** : les assistants IA (ChatGPT, Perplexity, Gemini) lisent et citent le `FAQPage` pour répondre aux questions des utilisateurs. Si votre priorité est la GEO (Generative Engine Optimization), ce schema a de la valeur — conservez-le.

**Action** : aucune. Le schema existant est correct et utile pour les LLMs. Ne pas le supprimer.

### 4f. `HowTo` sur `/blog/reconnaitre-vraie-liqueur-artisanale-checklist` — NON RECOMMANDÉ

L'article est une checklist en 5 points qui se prêterait structurellement à un `HowTo`. Cependant, **Google a retiré les rich results HowTo en septembre 2023**. Implémenter ce schema n'apporterait aucun bénéfice SERP. Ne pas l'ajouter.

### 4g. `seller` manquant dans `AggregateOffer` — PRIORITÉ BASSE

Ajouter dans les deux fiches produit auditées :

```json
"seller": {
  "@id": "https://labrasseriedesplantes.fr#localbusiness"
}
```

---

## 5. Code JSON-LD à copier-coller

### 5a. `Recipe` × 5 pour `/blog/nos-cocktails-signature`

À insérer dans une balise `<script type="application/ld+json">` **en plus** du `BlogPosting` existant. Le tableau ci-dessous peut contenir les 5 recettes dans un seul bloc JSON-LD.

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Le Spritz Efflorescent",
    "description": "Apéritif floral printemps/été à base de Nectar d'Ostara. Sureau, bleuet, mandarine et Prosecco.",
    "author": {
      "@type": "Person",
      "name": "Guillaume",
      "worksFor": { "@id": "https://labrasseriedesplantes.fr#localbusiness" }
    },
    "datePublished": "2024-06-18",
    "image": "https://labrasseriedesplantes.fr/images/cocktails/spritz-efflorescent.webp",
    "recipeCategory": "Cocktail",
    "recipeCuisine": "Française",
    "recipeYield": "1 verre",
    "prepTime": "PT3M",
    "totalTime": "PT3M",
    "keywords": "cocktail liqueur artisanale, apéritif floral, sureau, Nectar d'Ostara",
    "recipeIngredient": [
      "4 cl de Nectar d'Ostara",
      "2 cl de Mandarine Napoléon",
      "8 cl de Prosecco bien frais",
      "Eau pétillante (à compléter)",
      "Glaçons",
      "1 rondelle d'orange fraîche"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "text": "Remplir un grand verre à vin de beaucoup de glace."
      },
      {
        "@type": "HowToStep",
        "text": "Ajouter 4 cl de Nectar d'Ostara puis 2 cl de Mandarine Napoléon."
      },
      {
        "@type": "HowToStep",
        "text": "Compléter avec 8 cl de Prosecco bien frais, puis un trait d'eau pétillante."
      },
      {
        "@type": "HowToStep",
        "text": "Remuer une seule fois avec une cuillère de bar. Zester de l'orange par-dessus avant de servir."
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://labrasseriedesplantes.fr/blog/nos-cocktails-signature"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Le Philtre d'Éros",
    "description": "Cocktail gourmand fruits rouges et vanille à base de La Flèche Ardente, gin London Dry et citron frais.",
    "author": {
      "@type": "Person",
      "name": "Guillaume",
      "worksFor": { "@id": "https://labrasseriedesplantes.fr#localbusiness" }
    },
    "datePublished": "2024-06-18",
    "image": "https://labrasseriedesplantes.fr/images/cocktails/spritz-efflorescent.webp",
    "recipeCategory": "Cocktail",
    "recipeCuisine": "Française",
    "recipeYield": "1 verre",
    "prepTime": "PT5M",
    "totalTime": "PT5M",
    "keywords": "cocktail liqueur artisanale, fruits rouges, vanille, Flèche Ardente",
    "recipeIngredient": [
      "4 cl de La Flèche Ardente",
      "3 cl de gin London Dry",
      "1 cl de sirop de vanille bourbon",
      "2 cl de jus de citron frais pressé",
      "Eau pétillante",
      "Menthe fraîche",
      "2 framboises fraîches"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "text": "Mettre la Flèche Ardente, le gin, le sirop de vanille et le jus de citron dans un shaker rempli de glace."
      },
      {
        "@type": "HowToStep",
        "text": "Shaker 12 secondes. Double-filtrer dans un verre highball sur glace neuve."
      },
      {
        "@type": "HowToStep",
        "text": "Compléter avec un trait d'eau pétillante. Décorer de menthe fraîche et deux framboises."
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://labrasseriedesplantes.fr/blog/nos-cocktails-signature"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Le Black Mule",
    "description": "Version végétale du Moscow Mule à base de Gorgeon des Machurés, charbon végétal et ginger beer.",
    "author": {
      "@type": "Person",
      "name": "Guillaume",
      "worksFor": { "@id": "https://labrasseriedesplantes.fr#localbusiness" }
    },
    "datePublished": "2024-06-18",
    "image": "https://labrasseriedesplantes.fr/images/cocktails/spritz-efflorescent.webp",
    "recipeCategory": "Cocktail",
    "recipeCuisine": "Française",
    "recipeYield": "1 verre",
    "prepTime": "PT3M",
    "totalTime": "PT3M",
    "keywords": "cocktail liqueur artisanale, ginger beer, charbon végétal, Gorgeon des Machurés",
    "recipeIngredient": [
      "4 cl de Gorgeon des Machurés",
      "1,5 cl de jus de citron vert frais pressé",
      "10 cl de ginger beer (type Fever-Tree)",
      "Glaçons",
      "1 rondelle de gingembre frais",
      "Quelques feuilles de menthe"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "text": "Remplir un mug en cuivre (ou un verre highball) de glace."
      },
      {
        "@type": "HowToStep",
        "text": "Verser le Gorgeon des Machurés et le jus de citron vert."
      },
      {
        "@type": "HowToStep",
        "text": "Compléter avec le ginger beer. Remuer brièvement."
      },
      {
        "@type": "HowToStep",
        "text": "Décorer d'une rondelle de gingembre frais et de feuilles de menthe."
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://labrasseriedesplantes.fr/blog/nos-cocktails-signature"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "La Verveine Printanière",
    "description": "Cocktail léger à base de L'Herbe des Druides, citron vert, basilic et blanc d'œuf. Apéritif estival sans lourdeur.",
    "author": {
      "@type": "Person",
      "name": "Guillaume",
      "worksFor": { "@id": "https://labrasseriedesplantes.fr#localbusiness" }
    },
    "datePublished": "2024-06-18",
    "image": "https://labrasseriedesplantes.fr/images/cocktails/spritz-efflorescent.webp",
    "recipeCategory": "Cocktail",
    "recipeCuisine": "Française",
    "recipeYield": "1 verre",
    "prepTime": "PT5M",
    "totalTime": "PT5M",
    "keywords": "cocktail verveine, liqueur artisanale, basilic, citron vert, Herbe des Druides",
    "recipeIngredient": [
      "4 cl de L'Herbe des Druides",
      "2 cl de jus de citron vert frais pressé",
      "1 cl de sirop de sucre de canne",
      "1 blanc d'œuf (optionnel — pour la texture)",
      "6 feuilles de basilic frais",
      "Eau pétillante"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "text": "Mettre dans un shaker : l'Herbe des Druides, le jus de citron vert, le sirop, le blanc d'œuf et le basilic pressé."
      },
      {
        "@type": "HowToStep",
        "text": "Dry shake (sans glace) 10 secondes pour émulsionner le blanc d'œuf."
      },
      {
        "@type": "HowToStep",
        "text": "Ajouter de la glace et shaker à nouveau 10 secondes."
      },
      {
        "@type": "HowToStep",
        "text": "Double-filtrer dans un verre à vin. Compléter avec un trait d'eau pétillante. Décorer d'une feuille de basilic."
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://labrasseriedesplantes.fr/blog/nos-cocktails-signature"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Le Gentiane Oublié",
    "description": "Apéritif amer contemporain à base de Cerf'Gent, miel de châtaignier et Prosecco. Notes terriennes et végétales.",
    "author": {
      "@type": "Person",
      "name": "Guillaume",
      "worksFor": { "@id": "https://labrasseriedesplantes.fr#localbusiness" }
    },
    "datePublished": "2024-06-18",
    "image": "https://labrasseriedesplantes.fr/images/cocktails/spritz-efflorescent.webp",
    "recipeCategory": "Cocktail",
    "recipeCuisine": "Française",
    "recipeYield": "1 verre",
    "prepTime": "PT3M",
    "totalTime": "PT3M",
    "keywords": "cocktail gentiane, apéritif amer, Cerf'Gent, miel châtaignier, Prosecco",
    "recipeIngredient": [
      "4 cl de Cerf'Gent",
      "2 cl de vin blanc sec (Savoie ou Chardonnay)",
      "1 cl de sirop de miel de châtaignier",
      "1 zeste de citron jaune",
      "8 cl de Prosecco bien frais",
      "Glaçons",
      "1 branche de thym frais"
    ],
    "recipeInstructions": [
      {
        "@type": "HowToStep",
        "text": "Mettre des glaçons dans un verre à vin."
      },
      {
        "@type": "HowToStep",
        "text": "Verser le Cerf'Gent, le vin blanc sec et le sirop de miel de châtaignier."
      },
      {
        "@type": "HowToStep",
        "text": "Zester le citron au-dessus du verre et jeter le zeste dedans."
      },
      {
        "@type": "HowToStep",
        "text": "Compléter avec le Prosecco. Piquer une branche de thym frais avant de servir."
      }
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://labrasseriedesplantes.fr/blog/nos-cocktails-signature"
    }
  }
]
```

**Note sur les images** : idéalement, chaque `Recipe` doit avoir sa propre photo. Actuellement seule `spritz-efflorescent.webp` existe. Si vous avez des photos individuelles des 5 cocktails, les renseigner. En l'absence de photos individuelles, utiliser la même image pour les 5 est conforme (Google accepte — le rich result sera moins attractif sans photo dédiée pour les 4 autres).

---

### 5b. `FAQPage` — déjà présent, valide

Le schema existant sur `/faq` est complet et bien formé. Aucune action requise. (Voir §4e pour le contexte des rich results Google.)

---

## 6. Modifications template — ce que Guillaume doit coder

### 6a. Ajouter `keywords` au schema `BlogPosting`

**Étape 1** — `src/content.config.ts` : ajouter le champ dans `blogSchema`

```ts
// Dans blogSchema, après `readingTime`:
keywords: z.array(z.string()).optional(),
```

**Étape 2** — `src/pages/blog/[...slug].astro` : injecter dans `articleSchema`

Trouver le bloc `articleSchema` (ligne 40-59) et ajouter la propriété `keywords` :

```ts
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.data.title,
  description: post.data.description,
  datePublished: post.data.date.toISOString(),
  dateModified: (post.data.updated ?? post.data.date).toISOString(),
  author: authorSchema,
  publisher: { '@id': `${site.url}#localbusiness` },
  image: new URL(post.data.cover ?? '/images/brand/logo-complet-fond-blanc.webp', site.url).toString(),
  wordCount: (post.body ?? '').split(/\s+/).filter(Boolean).length,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${site.url}/blog/${post.id}`,
  },
  articleSection: post.data.category,
  inLanguage: 'fr-FR',
  // Nouveau :
  ...(post.data.keywords?.length ? { keywords: post.data.keywords.join(', ') } : {}),
};
```

**Note** : `keywords` en schema.org est une string (valeurs séparées par virgules), pas un tableau — d'où le `.join(', ')`.

**Étape 3** — Renseigner dans les frontmatter des articles prioritaires (exemple pour `nos-cocktails-signature.md`) :

```yaml
keywords:
  - cocktail liqueur artisanale
  - recette cocktail digestif
  - spritz maison
  - apéritif plantes
  - mixologie liqueurs françaises
```

---

### 6b. Ajouter le schema `Recipe` pour l'article cocktails

L'article `/blog/nos-cocktails-signature` a `category: Recettes`. On peut déclencher l'injection du schema Recipe automatiquement sur tous les articles de cette catégorie, ou de façon opt-in via un frontmatter booléen.

**Option recommandée : opt-in via frontmatter** (plus souple, car tous les articles `Recettes` n'ont pas forcément des recettes structurées).

**Étape 1** — `src/content.config.ts` : ajouter champ `schemaRecipes` dans `blogSchema`

```ts
// Tableau de recettes structurées pour le schema Recipe Google
// Chaque recette est un objet avec les champs minimaux
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
```

**Étape 2** — `src/pages/blog/[...slug].astro` : générer les blocs `Recipe` et les passer au Layout

Insérer après la définition de `breadcrumb` (ligne 69), avant `---` de fermeture du frontmatter Astro :

```ts
// Génération des blocs Recipe si l'article en contient
const recipeSchemas = (post.data.schemaRecipes ?? []).map((r) => ({
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: r.name,
  description: r.description,
  author: authorSchema,
  datePublished: post.data.date.toISOString(),
  image: r.image
    ? new URL(r.image, site.url).toString()
    : new URL(post.data.cover ?? '/images/brand/logo-complet-fond-blanc.webp', site.url).toString(),
  recipeCategory: r.recipeCategory,
  recipeCuisine: 'Française',
  recipeYield: r.recipeYield,
  prepTime: r.prepTime,
  totalTime: r.totalTime,
  ...(r.keywords ? { keywords: r.keywords } : {}),
  recipeIngredient: r.recipeIngredient,
  recipeInstructions: r.recipeInstructions.map((step) => ({
    '@type': 'HowToStep',
    text: step,
  })),
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${site.url}/blog/${post.id}`,
  },
}));
```

**Étape 3** — Passer les schemas au Layout (modifier la ligne 76) :

```astro
<Layout
  ...
  schema={[articleSchema, breadcrumb, ...recipeSchemas]}
>
```

**Étape 4** — Renseigner `schemaRecipes` dans le frontmatter de `nos-cocktails-signature.md`

Voici le bloc YAML complet à coller dans le frontmatter (après `readingTime`) :

```yaml
schemaRecipes:
  - name: "Le Spritz Efflorescent"
    description: "Apéritif floral printemps/été à base de Nectar d'Ostara, Mandarine Napoléon et Prosecco."
    recipeYield: "1 verre"
    prepTime: "PT3M"
    totalTime: "PT3M"
    recipeCategory: "Cocktail"
    keywords: "cocktail apéritif floral, Nectar d'Ostara, sureau, spritz"
    image: "/images/cocktails/spritz-efflorescent.webp"
    recipeIngredient:
      - "4 cl de Nectar d'Ostara"
      - "2 cl de Mandarine Napoléon"
      - "8 cl de Prosecco bien frais"
      - "Eau pétillante"
      - "Glaçons"
      - "1 rondelle d'orange fraîche"
    recipeInstructions:
      - "Remplir un grand verre à vin de beaucoup de glace."
      - "Ajouter 4 cl de Nectar d'Ostara puis 2 cl de Mandarine Napoléon."
      - "Compléter avec 8 cl de Prosecco bien frais, puis un trait d'eau pétillante."
      - "Remuer une seule fois avec une cuillère de bar. Zester de l'orange par-dessus avant de servir."
  - name: "Le Philtre d'Éros"
    description: "Cocktail gourmand fruits rouges et vanille à base de La Flèche Ardente et gin London Dry."
    recipeYield: "1 verre"
    prepTime: "PT5M"
    totalTime: "PT5M"
    recipeCategory: "Cocktail"
    keywords: "cocktail fruits rouges, vanille, Flèche Ardente, gin"
    recipeIngredient:
      - "4 cl de La Flèche Ardente"
      - "3 cl de gin London Dry"
      - "1 cl de sirop de vanille bourbon"
      - "2 cl de jus de citron frais pressé"
      - "Eau pétillante"
      - "Menthe fraîche"
      - "2 framboises fraîches"
    recipeInstructions:
      - "Mettre la Flèche Ardente, le gin, le sirop de vanille et le jus de citron dans un shaker rempli de glace."
      - "Shaker 12 secondes. Double-filtrer dans un verre highball sur glace neuve."
      - "Compléter avec un trait d'eau pétillante. Décorer de menthe fraîche et deux framboises."
  - name: "Le Black Mule"
    description: "Version végétale du Moscow Mule à base de Gorgeon des Machurés et ginger beer."
    recipeYield: "1 verre"
    prepTime: "PT3M"
    totalTime: "PT3M"
    recipeCategory: "Cocktail"
    keywords: "cocktail ginger beer, charbon végétal, Gorgeon des Machurés"
    recipeIngredient:
      - "4 cl de Gorgeon des Machurés"
      - "1,5 cl de jus de citron vert frais pressé"
      - "10 cl de ginger beer type Fever-Tree"
      - "Glaçons"
      - "1 rondelle de gingembre frais"
      - "Quelques feuilles de menthe"
    recipeInstructions:
      - "Remplir un mug en cuivre ou un verre highball de glace."
      - "Verser le Gorgeon des Machurés et le jus de citron vert."
      - "Compléter avec le ginger beer. Remuer brièvement."
      - "Décorer d'une rondelle de gingembre frais et de feuilles de menthe."
  - name: "La Verveine Printanière"
    description: "Cocktail léger à base de L'Herbe des Druides, citron vert et basilic. Apéritif estival sans lourdeur."
    recipeYield: "1 verre"
    prepTime: "PT5M"
    totalTime: "PT5M"
    recipeCategory: "Cocktail"
    keywords: "cocktail verveine, Herbe des Druides, basilic, citron vert"
    recipeIngredient:
      - "4 cl de L'Herbe des Druides"
      - "2 cl de jus de citron vert frais pressé"
      - "1 cl de sirop de sucre de canne"
      - "1 blanc d'œuf (optionnel)"
      - "6 feuilles de basilic frais"
      - "Eau pétillante"
    recipeInstructions:
      - "Mettre dans un shaker : l'Herbe des Druides, le jus de citron vert, le sirop, le blanc d'œuf et le basilic pressé."
      - "Dry shake sans glace 10 secondes pour émulsionner le blanc d'œuf."
      - "Ajouter de la glace et shaker à nouveau 10 secondes."
      - "Double-filtrer dans un verre à vin. Compléter avec un trait d'eau pétillante. Décorer d'une feuille de basilic."
  - name: "Le Gentiane Oublié"
    description: "Apéritif amer contemporain à base de Cerf'Gent, miel de châtaignier et Prosecco."
    recipeYield: "1 verre"
    prepTime: "PT3M"
    totalTime: "PT3M"
    recipeCategory: "Cocktail"
    keywords: "apéritif amer, gentiane, Cerf'Gent, miel châtaignier"
    recipeIngredient:
      - "4 cl de Cerf'Gent"
      - "2 cl de vin blanc sec Savoie ou Chardonnay"
      - "1 cl de sirop de miel de châtaignier"
      - "1 zeste de citron jaune"
      - "8 cl de Prosecco bien frais"
      - "Glaçons"
      - "1 branche de thym frais"
    recipeInstructions:
      - "Mettre des glaçons dans un verre à vin."
      - "Verser le Cerf'Gent, le vin blanc sec et le sirop de miel de châtaignier."
      - "Zester le citron au-dessus du verre et jeter le zeste dedans."
      - "Compléter avec le Prosecco. Piquer une branche de thym frais avant de servir."
```

---

### 6c. Corriger l'image fallback dans `articleSchema`

Ligne 51 de `src/pages/blog/[...slug].astro` :

```ts
// AVANT (fichier manquant)
image: new URL(post.data.cover ?? '/og-default.jpg', site.url).toString(),

// APRÈS (fichier qui existe)
image: new URL(post.data.cover ?? '/images/brand/logo-complet-fond-blanc.webp', site.url).toString(),
```

---

### 6d. Corriger l'image `.jpg` → `.webp` dans l'article alchimie-vegetale

Dans `src/content/blog/alchimie-vegetale-27-plantes-composition.md`, vérifier le frontmatter :

```yaml
# Vérifier que cover pointe sur .webp et non .jpg
cover: /images/products/alchimie-vegetale-2.webp
```

Si le fichier `.webp` existe bien dans `public/`, corriger le frontmatter. Si seul le `.jpg` existe, le renommer/convertir.

---

### 6e. Corriger `image` en doublon dans `LocalBusiness` (Home)

Dans `src/pages/index.astro` (ou là où le schema `LocalBusiness` est défini), trouver :

```ts
image: [
  `${site.url}/images/brand/logo-complet-fond-blanc.webp`,
  `${site.url}/images/brand/logo-complet-fond-blanc.webp`,  // ← supprimer cette ligne
],
```

---

### 6f. Corriger `vatID` et `taxID` dans `LocalBusiness`

Le SIRET `89920152900018` n'est pas un numéro TVA. Le numéro TVA intracommunautaire français se calcule ainsi :

```
TVA FR = "FR" + clé (2 chiffres) + SIREN (9 chiffres)
SIREN = 9 premiers chiffres du SIRET = 899201529
Clé = (12 + 3 × (SIREN mod 97)) mod 97 → à calculer ou vérifier sur votre attestation fiscale
```

Options :
1. Supprimer `vatID` et `taxID` si vous ne disposez pas du numéro TVA exact.
2. Ou renseigner le bon numéro TVA intracommunautaire (visible sur vos factures fournisseurs).

---

## Résumé des priorités d'action

| Priorité | Action | Effort | Impact |
|---|---|---|---|
| **1 — Haute** | Implémenter les 5 `Recipe` sur `/blog/nos-cocktails-signature` via frontmatter `schemaRecipes` | 2h (code template + YAML article) | Rich results Google Recipe + Google Discover |
| **2 — Haute** | Corriger le fallback image `og-default.jpg` → `logo-complet-fond-blanc.webp` dans `[...slug].astro` | 5 min | Éligibilité article rich result Google |
| **3 — Moyenne** | Ajouter `keywords` au schema `BlogPosting` (champ Zod + injection) | 30 min + renseigner les articles | Signal sémantique LLM/IA |
| **4 — Basse** | Supprimer l'image en doublon dans `LocalBusiness` | 2 min | Propreté |
| **5 — Basse** | Corriger `vatID`/`taxID` dans `LocalBusiness` | 5 min | Propreté |
| **6 — Basse** | Ajouter `seller` dans `AggregateOffer` des fiches produit | 10 min | Signal marchand Google Shopping |
| **7 — Basse** | Nettoyer Markdown brut dans `Product.description` avant injection JSON-LD | 30 min | UX rich results Shopping |
| **Info** | `FAQPage` sur `/faq` : déjà présent, valide, utile pour LLMs — aucune action | — | — |
| **Ne pas faire** | `HowTo` pour l'article checklist | — | Schema déprécié Google sept. 2023 |
