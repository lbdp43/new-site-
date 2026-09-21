# La Brasserie des Plantes — site Astro headless WooCommerce

> **🔄 À TOI, FUTURE SESSION CLAUDE** : ce fichier est la mémoire partagée du
> projet. À chaque fois que tu fais une modification non-triviale (nouvelle
> feature, nouvelle dépendance, nouvelle variable d'environnement, changement
> d'architecture, nouveau gotcha découvert, tâche du backlog terminée…),
> **mets ce fichier à jour** dans le même commit. L'utilisateur compte dessus
> pour que chaque session reprenne efficacement le fil, sans avoir à lui
> réexpliquer le contexte à chaque fois. Garde-le concis mais à jour.



Site vitrine + e-commerce pour une marque de liqueurs artisanales (Haute-Loire).
Front-end Astro statique sur Vercel, branché à un WordPress existant via la
WooCommerce Store API. Objectif : le front-end est entièrement custom mais les
commandes/paiements/emails/livraison passent par le WordPress existant, sans
dupliquer la logique e-commerce.

## Stack

- **Astro 6** (SSG, sortie statique) — config i18n native FR (défaut) + EN (préfixe `/en/`)
- **React 19** pour les îles interactives (panier, checkout, hero blog, etc.)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Framer Motion** pour les animations
- **Stripe Elements** (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- Hébergement : **Vercel** (auto-deploy depuis GitHub `main`). Arbitrage
  Guillaume du 21/09/2026 : **on reste sur Vercel**, après avoir envisagé
  Cloudflare Pages, Railway et l'hébergement IONOS.

  ⚠️ **Point ouvert qui conditionne la bascule** : le plan gratuit de Vercel
  (Hobby) est réservé à un usage **personnel et non commercial** et interdit
  explicitement le traitement de paiement et les transactions e-commerce, avec
  désactivation possible « avec ou sans préavis ». Le compte était sur ce plan
  au 21/09/2026. **Le passage en Pro doit être fait avant que `www.` encaisse
  des cartes** — c'est un pré-requis de `docs/bascule-www.md`, pas un détail
  d'intendance.

  Le travail de migration vers Cloudflare Pages reste en place comme **plan de
  repli** (`docs/cloudflare-pages.md`) : `public/_redirects` et
  `public/_headers` sont générés au build et Vercel les ignore, donc ils ne
  coûtent rien et permettent de basculer en quelques heures si besoin.

## Internationalisation (i18n)

Le site est bilingue FR / EN depuis avril 2026.

- **FR** = langue par défaut, sans préfixe (`/notre-histoire`, `/boutique`…)
- **EN** = préfixe `/en/` avec **slugs traduits** (`/en/our-story`, `/en/shop`…)
- Mapping FR↔EN défini dans `src/i18n/routes.ts` (`routeMap` + helpers
  `localizedPath` / `alternateLangPath`)
- Traductions UI centralisées dans `src/i18n/ui.ts` (navigation, footer, CTAs,
  panier, étiquettes produit)
- Helpers dans `src/i18n/utils.ts` (`getLangFromUrl`, `t`, `useTranslations`,
  `getHreflangLinks`)
- `Layout.astro` détecte la langue automatiquement via l'URL (ou via la prop
  `lang`) et génère hreflang + `<html lang>` + `og:locale` corrects
- Language switcher dans le Header (desktop + mobile)
- Pages EN traduites à ce jour : home, contact, workshops, our-plants,
  cocktails, our-story, shop (index). **À traduire dans une session future** :
  fiches produit (`/en/shop/[slug]`), blog, lumiere-obscure, professionnels,
  faq, presse, pages légales, 404.
- Fichiers de données i18n : `src/data/plants.en.ts`, `src/data/cocktails.en.ts`

## Environnements

| Environnement | URL | Rôle |
|---|---|---|
| Production WP actuelle | `https://www.labrasseriedesplantes.fr` | Site WordPress + WooCommerce live (ne pas toucher) |
| Test Astro | `https://test.labrasseriedesplantes.fr` | Nouvelle vitrine Astro, en construction |
| GitHub | `https://github.com/lbdp43/new-site-` | Repo Vercel auto-deploy |

À terme, `www.` basculera sur Astro ; le WordPress continuera de tourner en
back-end (admin, commandes, produits, paiements) mais ne servira plus de
front-end public.

## Architecture headless

```
Navigateur ─(browser)─▶ Astro SSG (Vercel CDN)
         │
         └─(fetch Store API)─▶ WordPress (WooCommerce + WooPayments)
                                 └─ Stripe (via WooPayments)
                                 └─ Emails, EasyBee, factures, stock, TVA...
```

Le front Astro ne dédouble **aucune** logique e-commerce : tout (panier, stock,
prix, TVA, livraison, codes promo, emails de confirmation, intégration
transporteur EasyBee) reste géré par WooCommerce côté serveur.

### Flux panier

1. `src/components/cart/AddToCartButton.tsx` (île React sur fiche produit)
2. → `wc.addItem({id: product.wcId, variation: [{attribute, value}]})` 
3. → `POST /wp-json/wc/store/v1/cart/add-item` sur labrasseriedesplantes.fr
4. WooCommerce renvoie un `Cart-Token` (JWT) stocké dans `localStorage`
5. Les requêtes suivantes envoient le token dans l'en-tête `Cart-Token`

### Flux checkout (WooPayments)

1. `src/components/cart/CheckoutPage.tsx` charge Stripe.js avec
   `loadStripe(pk, { stripeAccount: accountId })`
2. `PaymentElement` collecte la carte (filtré à `paymentMethodTypes: ["card"]`
   pour exclure Klarna / Multibanco, garder les wallets Apple Pay / Google Pay)
3. Sur submit : `stripe.createPaymentMethod()` → on récupère `pm_xxx`
4. `POST /wp-json/wc/store/v1/checkout` avec :
   ```json
   {
     "payment_method": "woocommerce_payments",
     "payment_data": [
       { "key": "payment_method", "value": "woocommerce_payments" },
       { "key": "wcpay-payment-method", "value": "pm_xxx" },
       { "key": "wcpay-payment-method-type", "value": "card" },
       { "key": "wc-woocommerce_payments-new-payment-method", "value": "false" }
     ]
   }
   ```
   ⚠️ **`payment_method` est DUPLIQUÉ** (top-level + dans payment_data) —
   sans le doublon, WooPayments 10.7 plante avec une `TypeError` fatale
   dans `get_payment_method_types()` (return null sur un type déclaré
   `array`). Cause exacte : `WooCommerce/StoreApi/Legacy.php` fait
   `$_POST = $payment_data;` (REMPLACE), donc le `payment_method`
   top-level du JSON n'atterrit pas dans `$_POST['payment_method']`,
   que la fonction WooPayments lit côté PHP. Diagnostiqué le 25 avril
   2026 — voir `fatal-errors-2026-04-25.log` côté WP.
5. **3D Secure / SCA** — la réponse contient un hash de confirmation
   `#wcpay-confirm-pi:{order_id}:{client_secret}:{nonce}` que le front
   doit extraire pour appeler `stripe.confirmCardPayment(clientSecret)`.
   ⚠️ Ce hash n'arrive PAS dans `payment_result.redirect_url` (qui est
   strippé par `esc_url_raw()` dans `WC StoreApi\Payments\PaymentResult`),
   il arrive dans `payment_result.payment_details[].redirect`. CheckoutPage
   gère les 2 sources par sécurité. Sans ça, le PaymentIntent reste en
   `requires_action`, la carte n'est pas débitée et la commande WC
   reste en "En attente de paiement" indéfiniment. Diagnostiqué le 26
   avril 2026.
6. WooPayments crée la commande, débite la carte (après 3DS), envoie les
   emails, notifie EasyBee. Redirection vers `/commande/confirmation?order=XXX&key=YYY`.

## Variables d'environnement

Variables `PUBLIC_*` → exposées côté client (non-secret par design).

