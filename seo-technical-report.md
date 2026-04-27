# Audit SEO Technique — test.labrasseriedesplantes.fr
**Date** : 27 avril 2026  
**Auditeur** : Agent SEO technique (Claude Sonnet 4.6)  
**Périmètre** : ~12 pages prioritaires, site Astro 6.1.7 SSG headless WooCommerce  
**Base** : audit interne du 26 avril 2026 (`docs/audit-seo-2026-04.md`) lu en amont — seules les nouvelles trouvailles ou confirmations de terrain sont rapportées ici.

---

## 1. Score technique /100

**Score global : 81/100**

| Catégorie | Score | Statut |
|---|---|---|
| Crawlabilité (robots.txt, sitemap, noindex) | 18/20 | PASS avec réserves |
| Indexabilité (canonicals, hreflang, schema) | 16/20 | PASS avec réserves |
| Sécurité (HTTPS, headers) | 17/20 | PASS |
| Structure URL + codes HTTP | 18/20 | PASS |
| Core Web Vitals — potentiel depuis le HTML | 12/20 | Attention — voir section 6 |
| JS rendering | 10/10 | PASS — SSG pur |

**Lecture du score** : 81 reflète un site techniquement solide et bien construit, dont les points de déduction sont ciblés et corrigeables avant bascule. Il n'y a aucun bug bloquant côté crawl.

---

## 2. Robots.txt

**Statut : PASS — 1 réserve mineure**

URL : `https://test.labrasseriedesplantes.fr/robots.txt`

### Ce qui est correct

- Syntaxe valide, servie en `text/plain`.
- `Disallow: /api/` et `Disallow: /admin/` — protège les endpoints non-publics.
- Allowlist explicite de 9 crawlers IA (GPTBot, ClaudeBot, anthropic-ai, OAI-SearchBot, PerplexityBot, Google-Extended, CCBot, Applebot-Extended, Yeti). Cohérent avec la stratégie GEO / AI search.
- Pas de bloc sur Googlebot, Bingbot, Slurp, Yandex — crawl standard non entravé.
- `Sitemap:` déclaré.

### Réserve — URL du sitemap pointe sur www. pas sur test.

```
Sitemap: https://labrasseriedesplantes.fr/sitemap-index.xml
```

Le robots.txt déclaré sur `test.*` référence le sitemap du domaine de production. Actuellement sans impact (le crawl est bloqué sur `test.*` via `X-Robots-Tag: noindex, nofollow`). Mais si Googlebot suit le sitemap depuis ce robots.txt, il indexera les URLs canoniques `labrasseriedesplantes.fr`, ce qui est en fait le bon comportement. Pas d'action urgente — à documenter pour vérification post-bascule.

**Action recommandée (post-bascule)** : vérifier que le robots.txt de `www.` déclare bien `https://www.labrasseriedesplantes.fr/sitemap-index.xml` une fois le domaine de production basculé.

---

## 3. Sitemaps XML

**Statut : PASS — 2 problèmes de cohérence à corriger**

Structure : `sitemap-index.xml` → 1 shard `sitemap-0.xml`  
Total URLs dans le sitemap : 116 entrées  
Généré par `@astrojs/sitemap` avec i18n 4 langues.

### Ce qui est correct

- `/panier`, `/commande`, `/admin/` — absents du sitemap. Exclusion fonctionnelle.
- 18 fiches produit FR (`/boutique/…`) + 18 fiches EN (`/en/shop/…`) — toutes présentes.
- 28 articles blog FR présents, 10 articles EN (`/en/journal/…`) présents.
- Priorités différenciées correctes (1.0 home/boutique, 0.9 fiches produit, 0.7 blog, 0.3 légales).
- `lastmod` uniforme (même timestamp de build) — acceptable pour SSG.

### Problème 1 — Format de langue dans le sitemap : `fr-FR` / `en-US` au lieu de `fr` / `en`

Le sitemap émet :
```xml
<xhtml:link rel="alternate" hreflang="fr-FR" href="…"/>
<xhtml:link rel="alternate" hreflang="en-US" href="…"/>
<xhtml:link rel="alternate" hreflang="es-ES" href="…"/>
<xhtml:link rel="alternate" hreflang="it-IT" href="…"/>
```

