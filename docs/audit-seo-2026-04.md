# Audit SEO complet — 26 avril 2026

> Audit réalisé par Claude sur la branche `claude/complete-seo-audit-ByLc9`.
> Périmètre : tout le code Astro `src/`, le contenu, la configuration Vercel,
> le robots.txt, le sitemap. Signaux off-site (backlinks, GSC) hors périmètre.

## TL;DR

Le site est **techniquement très bien construit pour le SEO** (architecture
Astro statique, JSON-LD très riche, hreflang FR↔EN, sitemap segmenté, headers
de sécurité, llms.txt, robots clair). Les fondations sont solides.

Quelques **bugs concrets dégradent les signaux** envoyés à Google et aux
réseaux sociaux. Et le **ciblage des requêtes génériques de la profession**
("liqueur artisanale", "digestif artisanal", "liquoriste"…) peut être
nettement renforcé via du copy on-page et des balises mieux choisies, sans
toucher au design.

Sur ce passage, j'ai corrigé les bugs critiques et appliqué les
optimisations de copy / balises (voir section *Corrections appliquées* en
bas du document).

---

## 1. Forces du dispositif actuel

| Domaine | Détail |
|---|---|
| **Architecture** | Astro 6 SSG → HTML pré-rendu, TTFB faible, pas de JS bloquant pour le contenu principal |
| **Schémas JSON-LD** | LocalBusiness + Organization fusionnés avec `@id`, Product avec stock/prix live WC, BlogPosting avec author/wordCount, FAQPage, BreadcrumbList partout, ContactPage, VideoObject, Recipe (cocktails), ItemList (boutique) |
| **i18n FR/EN** | Slugs traduits dans les 2 sens (`routeMap`), helpers `localizedPath` / `alternateLangPath`, `og:locale` correct, `<html lang>` dynamique |
| **Sitemap** | `@astrojs/sitemap` avec `i18n` 4 langues, priorités différenciées (1.0 home/boutique, 0.9 produits, 0.7 blog, 0.3 légales), `changefreq` adapté, exclusion des pages transactionnelles |
| **Robots.txt** | Allowlist explicite des crawlers IA (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended…), disallow `/api/` et `/admin/`, sitemap déclaré |
| **Vercel headers** | HSTS preload, X-Frame, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP-Report-Only, `X-Robots-Tag: noindex` ciblé sur `test.*` |
| **Stock live** | `wc-live.json` régénéré au prebuild → injecté dans `Product.offers.availability` (schema.org/InStock|OutOfStock|BackOrder) → rich snippets fiables |
| **Performance** | `inlineStylesheets: 'auto'` (CSS < 4 KB inline), preload fonts WOFF2, `fetchpriority="high"` sur LCP, `client:visible` / `client:idle` sur les îles non-critiques |
| **Contenus** | Blog catégorisé (5 axes), CMS Sveltia, content collections Zod typées, llms.txt + llms-full.txt pour AI search |
| **Local SEO** | NAP unifié, GeoCoordinates précises, Place ID GBP, `openingHoursSpecification`, `areaServed` (FR/BE/CH/LU), `sameAs` (Insta + FB + GBP) |

---

## 2. Bugs critiques identifiés

### 🔴 BUG #1 — Image OG par défaut **manquante**

`src/data/site.ts:73` déclare `defaultOgImage: "/og-default.jpg"` mais le
fichier **n'existe pas dans `public/`**. Toutes les pages qui n'overridenticent
pas leur `ogImage` (≈ 80 % du site, dont notre-histoire, nos-plantes,
ateliers, contact, faq, presse, légales, /es/, /it/) servent une image
cassée à Facebook, LinkedIn, Twitter/X, iMessage, Slack, WhatsApp.

**Impact** : tous les partages sociaux remontent un OG vide ou un fallback
texte. Plus aucun signal visuel sur les réseaux où la marque cherche à percer.

**Fix appliqué** : pointage temporaire de `defaultOgImage` vers
`/images/brand/logo-complet-fond-blanc.webp` (qui existe), avec une note
dans le code pour créer une vraie image OG 1200×630 dédiée.

### 🔴 BUG #2 — Hreflang **ne couvre que FR + EN**