| Variable | Valeur (Vercel) | Rôle |
|---|---|---|
| `PUBLIC_WC_BASE_URL` | `https://www.labrasseriedesplantes.fr` | Base URL de la Store API |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_51ETDmy…TvtxNs` | Clé Stripe publique (WooPayments) |
| `PUBLIC_STRIPE_ACCOUNT_ID` | `acct_1Mg83iFkUaBLmhte` | Compte Stripe Connect de WooPayments |

Variables non-`PUBLIC_` (optionnelles, jamais exposées client) :

| Variable | Rôle |
|---|---|
| `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` | Clé REST API v3 WC pour des scripts de build (pas utilisé en runtime) |

Pour développer localement : `cp .env.example .env` puis remplir. `.env` est
gitignore. Ne **jamais** commiter de secret.

## Mapping produits

**Architecture depuis avril 2026 (Phase 2 CMS)** :

- **Source de vérité éditoriale** = `src/content/products/*.md` (1 fichier
  par produit). Éditable via Sveltia CMS à `/admin/` → collection "Produits".
  Frontmatter YAML pour les champs structurés, body markdown pour la
  description longue.
- **Source de vérité e-commerce** = WooCommerce (prix, stock, variations,
  wcId). Synchronisé au build via `sync-wc-stock.mjs`.
- `src/data/products.ts` est maintenant un **thin wrapper** qui lit
  `src/data/products.generated.json` (généré au prebuild par
  `scripts/generate-products.mjs`). L'API publique (`products`, `ranges`,
  `featuredProducts`, `productsBySlug`, types `Product` / `ProductRange`)
  reste identique, zéro changement côté 14 fichiers consommateurs.

**Flux ajout nouveau produit** :
1. Création côté WooCommerce (nom, prix, variations, stock) — comme d'habitude
2. Au prochain build, `sync-wc-stock.mjs` détecte le nouveau `wcId`, crée un
   stub `src/content/products/<slug>.md` avec `draft: true`
3. Guillaume/Étienne ouvre `/admin/` → collection "Produits" → la
   nouvelle fiche apparaît avec badge "draft"
4. Remplit les champs éditoriaux (description, tasting, photos par
   contenance, serving…) → passe `draft: false` → Publish
5. Commit auto → Vercel redeploy → fiche publique en 90s

Chaque produit a un `wcId` (ID numérique WooCommerce).

**Attribut de variation** :
- Par défaut : `"Contenance"` (attribut local WC, **pas** `pa_contenance`)
- Exception Flasque Entonnoir : `wcSizeAttribute: "Gravure"` (attribut propre
  avec variantes "Sans personnalisation" / "Avec personnalisation")

## Plugin WordPress CORS

`wordpress-plugin/astro-cors/astro-cors.php` est installé + activé sur le WP
live. Il autorise uniquement ces origines à taper sur `/wp-json/*` :

- `https://test.labrasseriedesplantes.fr`
- `http://localhost:4321` (dev Astro)
- `http://127.0.0.1:4321`

Pour ajouter le domaine `www.` au moment de la bascule, éditer la fonction
`lbdp_astro_allowed_origins()` dans le plugin.

## Commandes clés

```bash
npm run dev       # dev server http://localhost:4321
npm run build     # build de production → ./dist
npm run preview   # aperçu du build de prod
npm run astro ... # CLI Astro
```

## Langues supportées — statut actuel

Le site est structuré autour de 4 langues :

- **FR** — langue par défaut, 100% des pages traduites (58 pages)
- **EN** — 28 pages traduites : home, notre-histoire, boutique (index + 20 fiches produit), cocktails, plantes, ateliers, contact, coffret DIY, 5 articles blog + routing `/en/journal/*`
- **ES** — **fondations uniquement** : home minimale `/es/` + slugs mappés dans `routes.ts`. Pages à créer progressivement.
- **IT** — **fondations uniquement** : home minimale `/it/` + slugs mappés. Pages à créer progressivement.

Pour ajouter une page ES ou IT :
1. Créer `src/pages/{es|it}/{slug-localisé}.astro`
2. Le slug doit correspondre à celui déclaré dans `src/i18n/routes.ts` (section ES/IT déjà remplie pour les pages principales)
3. Dans le fichier, passer `lang="es"` ou `lang="it"` au `Layout`
4. Ajouter les traductions UI spécifiques dans `src/i18n/ui.ts` (les clés non traduites retombent automatiquement sur FR via le fallback de `t()`)

## Bascule `www.` → Astro

**Checklist complète et toujours à jour dans `docs/bascule-www.md`.**

Ce fichier contient 3 sections :
1. **Pré-requis** avant bascule (tests paiement, backups, etc.)
2. **Plan de bascule en 4 étapes** (DNS, CORS, env vars)
3. **⏭ À faire APRÈS la bascule** — checklist complète (sitemap GSC,
   IndexNow, Featurable prod, DMARC, GBP URL, schema validation, 404
   monitoring, hreflang, etc.)

**Convention** : toute décision ou intégration qui sort "j'active ça après
la bascule" DOIT être ajoutée à la section "À faire APRÈS la bascule" de
`docs/bascule-www.md` dans le même commit. Objectif : le jour J, il suffit
de dérouler la liste sans avoir à retrouver les décisions éparpillées.

## Coffret DIY — configurateur "Chute & rebond"

Feature de différenciation : le visiteur compose son propre coffret en
**empilant** dynamiquement des bouteilles parmi la gamme. Refonte UX avril 2026
depuis un design handoff professionnel (variante "Chute & rebond" choisie).

- **UI** : `src/components/coffret/CoffretBuilder.tsx` (île React, client:load)
  - Layout 2 colonnes desktop / 1 colonne mobile avec pile sticky à gauche
  - Animation **Framer Motion** `<AnimatePresence>` + spring physics (stiffness
    280, damping 18) pour l'effet "bouteille qui tombe et rebondit"
  - Tilt déterministe par `uid` pour éviter une pile trop rigide
  - Doublons autorisés (plusieurs fois la même bouteille via `uid` unique)
  - Persistance localStorage (clé `lbdp-coffret-v2`)
  - Pas de limite stricte — la "taille cible" est 3 (metadata WC), mais on
    peut empiler 2, 4, 5… ou plus
- **Pages** : `/composer-mon-coffret` (FR) et `/en/build-your-gift-box` (EN)
- **Teaser homepage** (FR + EN) — après le carousel produits
- **Photos** : utilise `p.sizeImages[20]` (format empilable 20 cl) quand dispo,
  fallback sur `p.image` sinon
- **⚠️ Spécificité images `sizes/*-20cl-stack.webp`** — CRITIQUE : ces fichiers
  DOIVENT avoir un **fond transparent** (`hasAlpha: true, channels: 4`), sinon
  la bouteille apparaît dans un carré blanc opaque qui casse l'effet Chute &
  rebond (bouteille toute petite au milieu d'un rectangle blanc au lieu de se
  fondre dans le layout).

  Format cible : environ 459×551 (ratio ~5:6, les autres varient 456→513 en
  largeur). La bouteille doit **remplir tout le cadre** (fit: cover) — pas
  contain qui ajoute des bordures blanches.

  Recette sharp pour convertir un packshot fond blanc en stack transparent :
  ```js
  // 1) Convertir tout pixel presque-blanc (>245 RGB) en transparent
  const raw = await sharp(SRC).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(raw.data);
  for (let i = 0; i < buf.length; i += raw.info.channels) {
    const [r, g, b] = [buf[i], buf[i+1], buf[i+2]];
    if (r > 245 && g > 245 && b > 245) buf[i+3] = 0;
  }
  // 2) Trim serré + cover 459×551 + WebP avec alpha
  await sharp(buf, { raw: { width, height, channels: 4 } })
    .trim()
    .resize({ width: 459, height: 551, fit: 'cover', position: 'center' })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile('public/images/products/sizes/<slug>-20cl-stack.webp');
  ```

  Cas typique où on se plante : `.flatten({ background: '#ffffff' })` avant
  export WebP → détruit la transparence, on se retrouve avec un carré blanc.
  À NE PAS FAIRE pour les fichiers stack.

  Diagnostiqué le 29 août 2026 sur la Flèche Ardente 20cl.

  **Cache navigateur** : le fichier corrigé garde la même URL, donc les
  visiteurs qui avaient chargé la version à fond blanc continuaient de la
  voir (bouteille minuscule dans un rectangle blanc) — signalé par Guillaume
  le 21/09/2026, des semaines après le correctif. Les deux pages coffret
  suffixent désormais les images empilables d'un `?v=2`. Si un fichier stack
  est re-corrigé un jour, incrémenter ce numéro dans
  `composer-mon-coffret.astro` **et** `en/build-your-gift-box.astro`.
- **Trios suggérés** (`src/data/coffret-trios.ts`) — 6 compositions curées
  affichées sous le configurateur, clic → remplit la pile d'un coup
- **Intégration panier** : à l'ajout, `cartActions.addItem` est appelé N fois
  avec `cart_item_data` : `_coffret_diy: N`, `_coffret_position: i/N`,
  `_coffret_label`, et optionnel `_coffret_gift_message`. Côté WooCommerce,
  ces métadonnées apparaissent dans l'admin de commande sous chaque ligne.
- **Pas de plugin WP requis** : la Store API native accepte `cart_item_data`
  et WC Blocks le préserve en BO. Stock, TVA, livraison, emails, WooPayments,
  EasyBee → fonctionnent comme d'habitude.
- **Contenance commandée** : 20 cl (format empilable) si dispo côté WC,
  sinon la plus petite taille. Ajustable dans la page `.astro` via le champ
  `defaultSize` et `wcSizeAttribute`.

Design handoff d'origine : `design_handoff_coffret_bouteilles/` (reçu en zip).
Variante retenue : Chute & rebond. Variantes 2 (coffret bois) et 3 (vitrine)
disponibles dans le handoff si on veut changer un jour — il suffit de
remplacer le contenu de la colonne gauche.

## Fichiers critiques i18n

| Fichier | Rôle |
|---|---|
| `src/i18n/ui.ts` | Dictionnaire des chaînes UI FR + EN (type `UIKey`) |
| `src/i18n/routes.ts` | Mapping FR↔EN des slugs (`routeMap`) + helpers `localizedPath`, `alternateLangPath` |
| `src/i18n/utils.ts` | Helpers `getLangFromUrl`, `t`, `useTranslations`, `getHreflangLinks`, `getHtmlLang`, `getOgLocale` |
| `src/data/plants.en.ts` | Descriptions EN des 12 plantes (keyed par nom FR) |
| `src/data/cocktails.en.ts` | Traductions EN des 5 cocktails (keyed par slug) |

## Fichiers critiques

| Fichier | Rôle |
|---|---|
| `src/lib/woocommerce.ts` | Client Store API (fetch wrapper, Cart-Token, Nonce) |
| `src/lib/cart-store.tsx` | Store de panier partagé entre îles Astro (module singleton + `useSyncExternalStore`, pas de Context) |
| `src/components/cart/CartIcon.tsx` | Icône panier Header (badge + total) |
| `src/components/cart/AddToCartButton.tsx` | Bouton ajouter au panier fiche produit |
| `src/components/cart/CartPage.tsx` | Page panier (tableau + récap + code promo) |
| `src/components/cart/CheckoutPage.tsx` | Page commande (adresse + Stripe Elements + livraison dynamique) |
| `src/pages/panier.astro` | Route `/panier` |
| `src/pages/commande.astro` | Route `/commande` |
| `src/pages/commande/confirmation.astro` | Route `/commande/confirmation` |
| `src/pages/blog/index.astro` | Route `/blog` (label UI "Actualité" côté FR). Hero staggered (BlogHeroIntro) + filtre catégories client-side (Fabrication / Terroir / Actualité / Plantes / Recettes). |
| `src/components/BlogHeroIntro.tsx` | Hero éditorial staggered (flou → net) pour /blog — kicker + titre + script + paragraphe d'intro. |
| `src/content/products/*.md` | **Source de vérité éditoriale** des fiches produit (1 fichier par SKU). Éditable via Sveltia CMS. `ingredients` (mention d'étiquette) et `composition` (même info en puces) alimentent un seul bloc « Ingrédients » — voir la section dédiée. Pendant EN : `productsEn[slug]` dans `src/data/products.en.ts`. |
| `src/data/products.ts` | Thin wrapper — importe `products.generated.json` + définit types + ranges + helpers |
| `src/data/products.generated.json` | Généré au prebuild par `generate-products.mjs`. Ne pas éditer à la main. |
| `scripts/generate-products.mjs` | Script prebuild : compile les .md → JSON consommable sync |
| `scripts/sync-wc-stock.mjs` | Script prebuild : fetch stock WC + prix par contenance (variations) + auto-draft des nouveaux produits WC |
| `scripts/indexnow-submit.mjs` | Script postbuild : POST sitemap à IndexNow (Bing/Yandex) |
| `src/lib/wc-live.ts` | Helpers `getSchemaAvailability`, `isOutOfStock`, `getSizePrices`, etc. |
| `src/lib/featurable.ts` | Fetch (mémoïsé) des avis Google via Featurable au build. Expose `getFeaturableWidget()`, `getFeaturableAggregate()` et `buildAggregateRatingSchema()`. Single fetch partagé par `GoogleReviewsEmbed.astro` + le schema `LocalBusiness` (FR + EN home). |
| `src/content/static-pages/notre-histoire.md` | Contient le **décompte des distinctions** (titre « Douze distinctions », tagline, bloc stats, paragraphe d'intro, cartes `productsWithMedals`). ⚠️ **Non dérivé des fiches produit** — à remettre à jour à la main quand une médaille est ajoutée, en même temps que le pendant EN `src/pages/en/our-story.astro` (compteur + paragraphe, tous deux en dur). Au 21/09/2026 : 12 distinctions, 5 produits. |
| `src/data/award-logos.ts` | Table libellé de distinction → visuel officiel du concours (`findAwardLogo`). Consommée par la fiche produit et la section « Des arguments de vente solides » de `/professionnels`, qui affiche **toutes** les distinctions de la maison en dérivant les `awards` des fiches produit (12 au 21/09/2026) — aucune liste en dur, une médaille ajoutée à un frontmatter apparaît au build suivant. Ajouter un logo = déposer le WebP dans `public/images/awards/` + une entrée avec lookaheads (millésime + concours + niveau). |
| `src/data/wc-live.json` | Snapshot stock + prix par contenance live (régénéré à chaque build, committé) |
| `public/admin/index.html` + `public/admin/config.yml` | Interface CMS (Sveltia) + config collections blog |
| `public/llms.txt` | Manifest IA (Markdown) — résumé structuré pour AI Overviews / ChatGPT / Perplexity. À garder synchronisé avec la gamme produits + distinctions |
| `docs/cms-admin.md` | Guide utilisateur du CMS (auth GitHub, rédaction, SEO) |
| `astro.config.mjs` | Config Astro + filtre sitemap (exclut /panier, /commande, /admin) + priorités différenciées + locales sitemap **alignées sur les codes courts** (`fr`, `en`, `es`, `it` — pas `fr-FR`) pour cohérence avec `getHreflangLinks` HTML |
| `vercel.json` | **Source de vérité** des en-têtes et des 44 redirections 301. Headers sécurité (HSTS, X-Frame, **CSP enforced** depuis 2026-04-27) + noindex sur `test.*`. Le CSP global est assez permissif pour Sveltia (unpkg, cdn.jsdelivr, auth.sveltia.app, api.github.com) — il n'y a **pas** de règle `/admin/*` séparée, contrairement à ce que disait ce tableau avant le 21/09/2026. |
| `public/_redirects` + `public/_headers` | **Générés** depuis `vercel.json` au prebuild. Inertes sur Vercel (qui les ignore) — ils n'existent que pour le plan de repli Cloudflare. Ne jamais éditer à la main. |
| `scripts/generate-cloudflare-config.mjs` | Traduit `vercel.json` → `_redirects` / `_headers` |
| `scripts/verify-cloudflare-config.mjs` | **Utile indépendamment de l'hébergeur** : rejoue les 44 redirections sur 152 URL (avec ET sans slash final) et contrôle que 23 pages vivantes ne sont capturées par aucune règle. **Fait échouer le build** en cas d'écart. C'est le filet de sécurité du plan 301 de la bascule. |
| `docs/cloudflare-pages.md` | Plan de repli Cloudflare Pages en 5 étapes (migration envisagée puis écartée le 21/09/2026) |
| `wordpress-plugin/astro-cors/astro-cors.php` | Plugin WP pour autoriser CORS depuis Astro |
| `blog-audit-report.md` | Audit qualité 28 articles blog FR (2026-04-27) — scoring 100 pts, action queue priorisée |
| `seo-technical-report.md` | Audit technique site (2026-04-27) — score 81/100, 5 issues pré-bascule www. |
| `seo-content-report.md` | Audit éditorial pages statiques (2026-04-27) — score 72/100 |
| `seo-schema-report.md` | Audit Schema.org (2026-04-27) — couverture, validations, code Recipe prêt à coller |
| `seo-geo-report.md` | Audit GEO/AI (2026-04-27) — score 62/100, llms.txt template |

## Pages statiques éditables via CMS (Option B — Phase 3)

Depuis septembre 2026, le contenu éditorial des pages statiques est extrait
dans `src/content/static-pages/<slug>.md` (Content Collection Zod), éditable
via Sveltia CMS. La structure HTML/Tailwind reste dans le fichier `.astro`,
seuls les **textes + images** sont exposés au CMS.

**Pattern à suivre pour ajouter une page au CMS** :

1. Décider quels champs sont éditables (kickers, titres, paragraphes, images,
   listes) et lesquels restent en dur (structure, animations, logique).
2. Écrire le schema Zod dans `src/content.config.ts` sous la clé
   `staticPages`. Étendre la définition ou créer un schema discriminé si les
   pages ont des structures très différentes.
3. Créer `src/content/static-pages/<slug>.md` avec le frontmatter YAML +
   les valeurs actuelles (extraites du .astro).
4. Refactor le `.astro` :
   - `const entry = await getEntry('static-pages', '<slug>')` + guard
   - Remplacer chaque texte/image hardcodé par `entry.data.xxx`
   - Wrapper les blocs optionnels dans `{condition && (...)}`
5. Ajouter les champs dans `public/admin/config.yml` (miroir du Zod), avec
   `widget: image` pour les visuels et `widget: file` pour les vidéos mp4.

**Pages livrées (sept. 2026)** — 6 pages statiques éditables via
Sveltia `/admin/` → collection **Pages du site** :
- `ateliers` — hero, workshopsSection, workshops[], locationSection,
  artisanSection, groupsSection, ctaSection
- `notre-histoire` — pageHeader, videoHero, stats[], storySections[]
  (image + texte alterné avec `layout: image-left|image-right|prose`),
  distinctionsSection (flagship + productsWithMedals[] + innovationAward),
  teamSection (members[]), gallerySection (photos[]), ctaSection
- `nos-plantes` — pageHeader, videoBanner, introParagraphs[]
  (Markdown **gras** + *italique*), listClosing, demarcheSection,
  ctaSection. La grille des 40 plantes reste dans `src/data/plants.ts`
- `contact` — pageHeader, contactBlocks (labels), form (labels + options
  du sujet). Le formulaire Netlify Forms reste intact ; adresse/tel/email
  viennent toujours de `src/data/site.ts`
- `faq` — pageHeader, faqCategories[] (nom + questions[]), ctaSection.
  Schema FAQPage @ Schema.org généré automatiquement depuis les Q/A
- `presse` — pageHeader (avec placeholder `{{count}}` = compteur total),
  ctaSection. La revue de presse (mentions) reste dans `src/data/press.ts`

**Architecture** : Sveltia utilise `files:` collection (chaque page = un
fichier fixe avec son propre schéma) → UX propre côté CMS (chaque page
apparaît comme sa propre entrée avec les seuls champs pertinents).
Côté Zod, un schéma unifié avec presque tous les blocs `.nullish()` —
chaque template `.astro` consomme uniquement les champs dont il a
besoin, en optional chaining.

**Rendu inline Markdown** : les paragraphes CMS sont rendus via un
petit helper `renderInline(s)` qui convertit `**gras**` et `*italique*`
en HTML sans dépendre de `marked` (import lourd pour 3 balises).
Pattern à réutiliser dans les futures pages.

**Pages livrées supplémentaires (sept. 2026, batch 2)** — la totalité
des pages statiques FR sont désormais éditables via Sveltia CMS :

- `index` (page d'accueil) — heroHome (badge, logo, vidéo, CTAs),
  carouselSection (kicker/heading), historySection (paragraphes +
  liens), introVideoSection (bandeau vidéo), coffretTeaser (3
  stackImages), cocktailsSection (4 cocktails éditables), visitSection
  (visite boutique avec placeholders `{{address}}`/`{{city}}`),
  ctaSection, featuredSection
- `mentions-legales` — meta + pageHeader + **body markdown complet**
  (widget `markdown` dans Sveltia, éditeur riche)
- `cgv` — meta + pageHeader + body markdown complet
- `politique-cookies` — meta + pageHeader + body markdown +
  cookiesTable structurée (functionalCookies + analyticsCookies)
- `cocktails` — meta + pageHeader + ctaSection (les 5 recettes
  restent dans `data/cocktails.ts` — logique catalogue)
- `lumiere-obscure` **⚠️ YMYL** — meta uniquement (le corps + la FAQ
  YMYL sur CBD/THC restent en dur pour ne pas casser accidentellement
  le cadre légal THC < 0,1 % arrêté 30 déc 2021)
- `liqueurs-de-plantes`, `liqueur-digestive`, `liqueurs-artisanales`
  — meta uniquement (landing SEO au contenu figé)
- `professionnels` — meta uniquement (multi-sections + formulaire
  quote, à ouvrir en Phase 4 si besoin)

**Sveltia** : 12 pages listées dans la collection « Pages du site » —
Page d'accueil, Ateliers, Notre histoire, Nos plantes, Contact, FAQ,
Presse, Cocktails, Lumière Obscure (CBD), Liqueurs de plantes (SEO),
Liqueur digestive (SEO), Liqueurs artisanales (SEO), Professionnels,
Mentions légales, CGV, Politique de cookies.

**Pattern body markdown (pages légales)** : import `render` depuis
`astro:content`, `const { Content } = await render(entry);`, puis
`<Content />` dans le template avec la classe `.prose` de Tailwind
Typography. Sveltia expose un widget `markdown` riche (H2, gras,
italique, listes, liens, citations `>`) → l'équipe édite comme un
Google Doc.

**Phase 4 possible** : ouvrir `lumiere-obscure` FAQ (avec **grand
warning YMYL**), professionnels sections marketing, catégories SEO
prose profonde. À faire seulement à la demande de Guillaume.

## ⚠️ Orthographe des noms produit — ne pas « corriger »

Les noms commerciaux suivent **l'étiquette physique de la bouteille**, pas
l'orthographe du dictionnaire. Ne jamais les corriger sans photo de
l'étiquette à l'appui.

| Nom correct (= étiquette) | Ne PAS écrire | Note |
|---|---|---|
| **Le Gorgeon des Machurés** | ~~Mâchurés~~ | Vérifié sur photo d'étiquette le 2026-09-21. Le mot commun *mâchurer* prend bien un circonflexe, mais l'étiquette imprime MACHURÉS sans accent — le site doit correspondre à ce que le client a en main. Corrigé à tort en septembre 2026 (PR #25), reversé aussitôt (PR #28). |
| **La Pralicoquine** | ~~PraliCoquine~~ | Minuscule au c, confirmé par Guillaume. |
| **L'Essence des Cimes** | ~~L'Essence des Alpes~~ | Renommé le 2026-09-21 (arbitrage Guillaume). Le slug reste `essence-des-alpes` — fichier `.md`, images `sizes/essence-des-alpes-*.webp`, clé `products.en.ts` et URL inchangés. |

S'applique aussi au mot commun quand il désigne les mineurs (« en mémoire
des Machurés »), pour rester cohérent avec le nom du produit.

Les slugs d'URL restent en minuscules sans accent
(`/boutique/gorgeon-des-machures`) : ne jamais les toucher, des liens
externes et des redirections 301 en dépendent.

### ⚠️ Flèche Ardente 20 cl — l'étiquette de la photo ne correspond PAS à la fiche

`sizes/fleche-ardente-20cl*.webp` montre l'**ancienne bouteille** :
« Alc 27% vol » et « CASSIS · FRAMBOISE · MYRTILLE · PITAYA », là où la fiche
annonce 22 % et framboise / pétale de rose / jus de citron.

**C'est voulu** — confirmé par Guillaume le 21/09/2026 : on écoule l'ancien
stock, donc la photo montre ce que le client va recevoir. Ne pas « corriger »
la photo ni aligner le degré ou les plantes dessus. Décision d'origine :
commit `529fb8c` « garde l'ancienne bouteille (écoulement stock) ». À revoir
seulement quand le stock 20 cl sera écoulé.

**La rose est une rose de Provins** (*Rosa gallica* var. *officinalis*), pas
une rose de Damas — corrigé le 21/09/2026 sur la fiche produit FR, la fiche
plante FR/EN et la description EN. Ne pas rétablir *Rosa × damascena*. Comme
pour toute plante, on ne mentionne pas son origine géographique (règle d'or
sourcing) : « rose de Provins » est un nom de variété, pas une provenance.

## Listes d'ingrédients (champ `ingredients`)

Depuis le 2026-09-21, chaque fiche liqueur porte deux champs distincts :

**Un seul bloc « Ingrédients » à l'écran** (arbitrage Guillaume, 21/09/2026 :
« ingrédient et composition sont la même chose »).

| Champ | Contenu | Où il s'affiche |
|---|---|---|
| `ingredients` | mention type étiquette (eau, sucre, alcool, puis les plantes) | le bloc « Ingrédients » de la fiche produit, FR et EN |
| `composition` | les plantes en liste | **plus sur la fiche produit** — uniquement les vignettes de `/lumiere-obscure` et `/en/dark-light` |

**Une fiche sans `ingredients` n'affiche aucun bloc.** C'est volontaire pour
**Le Gorgeon des Machurés** et **La Pralicoquine** (Guillaume, 21/09/2026) :
ne pas les « compléter », et ne pas rétablir de repli sur `composition`.

Pendant EN : `productsEn[slug].ingredients` dans `src/data/products.en.ts`
(le template retombe sur la valeur FR si la clé EN manque).

**Provenance — à savoir avant de modifier** :
- **5 mentions reprises mot pour mot du WordPress live** (doc fourni par
  Guillaume le 21/09/2026) : Herbe des Druides, Lime des Prés, Nectar
  d'Ostara, Flèche Ardente, Gorgeon des Machurés.
- **11 mentions dérivées** de `composition` sur le patron des 5 premières,
  appliquées sur instruction de Guillaume le 21/09/2026. Elles n'ont **pas**
  été relues sur l'étiquette physique. À confronter aux étiquettes avant la
  bascule www.

**Mention bio** : ajoutée uniquement là où une source l'atteste (les 3
produits que le WordPress documente + le génépi de l'Essence des Cimes).
Jamais généralisée — cf. règle d'or sourcing plantes.

**Allergène** : la Pralicoquine contient des **amandes** (fruits à coque).
Sur une vraie étiquette l'allergène doit ressortir typographiquement ; la
ligne du site ne le met pas en gras pour l'instant.

**⚠️ Contradiction FR/EN non résolue sur les colorants** : la FAQ FR
(`src/content/static-pages/faq.md`) affirme « pas de colorant », alors que
la FAQ EN (`src/pages/en/faq.astro`) cite le charbon végétal du Gorgeon et
la **cochenille** de la Pralicoquine — et que `composition` du Gorgeon liste
bien « Charbon végétal ». Aucun colorant n'a donc été inscrit dans les
`ingredients`. À trancher avec Guillaume, puis aligner les deux FAQ.

## 🚨 Vocabulaire interdit — procédé de fabrication

**Consigne de Guillaume (2026-09-21)** : ne jamais écrire **macération**,
**macérat**, **macérer**, **macéré(e)(s)** — ni leurs équivalents anglais
*maceration*, *macerated*, *macerating* — nulle part sur le site.

Vocabulaire de remplacement, **qui ne doit pas nommer un autre procédé** :
« élaboration », « fabrication », « préparation », « travail des plantes »,
« extrait », « travaillé à froid », « temps longs ». Ne pas substituer
« infusion » ou « distillation », qui affirmeraient une autre technique.

Balayage fait le 2026-09-21 : 162 occurrences → **1 restante**, dans un
**avis client recopié mot pour mot** sur `/ateliers`
(`src/data/wecandoo-reviews.json`). On ne réécrit pas les mots d'un client :
à remplacer par un autre avis si Guillaume le souhaite.

L'article `maceration-froide-pourquoi-pas-distillation.md` a été **supprimé**
(son titre, son URL et sa thèse entière reposaient sur le procédé). Vérifié le
21/09/2026 : le fichier n'existe plus et la collection blog ne contient aucun
brouillon.

**Commande de vérification :**
```bash
grep -rniE "mac[ée]r" src/ public/*.txt | grep -v generated.json | grep -v wecandoo-reviews
```

## 🚨 « Sans arôme ajouté » — ne JAMAIS généraliser à la gamme

**Guillaume, 2026-09-21 : il y a de l'arôme dans Le Menthor et La
Pralicoquine.** Toute formulation qui affirme l'absence d'arôme pour
*l'ensemble* de la gamme est donc fausse.

**Deux interdits :**
1. Ne jamais écrire que la gamme, « nos liqueurs » ou « toutes nos
   recettes » sont sans arôme ajouté.
2. Ne jamais écrire non plus **qu'il y a** de l'arôme dans Le Menthor ou
   La Pralicoquine. Ces deux fiches ne parlent pas d'arôme, dans un sens
   ni dans l'autre.

**Ce qui reste autorisé** : le claim au niveau d'un produit précis dont
c'est vrai. Conservé à date sur **L'Herbe des Druides** et **L'Alchimie
Végétale**. Ne pas l'étendre à un autre produit sans confirmation.

Nettoyage du 2026-09-21 — claims gamme retirés de : FAQ FR et EN,
meta de la home, `/boutique` (meta + texte), `/liqueurs-artisanales`
(meta + intro), `/liqueurs-de-plantes` (meta + bloc « nos trois
engagements »), `/digestif-naturel` (×2), `/aperitif-artisanal`,
`/en/our-story`, `public/llms.txt`, article `likora-2022`.

Au passage, la FAQ FR affirmait aussi « pas de colorant » alors que le
Gorgeon est coloré au charbon végétal. Les deux FAQ disent maintenant la
même chose : pas de conservateur, un ingrédient naturel pour la couleur,
jamais de colorant de synthèse. La mention « cochenille pour le rose de
la Pralicoquine », qui n'existait que côté EN, a été retirée faute de
confirmation.

✅ **Tension résolue** — les landings `/liqueurs-artisanales`,
`/liqueurs-de-plantes` et `/aperitif-artisanal` conseillaient au lecteur de
chercher la mention « sans arôme ajouté » comme critère de reconnaissance
d'une vraie liqueur artisanale, ce qui lui aurait fait tirer une mauvaise
conclusion sur Le Menthor. Vérifié le 21/09/2026 : **plus aucune occurrence
du mot « arôme »** dans les articles de blog ni dans ces trois pages.

## Brouillons d'articles

`draft: true` masque un article de `/blog` et `/en/journal` (index + page
d'article). Le champ n'existait que pour les produits jusqu'au 2026-09-21 :
posé sur un article, **Zod le supprimait silencieusement et l'article
partait quand même en ligne**. Il est désormais déclaré dans `blogSchema` et
`blogEn`, filtré dans les quatre templates, et exposé dans Sveltia.

## Règle d'or CMS (Sveltia)

**NE JAMAIS** utiliser un widget `object` avec clés numériques dans
`public/admin/config.yml`. Sveltia CMS les interprète comme indices
d'array et sauvegarde un array sparse de N valeurs null (N = max
index). Bug rencontré en avril 2026 sur `sizeImages` qui utilisait
`{"20": "...", "50": "...", "150": "..."}` → Sveltia a écrit un array
de 170 entrées.

**Pattern à utiliser** : `widget: list` avec sous-champs
`[{name: key, widget: number}, {name: value, widget: ...}]`. Le script
`generate-products.mjs` reconvertit la list en `Record<number, string>`
pour préserver l'API côté templates.

Aussi : schema Zod toujours en `.nullish()` (pas `.optional()`) pour
accepter les `null` que Sveltia injecte sur les champs optionnels
laissés vides. Helper `emptyToUndefined` dispo dans `content.config.ts`.

## Page "Actualité" (ex-Journal)

Avril 2026 : la section blog/chroniques s'appelle **"Actualité"** côté UI FR
(`nav.journal` → `"Actualité"` dans `src/i18n/ui.ts`). **L'URL reste `/blog`** —
on n'a pas renommé les routes pour éviter de casser des liens externes et des
vieux partages. Côté EN, l'URL est `/en/journal/*` et le label reste "Journal".

## 🚧 Actualité temporairement retirée — décision du 21/09/2026

**Guillaume : « on les passe tous en revue mais on laisse en Actualité
temporairement retirée ».** La section reste masquée **y compris après la
bascule www.**, jusqu'à ce que les 33 articles aient été relus.

Trois leviers la masquent, à lever **ensemble** le jour où on rouvre :
1. `noindex={true}` dans `src/pages/blog/index.astro`,
   `src/pages/blog/[...slug].astro`, `src/pages/en/journal/index.astro`,
   `src/pages/en/journal/[...slug].astro`
2. Entrées retirées du `Header.astro` et du `Footer.astro`
3. Filtre sitemap dans `astro.config.mjs`

État de la revue : `blog-revue-2026-09-21.md`. La passe systématique
(conformité, liens, métadonnées, maillage) est faite — **la relecture
éditoriale article par article reste à faire**.

⚠️ À traiter **avant** de rouvrir : 24 titres sur 33 dépassent 60 caractères,
29 descriptions sur 33 sont hors des 70–160 caractères, 4 articles ne sont
liés depuis aucun autre, et le slug `producteurs-partenaires-bio-velay`
devrait être renommé tant qu'aucun lien externe n'existe.

Le hero `/blog` utilise `BlogHeroIntro` (stagger flou → net) suivi d'un filtre
client-side par catégorie (Fabrication / Terroir / Actualité / Plantes /
Recettes). Pas de galerie 3D parallaxe (retirée), pas de bouton "Voir tous les
articles" (retiré).

## 🚨 Règle d'or sourcing plantes — TOUS supports (site + articles + meta + alt)

**Règle absolue formulée par Guillaume (2026-04-27) :**
> "Faut vraiment que sur Internet tu ne marques pas comme quoi les plantes
> viennent de la région ou sont locales. La plupart de nos plantes sont bio,
> pas tous. Mais tu ne peux pas dire que nos plantes sont cueillies ou
> cultivées à proximité de Saint-Didier. Parce que c'est pas forcément le
> cas pour tout. Donc tu peux pas jouer là-dessus.
>
> Un article ou une actualité en parle sur notre site internet — tu n'en
> parles pas. Même si dans l'article externe il en a parlé."

**Conséquences strictes** :
1. **Aucun claim de proximité géographique** des plantes/cueilleurs/maraîchers
   sur le site, dans aucun support (page, article blog, meta, alt, schema,
   tagline, kicker). Pas de "Haute-Loire", "Velay", "Auvergne", "Massif
   Central", "à proximité", "à quelques km", "près de l'atelier", "voisins",
   "auvergnats", "départements voisins", "circuit court", "du territoire",
   "du coin", "locales".
2. **"La plupart de nos plantes sont bio, pas toutes"** — formulation à
   utiliser. JAMAIS "100 % bio" ni "toutes bio".
3. **Liens vers articles externes (presse) OK** — mais le label du lien et
   le texte autour doivent être neutres. On ne reformule pas le claim de
   l'article externe en notre nom.
4. **Articles d'actualité écrits par nous** : même règle que les pages.
   Pas de claim de proximité, même quand on cite/résume un article externe.

**Référence de formulation correcte :** `src/content/blog/producteurs-partenaires-bio-velay.md`
+ `src/pages/nos-plantes.astro` (intro et "Notre démarche").

**Formulations BANNIES** — à grep avant tout commit touchant à du contenu :
- toute occurrence de "Haute-Loire", "Velay", "Auvergne", "Massif Central",
  "Margeride", "Pilat", "Forez", "Cévennes" associée aux plantes/sourcing
- "plantes locales", "du coin", "à proximité", "à quelques km", "près de
  l'atelier", "voisins", "auvergnat(s)", "départements voisins"
- "circuit court", "du territoire", "de la région"
- "cueilleurs et maraîchers de Haute-Loire/du Velay/voisins"
- "**Locale**" en bullet seul
- "100 % bio", "tous bio", "toutes nos plantes en bio"
- "culture des plantes" appliqué à NOUS (on ne cultive pas)
- EN : "plants of Auvergne", "plants from Auvergne", "harvested in
  Haute-Loire", "local plants", "harvested nearby"

**Formulations OK** :
- "Liqueurs artisanales **de plantes** — Haute-Loire" (Haute-Loire qualifie
  la MAISON, pas les plantes)
- "fabriquées **en** Haute-Loire", "macération et embouteillage à
  Saint-Didier-en-Velay" (production maison, c'est vrai)
- "plantes oubliées sourcées chez nos cueilleurs et maraîchers partenaires,
  la plupart en bio"
- "La plupart de nos plantes sont en agriculture biologique — pas toutes"
- Citer le nom d'une marque concurrente avec son ancrage (ex : "Verveine du
  Velay (Pagès)" ou "Salers (auvergnat)") — c'est factuel sur le concurrent
- Ancrage géographique du LIEU : "atelier à Saint-Didier-en-Velay" / "fondateurs
  nés au pays" — vrai, n'engage pas la matière première

**Formule de sourcing de référence (Guillaume, 21/09/2026)** — celle du hero
de la home, à reprendre partout :

> « des plantes soigneusement sélectionnées, notamment auprès de
> **producteurs et cueilleurs partenaires** »

Elle remplace « des cueilleurs et des maraîchers que nous sélectionnons **un
par un** », qui sur-promet (on ne choisit ni ne rencontre chacun d'eux).
Bannir aussi ce qui va avec : « chaque récoltant est rencontré »,
« producteur rencontré », « tous nous connaissent par leur prénom »,
EN « we pick one by one », « hand-picked », « every grower is met ».

Appliqué au 21/09/2026 sur la **home** et **/nos-plantes** (+ `/en/our-plants`).