Le HTML `<head>` émet au contraire les codes courts `fr`, `en`, `es`, `it`.

Google accepte les deux formats, mais **les deux sources doivent être cohérentes entre elles**. La discordance sitemap (`fr-FR`) vs HTML head (`fr`) peut créer une ambiguïté dans le rapport GSC (les deux versions apparaissent comme des langues distinctes). De plus, `en-US` est inexact pour une audience FR/BE/CH/LU — `en` ou `en-GB` serait plus approprié.

**Action** : dans `astro.config.mjs`, aligner la config `i18n.locales` pour qu'elle produise des codes courts (`fr`, `en`, `es`, `it`) dans le sitemap, ou unifier en régionaux partout. Le plus simple : forcer le plugin sitemap à utiliser des codes courts en configurant `locales` sans tiret dans `astro.config.mjs`.

### Problème 2 — Produits FR dans le sitemap sans hreflang vers leur équivalent EN

Exemple dans le sitemap : `https://labrasseriedesplantes.fr/boutique/alchimie-vegetale/` n'a **aucun** `xhtml:link` alternate vers `/en/shop/alchimie-vegetale/`.

Les fiches produit FR et EN sont bien présentes toutes les deux dans le sitemap, mais leurs entrées ne se croisent pas. Google ne peut donc pas relier automatiquement les 18 paires FR/EN de fiches produit via le sitemap. Il se repose uniquement sur les balises hreflang dans le HTML `<head>`, qui elles sont correctes — mais la redondance sitemap+HTML est la méthode recommandée par Google.

**Impact potentiel** : fiches produit EN moins bien identifiées comme versions alternatives → moins d'apparitions dans les SERP anglophones.

**Action** : dans la config `@astrojs/sitemap`, s'assurer que les pages avec des paires de slugs différents (FR `boutique/…` ↔ EN `en/shop/…`) exportent bien leurs alternates. Le plugin Astro sitemap gère cela via le champ `i18n.routing` ; vérifier que les slugs mappés dans `routes.ts` sont correctement transmis au plugin.

---

## 4. Canonical + hreflang

**Statut : PASS — 1 problème résiduel, 1 bonne surprise**

### Bonne surprise — corrections de l'audit du 26 avril bien déployées

Confirmé en prod sur `test.*` :
- `getHreflangLinks` émet bien les 4 langues (fr, en, es, it, x-default) sur la home et `/en/`.
- `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">` présent sur toutes les pages indexables vérifiées (home, boutique, fiches produit, blog).
- `og:locale` = `fr_FR`, `og:locale:alternate` = `en_GB`, `es_ES`, `it_IT` — correct.
- `og:image` pointe vers `/images/brand/logo-complet-fond-blanc.webp` — le fichier existe, les partages sociaux fonctionnent.
- Canonical auto-référentiel sur chaque page — correct.

### Problème — Pages transactionnelles : noindex correct mais hreflang inutile

La page `/panier` a :
```html
<meta name="robots" content="noindex, follow">
<link rel="alternate" hreflang="fr" href="https://labrasseriedesplantes.fr/panier/">
<link rel="alternate" hreflang="x-default" href="https://labrasseriedesplantes.fr/panier/">
```

Émettre des balises hreflang sur une page noindex est une pratique discutée — Google peut ignorer les signaux hreflang d'une page qu'il ne peut pas indexer. Ce n'est pas bloquant ici puisque le `X-Robots-Tag: noindex, nofollow` sur tout `test.*` couvre quoi qu'il arrive, et côté `www.` les pages panier/commande auront aussi `noindex`. Mais proprement, les hreflang devraient ne pas être émis sur les pages noindex.

**Action (faible priorité)** : dans `Layout.astro`, conditionner l'émission des balises hreflang sur `!noindex`.

### Problème — Plusieurs pages sans hreflang vers leurs alternates dans le sitemap

Exemples constatés : `/ateliers/`, `/boutique/` (index), `/composer-mon-coffret/`, `/notre-histoire/`, `/nos-plantes/`, `/blog/` — pas d'`xhtml:link` alternates dans le sitemap malgré l'existence de versions EN pour certaines.

