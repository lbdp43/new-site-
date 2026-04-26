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
- Hébergement : **Vercel** (auto-deploy depuis GitHub `main`)

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
| `src/content/products/*.md` | **Source de vérité éditoriale** des fiches produit (1 fichier par SKU). Éditable via Sveltia CMS. |
| `src/data/products.ts` | Thin wrapper — importe `products.generated.json` + définit types + ranges + helpers |
| `src/data/products.generated.json` | Généré au prebuild par `generate-products.mjs`. Ne pas éditer à la main. |
| `scripts/generate-products.mjs` | Script prebuild : compile les .md → JSON consommable sync |
| `scripts/sync-wc-stock.mjs` | Script prebuild : fetch stock WC + prix par contenance (variations) + auto-draft des nouveaux produits WC |
| `scripts/indexnow-submit.mjs` | Script postbuild : POST sitemap à IndexNow (Bing/Yandex) |
| `src/lib/wc-live.ts` | Helpers `getSchemaAvailability`, `isOutOfStock`, `getSizePrices`, etc. |
| `src/data/wc-live.json` | Snapshot stock + prix par contenance live (régénéré à chaque build, committé) |
| `public/admin/index.html` + `public/admin/config.yml` | Interface CMS (Sveltia) + config collections blog |
| `docs/cms-admin.md` | Guide utilisateur du CMS (auth GitHub, rédaction, SEO) |
| `astro.config.mjs` | Config Astro + filtre sitemap (exclut /panier, /commande, /admin) + priorités différenciées |
| `vercel.json` | Headers sécurité (HSTS, X-Frame, CSP-like) + noindex sur `test.*` |
| `wordpress-plugin/astro-cors/astro-cors.php` | Plugin WP pour autoriser CORS depuis Astro |

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

Le hero `/blog` utilise `BlogHeroIntro` (stagger flou → net) suivi d'un filtre
client-side par catégorie (Fabrication / Terroir / Actualité / Plantes /
Recettes). Pas de galerie 3D parallaxe (retirée), pas de bouton "Voir tous les
articles" (retiré). Ligne éditoriale : on ne cultive pas nos plantes nous-mêmes,
on travaille avec des cueilleurs et maraîchers partenaires, la plupart en bio —
toujours formuler en ce sens dans les articles (référence : `producteurs-partenaires-bio-velay.md`).

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