✅ **Blog balayé et vérifié le 21/09/2026** (voir `blog-revue-2026-09-21.md`) :
les 41 fichiers FR + EN ne contiennent plus aucune occurrence de l'ancienne
formule (« un par un », « chaque récoltant est rencontré », « hand-picked »)
ni de claim géographique sur les plantes. Les 6 matches restants du grep de
vérification sont légitimes : concurrents nommés avec leur ancrage
(« Verveine du Velay (Pagès) ») et greffe de Haute-Loire (la maison, pas la
matière première).

`producteurs-partenaires-bio-velay` **a déjà été réécrit** (màj 2026-04-27) :
il parle aujourd'hui de « cueilleurs, maraîchers, coopératives et filières
spécialisées », dit que certaines plantes viennent d'altitude et d'autres de
l'autre bout du monde, et que la plupart sont en bio — pas toutes.

⚠️ **Seul reste** : le **slug** contient encore `bio-velay`. Le corps est
conforme, l'URL non. L'Actualité n'ayant jamais été publique sur Astro,
le slug peut être changé sans redirection — mais seulement tant que la
section reste masquée. Slug proposé : `comment-nous-sourcons-nos-plantes`
(6 articles pointent vers lui, à mettre à jour en même temps).

**Commande de vérification (à lancer avant tout commit contenu) :**
```bash
grep -rn -i -E "(plantes?|cueilleurs?|maraîch|matière première).{0,80}(haute-?loire|velay|auvergne|massif central|d[ée]partements? voisins?|à proximit|à quelques km|près de l'atelier|locales?|circuit court|du territoire|auvergnat|du coin)" src/pages/ src/components/ src/data/ src/i18n/ src/content/ | grep -v "/admin/\|generated.json\|press.ts\|veille\|alt=\|partenaires-bio-velay\|aria-label="
```