La home (`/`) a ses 4 alternates dans le sitemap. Les pages avec correspondance partielle ne les ont pas. Cohérent avec le fait que seule la home et `/en/` ont une correspondance 4 langues définie dans `routeMap` pour le plugin. Pas bloquant pour le crawl, mais sous-optimal.

### OG image blog — format .jpg vs .webp incohérent

L'article `blog/alchimie-vegetale-27-plantes-composition` émet :
```html
<meta property="og:image" content="…/images/products/alchimie-vegetale-2.jpg">
```

Toutes les autres OG images du site sont en `.webp`. Si le fichier `.jpg` n'existe pas sur le serveur, le partage social sera cassé pour cet article (et potentiellement d'autres). À vérifier côté `public/images/products/`.

**Action** : grep dans `src/content/blog/` pour `og_image:.*\.jpg` et vérifier l'existence de chaque fichier. Unifier en `.webp` si doublon.

---

## 5. Headers de sécurité

**Statut : PASS — CSP en mode report-only, à monitorer**

| Header | Valeur observée | Évaluation |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Excellent — 2 ans, preload list |
| `X-Content-Type-Options` | `nosniff` | Correct |
| `X-Frame-Options` | `SAMEORIGIN` | Correct (Stripe iframes dans un sous-frame distinct) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Correct |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(self "…stripe…")` | Correct |
| `Content-Security-Policy-Report-Only` | Déclarée avec directives complètes | Voir note ci-dessous |
| `X-Robots-Tag` | `noindex, nofollow` sur `test.*` seulement | Conforme aux specs `vercel.json` |

### Note — CSP en Report-Only uniquement

La CSP est déclarée en mode `Content-Security-Policy-Report-Only`, ce qui signifie qu'elle **ne bloque rien** — elle envoie uniquement des rapports. Il n'y a donc pas de header `Content-Security-Policy` enforced. C'est un choix délibéré (évite de casser Stripe, les polices locales, les scripts inline Astro en prod). Acceptable pour un e-commerce avec Stripe Elements. Point à garder en mémoire post-bascule.

**Action (post-bascule, facultatif)** : si une solution CSP stricte est souhaitée, il faudra un nonce Astro pour les scripts inline et un header `frame-ancestors` pour Stripe — complexité significative, ROI SEO nul.

### Header manquant — pas de `X-DNS-Prefetch-Control`

Mineur. Vercel ne l'ajoute pas par défaut. Sans impact SEO direct.

---

## 6. Status codes + redirections

**Statut : PASS avec 1 point d'attention majeur pour la bascule**

| URL | Code HTTP | Note |
|---|---|---|
| `/` | 200 | OK |
| `/en/` | 200 | OK |
| `/boutique` | 200 | OK |
| `/boutique/alchimie-vegetale` | 200 | OK |
| `/blog` | 200 | OK |
| `/blog/alchimie-vegetale-27-plantes-composition` | 200 | OK |
| `/notre-histoire` | 200 | OK |
| `/composer-mon-coffret` | 200 | OK |
| `/panier` | 200 + `noindex` | Correct — ne doit pas être indexé |
| `/commande` | 200 + `noindex` | Correct |
| `/admin/` | 200 + `noindex, nofollow` dans HTML | Correct |
| `/this-page-does-not-exist-xyz` | 404 | 404 natif Astro — OK |

### Pas de redirections configurées dans vercel.json

`vercel.json` ne contient aucune section `redirects`. Ce n'est pas un problème pour `test.*` (qui est un site en construction), mais c'est **le point critique à traiter avant la bascule www.** :

Au moment où `www.labrasseriedesplantes.fr` basculera vers Vercel/Astro, les anciennes URLs WordPress (par exemple `/produit/alchimie-vegetale-27-plantes/`, `/boutique/?p=348`, `/category/liqueurs/`) feront 404. Chaque 404 sur une ancienne URL indexée par Google = perte de PageRank accumulé.

**Action avant bascule** : exporter la liste complète des URLs WordPress avec `wp post list --post_type=any --format=csv --fields=post_name,post_type,post_status` et construire la table de redirections dans `vercel.json`. Minimum vital : rediriger les URLs produit WP vers les nouvelles fiches `/boutique/[slug]` et les catégories WP vers `/boutique`.

### Pas de chaîne de redirections détectée

Aucune des URLs testées ne retourne 301/302 intermédiaire. Propre.

---

## 7. JS rendering

**Statut : PASS — SSG pur, aucune dépendance JS pour le contenu principal**

Astro 6 SSG génère du HTML statique complet servi depuis le CDN Vercel. Conséquences :

- **Googlebot (et tous les crawlers)** voient le HTML complet dès le premier octet. Aucun contenu n'est caché derrière JavaScript.
- Le HTML des pages testées contient systématiquement le title, la meta description, les balises hreflang, les canonicals, les schemas JSON-LD **dans le source** — aucun rendu client requis.
- Les îles React (`AddToCartButton`, `CartIcon`, `CoffretBuilder`, etc.) sont hydratées avec `client:load` ou `client:visible` — elles n'affectent pas le contenu indexable.

**Seule exception** : l'âge-gate (vérification de majorité) est masqué par JS côté client. Le contenu de la page reste visible dans le source HTML. Googlebot ne voit pas la modal — c'est correct.

**LCP candidat sur la home** : le `<video autoplay muted loop>` avec `poster="/videos/lbdp-pro-poster.jpg"`. Le poster est préchargé via `<link rel="preload" as="image" href="/videos/lbdp-pro-poster.jpg" fetchpriority="high">`. Bonne pratique. Cependant, l'image du poster est un `.jpg` (pas `.webp`) et sa taille n'est pas connue sans chargement. Si elle est > 200 Ko non compressée, c'est un risque LCP sur mobile (réseau 4G lent).

**CLS potentiel** : les images produit dans la galerie fiche (`/boutique/alchimie-vegetale`) n'ont pas d'attributs `width` et `height` explicites :
```html
<img src="/images/products/sizes/alchimie-vegetale-70cl.webp" class="gallery-slide…" fetchpriority="high">
```
Sans dimensions fixes, le navigateur ne peut pas réserver l'espace avant le chargement → risque de saut de layout (CLS). Les images dans les cards de la homepage ont le même problème (pas de `width`/`height` sur les `<img>` produit).

**INP** : les îles React utilisent des animations Framer Motion (stiffness 280, damping 18) — légères. Le CoffretBuilder est `client:load` — à surveiller sur mobile bas de gamme. Pas de long task identifiable dans le source.

---

## 8. Top 5 issues critiques avant bascule www.

### Critique 1 — Aucune redirection 301 préparée pour la migration WP → Astro

**Risque** : perte totale du PageRank accumulé sur les URLs WordPress en production. Si `www.labrasseriedesplantes.fr` a des fiches produit indexées sous `/produit/alchimie-vegetale-27-plantes/` et que ces URLs retournent 404 le jour de la bascule, Google dépréciera ces pages en quelques semaines.

**Action** : J-7 avant bascule, lancer sur le WP admin :
```bash
wp post list --post_type=product,post,page --post_status=publish --format=csv --fields=ID,post_name,post_type > wp-urls.csv
```
Puis construire dans `vercel.json` la section `"redirects": [...]` avec les règles 301 WP → Astro. Priorité absolue.

### Critique 2 — URL du sitemap dans robots.txt pointe sur www. pas sur test.*

Confirmé : `Sitemap: https://labrasseriedesplantes.fr/sitemap-index.xml` dans le robots.txt de `test.*`. Le sitemap lui-même contient des `<loc>` au format `https://labrasseriedesplantes.fr/…` (sans `test.`), ce qui est en fait correct — les canonicals dans le sitemap pointent déjà vers le domaine de production.