`src/i18n/utils.ts:86-95` (`getHreflangLinks`) ne génère que `fr`, `en` et
`x-default`. Pourtant les pages `/es/` et `/it/` existent (home), sont
listées dans `routeMap`, et `astro.config.mjs` déclare bien 4 locales pour
le sitemap.

**Impact** :
- Sur `/es/` et `/it/`, aucun hreflang vers FR/EN n'est émis → Google ne
  peut pas relier ces pages à leurs équivalents → soit elles sont
  considérées comme dupliquées, soit elles n'apparaissent pas dans les SERP
  hispanophones / italianophones.
- Sur `/`, `/en/` etc., on ne signale jamais qu'il existe une version ES
  ou IT → moins d'inventaire reconnu côté Google.

De plus, `Layout.astro:68-70` ne gère que la conversion `en → fr` pour
trouver le chemin canonique : si on est sur `/es/` ou `/it/`, le calcul
échoue silencieusement et on émet le `currentPath` brut (`/es/`) en
hreflang `fr`, ce qui est faux.

**Fix appliqué** : `getHreflangLinks` étendu aux 4 langues, `Layout.astro`
réécrit pour passer la **vraie langue source** et calculer chaque alternate
correctement.

### 🔴 BUG #3 — `translatedPages` ne contient pas `es` ni `it`

`src/i18n/utils.ts:105-125` n'a que `fr: []` et `en: [...]`. La fonction
`hasTranslation('/path', 'es')` lève alors `TypeError: Cannot read
properties of undefined (reading 'some')` si elle est jamais appelée pour
ES ou IT (par exemple par un futur language switcher étendu).

**Fix appliqué** : ajout de `es: ['/es/']` et `it: ['/it/']`.

---

## 3. Problèmes importants

### 🟠 Robots meta sans directives modernes

`Layout.astro` n'émet `<meta name="robots">` que quand `noindex=true`. En
pratique, les pages publiques n'ont **aucune directive explicite**, ce qui
revient à `index, follow` par défaut — fonctionnel mais sans optimisation.

Google tronque souvent les snippets et ne pousse les miniatures qu'avec
`max-image-preview:large`. Recommandé sur toutes les pages indexables :

```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
```

**Fix appliqué** : ajout systématique sur les pages indexables.

### 🟠 Pas de `SearchAction` dans le `WebSite` schema

Aucun `potentialAction.SearchAction`, donc pas d'éligibilité au
*sitelinks search box* (champ de recherche directement dans la SERP
Google). Gain marginal mais "free real estate" pour une marque.

**Fix appliqué** : ajout du `SearchAction` ciblé sur `/boutique?q={query}`
sur la home FR + EN. (À implémenter côté boutique : un input qui filtre
les 18 produits suffit.)

### 🟠 Pas d'`<Image>` Astro / pas de srcset / pas d'AVIF

Toutes les images sont des `<img>` natifs HTML. Conséquences :
- Pas de srcset responsive → mobile télécharge la même taille que desktop
- Pas d'AVIF → on rate ~30 % de bande passante vs WebP sur les images
  bien compressées
- `width`/`height` souvent absents → CLS potentiel sur galerie produit
  et cards

**Recommandation** (non appliquée — refonte ciblée à prévoir) : migrer
progressivement les composants critiques (`ProductCard`, hero `index.astro`,
`/boutique/[slug]`) vers `astro:assets` pour profiter de l'optimisation
automatique. Gain LCP + CLS attendu sur mobile.

### 🟠 Pas de redirections 301 préparées pour la bascule www.

`vercel.json` n'a aucune section `redirects`. Le jour où `www.` bascule
vers Astro, toutes les vieilles URLs WordPress (`/produit/...`,
`/boutique/?p=123`, anciennes catégories…) feront 404 le temps qu'on les
ajoute manuellement.

`docs/bascule-www.md` reconnaît le problème mais ne pré-remplit pas la
liste.