Historique :
- PR #5 (2026-04-26) : 1ère passe sur le site (alt, meta, badges, taglines)
- Commit 2026-04-27 (matin) : 3 articles d'actualité oubliés + hero index +
  notre-histoire + ateliers
- Commit 2026-04-27 (après-midi, après clarification stricte de Guillaume) :
  retrait COMPLET de toute mention géographique appliquée aux plantes —
  pages liqueurs-de-plantes / nos-plantes / liqueurs-artisanales /
  boutique / cgv / faq / notre-histoire (schema + body), tous les articles
  blog (10 articles modifiés : choisir-liqueur, nos-cocktails-signature,
  likora, liqueur-artisanale-vs, plantes-liqueur-haute-loire (réécriture
  intro + suppression bloc "Pourquoi la Haute-Loire"), elixir, reconnaitre,
  reussir, quelle-verveine, alchimie, plantes-oubliees-du-velay,
  trois-amis), fiches produit (alchimie-vegetale, cerf-gent,
  herbe-des-druides) + régénération `products.generated.json`.
- Commit 2026-04-27 (soir, audit blog + SEO complet) :
  - **Sprint A conformité (7 fixes)** : claim "circuit court" dans
    `liqueur-gentiane-suze-salers-difference.md`, "En Haute-Loire elle
    pousse / nos maraîchers la protègent" dans `la-verveine-citronnelle.md`,
    "des plantes sauvages partout" dans `trois-amis-une-brasserie.md`,
    "du coin" + "serpolet sauvage" dans `loire-semene-tourisme-plantes-oubliees.md`,
    "moyenne montagne" → "moyenne montagne, partout en Europe" dans
    `plantes-oubliees-du-velay.md`, 3 violations dans
    `velay-attractivite-portrait-institutionnel.md` (verveine/serpolet/carvi
    sauvages → liste neutralisée + climat ne donne plus "caractère plus
    concentré aux plantes"), "Plante cueillie localement" + "nom auvergnat"
    dans `src/data/plants.ts` (Baraban).
  - **Sprint A-bis (5 fixes hors blog)** : "Le thym sauvage de nos estives
    du Velay" dans `plants.ts` (Serpolet), alt "cueillies en Haute-Loire"
    dans `notre-histoire.astro`, "Organic craft liqueurs" qualifie toute la
    gamme dans `en/index.astro`, "nos 18 liqueurs artisanales bio" dans
    `boutique/index.astro` ("bio" supprimé, "18" est le bon compte), FAQ
    "sans aucune trace de THC" → aligné sur "THC < 0,1 % seuil légal arrêté
    30 décembre 2021" (cohérence YMYL avec `lumiere-obscure.astro`),
    `lumiere-obscure.astro:156` "CBD < 0,1 %" corrigé en "THC < 0,1 %",
    excerpt presse "plantes médicinales locales" → "plantes oubliées dans
    la palette des liquoristes français".
- **Tous les claims sourcing géographiques sur les plantes ont été
  audités et corrigés** au 2026-04-27 soir (28 articles blog + plants.ts +
  press.ts + 4 pages statiques + FAQ). Le grep de vérification ne renvoie
  plus que des matches légitimes (slugs URL, qualifs maison, citations
  externes).

## Gotchas

- **Hydratation entre îles** : plusieurs îles React doivent partager l'état
  panier. Astro ne partage pas le Context React entre îles séparées — on
  utilise donc un **store niveau module** + `useSyncExternalStore` dans
  `cart-store.tsx`. Ne pas remplacer par un Context React.
- **Stock + prix live au build** : `scripts/sync-wc-stock.mjs` s'exécute au
  `prebuild` et lit `/wp-json/wc/v3/products` avec `WC_CONSUMER_KEY` +
  `WC_CONSUMER_SECRET`. Pour chaque produit variable, il appelle en plus
  `/wp-json/wc/v3/products/{id}/variations` pour récupérer **le prix par
  contenance** (parse l'attribut `Contenance` / `Gravure` → `{[cl]: priceEUR}`).
  Le résultat va dans `src/data/wc-live.json` (committé). Les helpers de
  `src/lib/wc-live.ts` le consomment pour injecter le vrai `availability`
  dans le schema Product, les badges UI "Rupture temporaire" / "Sur commande",
  et l'affichage du prix du format sélectionné sur la fiche produit
  (`getSizePrices(wcId)`). Sans clés (dev local), le script préserve le
  fichier existant et sort en code 0 — le build ne plante jamais. Les clés
  `WC_CONSUMER_*` sont obligatoires côté **Vercel** (Production + Preview)
  pour un sync réel.
- **Fiche produit — prix dynamique + notes à droite + "Vu récemment"** :
  la fiche boutique `/boutique/[slug]` affiche le prix du format sélectionné
  + prix au litre entre parenthèses (`22 € (31,43 €/L)`), les notes de
  dégustation et le conseil de service directement dans la colonne droite
  du hero (plus en bas de page), et une section "Vu récemment" (localStorage,
  clé `lbdp-recently-viewed-v1`, 6 produits max) qui apparaît dès qu'on a
  consulté au moins une autre fiche.
- **Fiche produit — section "À propos" rendue en HTML + maillage interne
  vers le blog** : depuis 2026-04-27, le body markdown du fichier
  `src/content/products/<slug>.md` est rendu via `getEntry('products', slug)`
  + `render(entry)` (pipeline Markdown natif Astro, idem que le blog) au
  lieu d'être affiché en raw text. Les liens `[texte](/url)`, gras,
  H2/H3 et listes du body sont donc cliquables/formatés. Une section
  **"Articles qui parlent de {nom du produit}"** est ajoutée juste après
  "À propos" — elle liste jusqu'à 6 articles de blog dont le body
  contient un lien vers `/boutique/<slug>` (relation construite au build
  via `getCollection('blog').filter(...)`). Tri : dernière maj la plus
  récente d'abord. Aucun travail manuel : un nouveau lien depuis un article
  vers une fiche produit fait automatiquement apparaître l'article dans
  la section dédiée du produit au prochain build.
- **IndexNow au postbuild** : `scripts/indexnow-submit.mjs` s'exécute
  APRÈS `astro build` et POST les URLs du sitemap à `api.indexnow.org`
  (protocole Bing + Yandex). **Conditionné par `INDEXNOW_ENABLED=true`**
  côté env — tant que la variable n'existe pas, le script skippe. À
  activer dans Vercel uniquement APRÈS la bascule www. → Astro (sinon
  on submit des URLs qui redirigent vers WordPress → crawl inutile).
  Le script refuse explicitement les hosts `test.*` et `localhost`.
- **Mini-CMS admin (Sveltia CMS)** : `public/admin/` monte un CMS pour
  les articles de blog FR + EN. Auth GitHub directe (proxy hébergé par
  Sveltia, zéro backend de notre côté). L'équipe édite, commit → Vercel
  redeploy → article en ligne en 90s. Config dans `public/admin/config.yml`,
  qui miroite le schema Zod de `src/content.config.ts`. Si tu ajoutes
  un champ au schema, ajoute-le aussi dans `config.yml`. Doc complète
  dans `docs/cms-admin.md`.
- **SIZE_IMAGES dans products.ts** : une photo différente par contenance,
  téléchargées depuis le WP legacy. Format `.webp` (convertis depuis PNG
  pour perf).
- **Paiement = live, pas test** : WooPayments du site est en mode LIVE. Pour
  tester sans débiter un vrai client, passe par une vraie petite transaction
  (1-2 €) puis rembourse depuis l'admin WooCommerce.

## Audit SEO — avril 2026

Audit complet : `docs/audit-seo-2026-04.md`. Corrections critiques déjà
appliquées dans le commit qui a créé ce fichier :

- `getHreflangLinks` (`src/i18n/utils.ts`) émet maintenant les 4 langues
  (FR + EN + ES + IT + x-default). Bug auparavant : seuls FR/EN étaient
  émis, donc Google ne pouvait pas relier `/es/` et `/it/` à leurs
  équivalents. `translatedPages` contient désormais `es` et `it`.
- `Layout.astro` passe la vraie langue source à `getHreflangLinks`, émet
  `og:locale:alternate` pour toutes les autres langues, et ajoute
  systématiquement `<meta name="robots" content="index, follow,
  max-image-preview:large, max-snippet:-1, max-video-preview:-1">` sur
  les pages indexables.
- `getOgLocale('en')` renvoie `en_GB` (audience européenne).
- `defaultOgImage` pointe vers `/images/brand/logo-complet-fond-blanc.webp`
  (qui existe) au lieu de `/og-default.jpg` (fichier manquant qui cassait
  tous les partages sociaux). **TODO** : créer une vraie image OG 1200×630.
- `WebSite` schema (home FR + EN) intègre un `SearchAction` (sitelinks
  search box éligible) ciblant `/boutique?q=…`.
- `LocalBusiness` schema enrichi : `slogan`, `keywords` (12 mots-clés
  génériques de la profession), `alternateName` étendu.
- Title / description optimisés sur home FR, home EN et boutique FR pour
  "liqueur artisanale bio", "digestif artisanal", "liquoriste artisanal".
- Bloc texte SEO ajouté en bas de `/boutique` pour porter les requêtes
  longue traîne.

Restent ouverts : migration vers `<Image>` Astro pour AVIF/srcset,
redirections 301 WP→Astro à pré-remplir avant bascule www., article pilier
"Qu'est-ce qu'une liqueur artisanale ?", création vraie image OG.

## Audit blog + SEO complet — 27 avril 2026 (soir)

5 rapports générés à la racine du repo :
- `blog-audit-report.md` (28 articles FR scorés sur 100, ~38 liens internes
  recommandés)
- `seo-technical-report.md`, `seo-content-report.md`, `seo-schema-report.md`,
  `seo-geo-report.md`

**Sprints exécutés dans le commit du 2026-04-27 soir :**

1. **Sprint A — conformité éditoriale** : 7 claims sourcing plantes
   corrigés dans 7 articles blog + `plants.ts`.
2. **Sprint A-bis — conformité hors blog** : 5 claims supplémentaires
   (plants.ts Serpolet, notre-histoire.astro alt, en/index.astro,
   boutique/index.astro, faq.astro + lumiere-obscure.astro YMYL THC,
   press.ts excerpt).
3. **Sprint Quick Wins** : `public/llms.txt` réécrit (2 violations
   corrigées + maj compteur articles), schema **Recipe ×5** ajouté à
   `nos-cocktails-signature` (Zod + template + frontmatter), fallback
   `og-default.jpg` (manquant) → `logo-complet-fond-blanc.webp` dans
   `[...slug].astro`, hreflang sitemap aligné sur codes courts.
4. **Sprint C — maillage interne** : ~38 liens internes ajoutés sur 16
   articles (sections "À lire aussi" + transformations mention → lien).
   9 dead-ends résolus, 6 orphans réactivés.

**Restent ouverts post-bascule** :
- ~~Plan 301 WP→Astro à pré-remplir dans `vercel.json`~~ ✅ **FAIT le
  2026-04-27** : 32 redirections 301 configurées (18 fiches produit
  `/shop/X` → `/boutique/X` avec mapping de slugs, 10 pages WP →
  équivalent Astro, 4 wildcards catch-all `/produit-categorie/*` etc.).
  Inertes tant que www. pointe sur WP. Activation = jour de la bascule
  DNS. Voir `docs/bascule-www.md` pour la liste exacte.
- ~~CSP `report-only` → `enforced`~~ ✅ **FAIT le 2026-04-27** : enforced
  sur le site public (avec `upgrade-insecure-requests`) + override
  permissif sur `/admin/*` pour Sveltia (unpkg + auth.sveltia.app +
  api.github.com). Validé après un paiement Stripe réussi.
- Schema Product enrichi : `gtin` (EAN-13) — **NON applicable**. Confirmé
  par Guillaume le 2026-04-27 : pas de code-barre EAN sur les bouteilles
  LBDP. Les numéros de lot existent (logiciel de facturation) mais ne sont
  pas un substitut au GTIN — Schema.org/gtin n'accepte que des EAN/UPC
  globaux. Sujet à rouvrir si LBDP fait imprimer des EAN un jour (ou si
  un distributeur exige le code-barre pour la grande distribution).
- Images alt cover article : actuellement = title, pourrait être enrichi
  via un champ `coverAlt` au schema Zod
- Pages thin content : `/composer-mon-coffret` (~3 phrases hors React),
  enrichir le body Astro à 150-200 mots

**`aggregateRating` (2026-04-27 soir)** : injecté dans le schema
`LocalBusiness/Organization` des deux homes (FR + EN) à partir des **vrais
avis Google** récupérés via Featurable au build. `ratingValue: 5`,
`reviewCount: 38` à ce jour. Brand-level uniquement — **PAS** sur le
Product schema (les avis ne sont pas split par SKU, attacher la note
brand sur chaque produit = inflation artificielle = pénalité Google).
Le helper partagé `src/lib/featurable.ts` mémoïse l'appel : 1 seul
fetch pour les 116 pages générées. Si l'API Featurable est down, la
propriété est simplement omise du schema (pas d'invention de valeurs).

## Sécurité — notes importantes

- **Headers de sécurité** configurés dans `vercel.json` (HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- **`X-Robots-Tag: noindex, nofollow`** sur `test.labrasseriedesplantes.fr`
  uniquement (le WP live et les futurs `www.` ne sont pas affectés)
- **Clé publique Stripe** (`pk_live_…`) exposée côté client : c'est normal,
  elle est publique par design
- **Clés REST API WC** : régénérées en avril 2026. Celles actuellement
  utilisées par `WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET` sur Vercel sont
  propres (n'ont pas transité par des conversations Claude).
- **Admin WP exposé** : `/wp-json/wp/v2/users` révèle le nom d'utilisateur
  admin. Corriger côté WP avec un plugin type "Stop User Enumeration"
  (indépendant de notre code)

## 🚨 La gamme Lumière Obscure (CBD) a été supprimée

**Décision de Guillaume, 21/09/2026 : plus de produits en stock, la gamme
sort du site.** Ne plus jamais parler de CBD, de chanvre, de THC ni de
Lumière Obscure — dans aucun support, aucune langue.

Supprimés : les 3 fiches produit, `/lumiere-obscure`, `/en/dark-light`,
l'article `cbd-et-plantes-lumiere-obscure` (FR + EN), la page CMS, les
visuels, la valeur `lumiere-obscure` du type `ProductRange` et de l'enum
Zod, les entrées de navigation, les catégories de FAQ, et la plante
« Chanvre (CBD) ».

**Trois plantes ont disparu avec la gamme** — elles n'entraient que dans
ces recettes : **Absinthe**, **Ortie**, **Chanvre**. `plants.ts` passe de
33 à 30 entrées.

**12 redirections 301** ajoutées dans `vercel.json` vers `/boutique`,
`/blog`, `/en/shop` et `/en/journal`. Les 3 redirections WordPress qui
visaient les fiches supprimées ont été recâblées sur `/boutique`.

**Commande de vérification :**
```bash
grep -rniE "\bcbd\b|chanvre|\bhemp\b|lumi(è|e)re.?obscure|dark-light|cannabis|\bthc\b" src/ public/*.txt public/admin/ | grep -v "#cbd5e1"
```
(`#cbd5e1` est une couleur hexadécimale dans `ui/award.tsx`, faux positif.)

Si la gamme revient un jour, tout est dans l'historique git au commit
qui précède cette suppression.

## Images manquantes — TODO

(Rien à signaler pour l'instant. Les 3 CBD ont leurs 20cl depuis avril 2026.)

## Backlog (ce qui reste à faire)

1. **Tester un paiement réel** de 1-2 € en conditions réelles, puis
   rembourser depuis l'admin WooCommerce. Vérifier que la commande tombe bien
   dans le WP admin comme une commande classique, que l'email part, que
   EasyBee reçoit.
2. ~~**Régénérer la clé REST API WC "Astro site"**~~ ✅ **FAIT (avril 2026)** —
   clé régénérée côté WooCommerce + injectée dans Vercel env vars
   (`WC_CONSUMER_KEY` + `WC_CONSUMER_SECRET` en Production + Preview).
3. **Préparer la bascule `www.`** : quand le moment est venu, ajouter
   `https://www.labrasseriedesplantes.fr` aux origines autorisées dans le
   plugin CORS, faire pointer `www.` sur Vercel, garder le WP accessible via
   un autre nom (ex. `wp.labrasseriedesplantes.fr`) pour les API.
4. ~~**Activer IndexNow**~~ ✅ **CÂBLÉ (avril 2026)** — script postbuild prêt.
   Reste à activer `INDEXNOW_ENABLED=true` dans Vercel **après bascule**
   (voir checklist `docs/bascule-www.md`).
5. ~~**Sync stock live**~~ ✅ **FAIT (avril 2026)** — `scripts/sync-wc-stock.mjs`
   au prebuild + `src/lib/wc-live.ts` helpers consommés par les templates.
6. ~~**Interface d'admin de contenu**~~ ✅ **PHASE 1 + 2 FAITES (avril 2026)** —
   Sveltia CMS à `/admin/` édite articles de blog (FR + EN) ET fiches
   produit. `products.ts` migré en Content Collection, sync auto avec
   WooCommerce pour détecter les nouveaux SKU (stubs `draft: true`).
   Édition des pages statiques (Notre histoire, etc.) non couverte —
   rarement modifiées, pas prioritaire.