**Action post-bascule** : après que `www.` bascule sur Astro, vérifier que le robots.txt de production déclare `Sitemap: https://www.labrasseriedesplantes.fr/sitemap-index.xml` (avec `www.`). Si le site répond directement en `labrasseriedesplantes.fr` sans `www.`, adapter.

### Critique 3 — Format de langue incohérent entre sitemap (fr-FR) et HTML head (fr)

Décrit en section 3. Les deux sources de vérité hreflang — sitemap et HTML `<head>` — utilisent des formats différents (`fr-FR` vs `fr`). Google les accepte tous les deux mais peut les traiter comme deux signaux distincts dans Search Console, créant de la confusion dans le rapport "Internationalisation".

**Action** : dans `astro.config.mjs`, aligner la configuration i18n pour que les codes de langue émis dans le sitemap correspondent à ceux émis dans le HTML. Option recommandée : tout en codes courts (`fr`, `en`, `es`, `it`) via `locales: ['fr', 'en', 'es', 'it']` dans le bloc `i18n` du plugin sitemap.

### Critique 4 — Fiches produit FR/EN non liées dans le sitemap (hreflang manquants)

Décrit en section 3. 18 paires de fiches produit (`/boutique/[slug]` ↔ `/en/shop/[slug]`) ne déclarent pas leurs alternates dans le sitemap. Google se repose uniquement sur les balises `<head>` pour relier ces paires, ce qui est fonctionnel mais non redondant.