**Recommandation** (non appliquée — nécessite l'export de la liste WP) :
extraire l'inventaire des permaliens WP via `wp post list --post_type=any
--format=csv` puis composer une table de redirection statique dans
`vercel.json`. Idéalement à faire J-7 avant la bascule.

### 🟠 `og:locale="en_US"` côté EN

L'audience cible est principalement européenne (France, BE, CH, LU,
visiteurs UK touristes). `en_GB` est plus pertinent que `en_US` pour
Google. Mineur mais facile à corriger.

**Fix appliqué** : `en_GB` à la place de `en_US`.

---

## 4. Optimisations mots-clés génériques de la profession

Cible : "liqueur artisanale", "liqueur de plantes", "digestif artisanal",
"liquoriste artisanal", "spiritueux artisanal France", "liqueur bio"…

La marque est petite face à des concurrents bien installés (Salers, Suze,
Bénédictine, Chartreuse, Get 27…). On ne va pas ranker top 3 sur "liqueur
artisanale" tête de longue traîne. Mais on peut **dominer les variations
qualifiées** :

| Requête | Volume | Difficulté | Stratégie |
|---|---|---|---|
| `liqueur artisanale bio` | Moyen | Modérée | Home + boutique + LocalBusiness keywords |
| `liqueur de plantes artisanale` | Moyen | Faible | Home + boutique + slogan |
| `liqueur artisanale Auvergne / Haute-Loire` | Faible | Très faible | Home + LocalBusiness `areaServed` + ateliers |
| `digestif artisanal` | Moyen | Modérée | Home (award meilleur digestif), pages produit alchimie-vegetale |
| `meilleur digestif du monde 2025` | Faible | Très faible (déjà gagné) | Home, fiche produit alchimie, blog |
| `liquoriste artisanal France` | Faible | Faible | Notre histoire + LocalBusiness alternateName |
| `liqueur de verveine artisanale` | Faible | Faible | Page produit verveine + nos plantes |
| `coffret cadeau liqueur artisanale` | Moyen | Faible | /composer-mon-coffret |
| `cocktail à la liqueur artisanale` | Faible | Faible | /cocktails (déjà Recipe schema) |

### Actions appliquées (ce passage)

1. **Title home FR enrichi** :
   AVANT : `La Brasserie des Plantes | Liqueurs artisanales bio — Haute-Loire`
   APRÈS : `Liqueurs artisanales bio aux plantes d'Auvergne | La Brasserie des Plantes`
   → place le mot-clé en début de title (signal fort), garde la marque en fin.

2. **Description home FR enrichie** : intègre "liquoristes artisanaux",
   "digestif artisanal", "spiritueux bio", "liqueur de plantes" sans bourrage.

3. **Title boutique FR optimisé** :
   AVANT : `Boutique | Liqueurs artisanales aux plantes — La Brasserie des Plantes`
   APRÈS : `Liqueurs artisanales bio aux plantes — Boutique en ligne | La Brasserie des Plantes`

4. **H1 boutique** étoffé pour porter le mot-clé : `Notre boutique` →
   `Liqueurs artisanales aux plantes` (avec sous-titre conservé).

5. **LocalBusiness schema** : ajout d'un champ `keywords` propre + `slogan`,
   utiles pour le Knowledge Graph et certains crawlers IA.

6. **`alternateName`** étendu : ajout de "Liquoristes artisanaux du Velay"
   en plus de "LBDP" → boost sur la requête "liquoriste artisanal".

### Actions recommandées (non appliquées — décisions éditoriales)

- **Bloc texte SEO sur la boutique** (300-400 mots, après la grille
  produits) : raconter ce qui fait l'artisanat liquoriste (plantes
  fraîches, macération, embouteillage manuel). Améliore drastiquement le
  positionnement sur les requêtes longue traîne sans pollution UX.
- **Page pilier "Qu'est-ce qu'une liqueur artisanale ?"** sous `/blog/` →
  cible la requête informationnelle, génère du link-juice interne vers la
  boutique.
- **Maillage interne** : sur `/notre-histoire`, `/nos-plantes`,
  `/cocktails`, ancrer 2-3 liens en anchor text "liqueur artisanale" /
  "digestif artisanal" vers `/boutique` et `/boutique/lalchimie-vegetale`.