**Action** : dans la config sitemap Astro, s'assurer que le `i18n.routing` comprend le mapping `boutique` ↔ `en/shop`. Alternatif : vérifier dans `astro.config.mjs` que le filtre `filter` du plugin sitemap ne supprime pas les alternates calculés pour les routes avec slugs différents entre langues.

### Critique 5 — Pas de CSP enforced (report-only uniquement)

Décrit en section 5. En l'état, n'importe quel script tiers injecté (XSS, extension navigateur malveillante, supply-chain) ne serait pas bloqué par le navigateur. L'impact SEO direct est nul, mais c'est un risque de sécurité pour les utilisateurs qui saisissent leurs coordonnées de carte bancaire.

**Action (post-bascule)** : après avoir collecté des données de violation CSP en Report-Only pendant 2-4 semaines, passer à un header `Content-Security-Policy` enforced. Astro 6 supporte les nonces pour les scripts inline via `nonce` dans la config Vite.

---

## 9. Top 5 quick wins

### Quick Win 1 — Corriger l'image OG des articles blog (minutes)

L'article `blog/alchimie-vegetale-27-plantes-composition` déclare `og:image: /images/products/alchimie-vegetale-2.jpg`. Si ce fichier `.jpg` n'existe pas (toutes les images produit sont en `.webp`), tous les partages sociaux de cet article afficheront une image cassée.

**Action** : dans le terminal, depuis la racine du projet :
```bash
ls public/images/products/alchimie-vegetale-2.*
```
Si seul `.webp` existe, mettre à jour le frontmatter de `src/content/blog/alchimie-vegetale-27-plantes-composition.md` avec `og_image: /images/products/alchimie-vegetale-2.webp`. Faire la même vérification sur tous les articles blog qui déclarent une `og_image` en `.jpg`.

### Quick Win 2 — Ajouter width/height sur les images produit hero (30 min)

Sur `/boutique/alchimie-vegetale`, l'image principale de la galerie `#main-slide` est servie sans attributs `width`/`height`. Le navigateur ne peut pas calculer l'aspect ratio avant le chargement → saut de layout (CLS).

**Action** : dans le template de fiche produit (probablement `src/pages/boutique/[slug].astro`), ajouter `width` et `height` sur la balise `<img id="main-slide">` correspondant aux dimensions réelles de l'image (ou utiliser `aspect-ratio` CSS en substitut si les dimensions varient). Même correction sur les cards de la homepage.

### Quick Win 3 — Optimiser le poster vidéo homepage en WebP (15 min)

Le LCP sur la home est le poster vidéo `/videos/lbdp-pro-poster.jpg`. Un `.jpg` non optimisé peut dépasser 200-300 Ko. Convertir en `.webp` avec qualité 80 réduirait la taille de ~30-50 % sans perte visuelle perceptible.

**Action** :
```bash
cwebp -q 80 public/videos/lbdp-pro-poster.jpg -o public/videos/lbdp-pro-poster.webp
```
Puis mettre à jour le `<link rel="preload" as="image" href="/videos/lbdp-pro-poster.jpg">` et l'attribut `poster` de la balise `<video>` en `.webp`. Vérifier la compatibilité navigateur (Safari 14+ supporte WebP pour les posters vidéo).

### Quick Win 4 — Conditionner les hreflang sur les pages noindex (10 min)

Sur `/panier` et `/commande`, des balises hreflang sont émises alors que la page est `noindex`. C'est sémantiquement inutile et potentiellement confusant pour les bots.

**Action** : dans `src/layouts/Layout.astro`, conditionner le bloc hreflang avec `{!noindex && ( ... )}`. Correction en un endroit, effet sur toutes les pages noindex du site.

### Quick Win 5 — Activer IndexNow après la bascule (5 min de config Vercel)

`scripts/indexnow-submit.mjs` est câblé et testé. Il soumet les URLs du sitemap à Bing et Yandex via IndexNow immédiatement après chaque build. Le déploiement initial sur `www.` bénéficiera d'une indexation Bing en quelques heures au lieu de quelques semaines.

**Action** : dans le dashboard Vercel, sur le projet production `www.` (pas `test.*`) :
- Ajouter la variable d'environnement `INDEXNOW_ENABLED=true`
- Vérifier que la clé de validation `public/[cle-indexnow].txt` est présente dans le projet

Le script refuse explicitement les hosts `test.*` et `localhost` — il ne peut pas être déclenché accidentellement sur l'environnement de test.

---

## Annexe — Inventaire complet des points vérifiés

| Point | Résultat | Priorité |
|---|---|---|
| HTTPS valide avec HSTS preload (2 ans) | PASS | — |
| X-Robots-Tag: noindex sur test.* | PASS — intentionnel | — |
| robots.txt syntaxe et directives | PASS | — |
| robots.txt — allowlist crawlers IA (9 bots) | PASS | — |
| robots.txt — sitemap URL | Pointe sur www., acceptable | Faible |
| sitemap-index.xml accessible | PASS | — |
| sitemap-0.xml — /panier absent | PASS | — |
| sitemap-0.xml — /commande absent | PASS | — |
| sitemap-0.xml — /admin/ absent | PASS | — |
| sitemap — format hreflang fr-FR vs fr (HTML) | Incohérence | Moyen |
| sitemap — hreflang FR/EN sur fiches produit | Manquant | Moyen |
| Canonical auto-référentiels | PASS — toutes pages vérifiées | — |
| hreflang 4 langues sur home FR et EN | PASS | — |
| hreflang sur pages noindex (panier) | Inutile mais non bloquant | Faible |
| `<meta name="robots">` avec max-image-preview | PASS | — |
| og:locale fr_FR / en_GB | PASS | — |
| og:image — logo existant en fallback | PASS | — |
| og:image — articles blog .jpg vs .webp | Vérification à faire | Moyen |
| Schema LocalBusiness + WebSite + SearchAction | PASS | — |
| Schema Product avec stock live WooCommerce | PASS | — |
| Schema BlogPosting avec author/wordCount | PASS | — |
| Schema BreadcrumbList sur toutes pages testées | PASS | — |
| Viewport meta | PASS | — |
| Preload fonts WOFF2 (4 polices) | PASS | — |
| fetchpriority="high" sur LCP candidat | PASS — poster vidéo | — |
| loading="lazy" sur images non-hero | PASS | — |
| width/height sur images produit hero | Absent — risque CLS | Moyen |
| HTML statique SSG (no CSR) | PASS — SSG pur Astro 6 | — |
| JSON-LD dans le source HTML | PASS — visible sans JS | — |
| Redirections 301 WP→Astro dans vercel.json | Absent | Critique |
| CSP enforced | Absent (report-only) | Haut |
| IndexNow câblé | PASS — à activer post-bascule | — |

---

*Audit réalisé le 27 avril 2026 sur `https://test.labrasseriedesplantes.fr` — Astro 6.1.7, build du 27 avril 2026 à 17h53 UTC.*  
*Prochaine relecture recommandée : J+60 après bascule www., une fois que GSC dispose de données CrUX réelles.*