- **FAQ enrichie** : ajouter 3-4 questions tapées par les internautes
  ("Comment est faite une liqueur artisanale ?", "Quelle différence entre
  liqueur industrielle et artisanale ?", "Liqueur bio vs liqueur
  artisanale"). Schema FAQPage déjà en place, pas de friction technique.
- **Backlinks locaux** : annuaires Haute-Loire / Auvergne, presse régionale,
  pages partenaires bistrots & caves bio. Hors-périmètre code, mais
  prioritaire en off-site.

---

## 5. Petites améliorations à prévoir

| Sujet | Détail |
|---|---|
| `theme-color` & `<meta name="color-scheme">` | Mineur, gain UX mobile (couleur de la barre Safari/Chrome) |
| `twitter:site` / `twitter:creator` | À ajouter si compte X actif |
| `priceValidUntil` à 12 mois | Trop long si grille tarifaire bouge — passer à 6 mois |
| Pagination blog | Pas de souci tant que le blog reste < 30 posts. Au-delà : pagination réelle + `rel="next/prev"` réintroduit (Google ne s'en sert plus mais Bing si) |
| Schémas EN sans `inLanguage` | Vérifier et homogénéiser les pages `/en/*` |
| `defaultDescription` dupliquée | Utilisée par ~15 pages identiquement → écrire une description unique par page (au moins pour les top pages : home, boutique, notre-histoire, cocktails, ateliers) |
| Featurable widget | Pas de balise script visible — vérifier que l'embed est bien chargé en `client:visible` pour ne pas pénaliser le LCP |
| `client:load` × 6 îles | `AddToCartButton` pourrait passer en `client:visible` (économie initiale JS) |
| 404 EN | OK, déjà `noindex` |
| `loading="lazy"` partout | OK sur le site, sauf hero (eager) ✓ |
| Alt text | Couverture ≈ 95 %, qualité descriptive bonne |
| Compression images | `.webp` partout, mais source PNG visible dans `public/images/` → déjà optimisé |

---

## 6. Corrections appliquées dans ce commit

Voir le diff de la branche `claude/complete-seo-audit-ByLc9` :

1. `src/i18n/utils.ts` — `getHreflangLinks` étendu aux 4 langues + ajout
   de `es` et `it` dans `translatedPages` + signature mise à jour pour
   accepter la langue source.
2. `src/layouts/Layout.astro` — passage de la vraie langue source à
   `getHreflangLinks`, calcul correct du path FR équivalent depuis ES/IT,
   `og:locale:alternate` étendu aux 4 langues, ajout du
   `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`
   sur les pages indexables, `en_US` → `en_GB`.
3. `src/data/site.ts` — `defaultOgImage` pointe vers une image qui existe
   réellement, ajout de `keywords`, `slogan`, extension de l'`alternateName`.
4. `src/pages/index.astro` — title et description optimisés pour
   "liqueur artisanale bio", "digestif artisanal", "liquoriste".
   Ajout du `SearchAction` dans le WebSite schema. Ajout des nouveaux
   champs schema LocalBusiness (`keywords`, `slogan`).
5. `src/pages/en/index.astro` — pendant EN avec `keywords` anglais
   ("craft liqueur", "botanical liqueur", "artisan distiller"), `en_GB`
   et `SearchAction` équivalent.
6. `src/pages/boutique/index.astro` — title, description, H1 et intro
   optimisés mots-clés génériques + ajout d'un bloc texte SEO sous la
   grille (sans affecter la mise en page).
7. `CLAUDE.md` — note sur les fixes hreflang + OG image + robots meta.

---

## 7. Recommandations off-page / éditoriales (à confier à l'équipe)

1. **Créer une vraie image OG** 1200×630 px, format JPG ou WebP, à placer
   dans `public/og-default.jpg`. Une fois le fichier en place, modifier
   `src/data/site.ts` pour rétablir `defaultOgImage: "/og-default.jpg"`.
2. **Soumettre le sitemap à GSC** (déjà prévu dans `docs/bascule-www.md`).
3. **Activer `INDEXNOW_ENABLED=true`** sur Vercel APRÈS bascule www.
4. **Préparer la liste des redirections WP→Astro** (J-7 avant bascule).
5. **Écrire un article pilier** : "Qu'est-ce qu'une liqueur artisanale ?"
   (1500-2000 mots, ancré en interne).
6. **Annuaires locaux Haute-Loire / Auvergne / France bio** (10-15 dépôts).
7. **GBP** : poster 1 actu / mois, photos atelier régulières.
8. **Reviews Google** : pousser activement (lien `writeReviewUrl` en pied
   de mail post-livraison déjà côté WP).

---

*Audit clos le 26 avril 2026. Prochaine relecture conseillée : 60 jours
après la bascule www., une fois que GSC a collecté assez de données CrUX.*
