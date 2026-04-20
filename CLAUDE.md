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
       { "key": "wcpay-payment-method", "value": "pm_xxx" },
       { "key": "wc-woocommerce_payments-new-payment-method", "value": "false" }
     ]
   }
   ```
5. WooPayments crée la commande côté WP, débite la carte, envoie les emails,
   notifie EasyBee. Redirection vers `/commande/confirmation?order=XXX&key=YYY`.

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

Le catalogue est dans `src/data/products.ts` — source de vérité **pour
l'affichage** (descriptions, photos, tastings, awards). WooCommerce reste la
source de vérité pour prix, stock, variations et commandes.

Chaque produit a un `wcId` (ID numérique WooCommerce). 18 / 19 sont mappés ;
`coffret-original` n'existe pas dans WooCommerce (bouton affiche "bientôt
disponible" tant que le produit n'est pas créé côté WP).

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

Checklist complète dans **`docs/bascule-www.md`**. Résumé :
pré-requis (tester paiement réel, régénérer clés API, backups), créer
`wp.labrasseriedesplantes.fr` comme nouveau nom technique du WordPress,
mettre à jour `PUBLIC_WC_BASE_URL` sur Vercel, basculer les DNS publics
(`www.` en CNAME vers Vercel), vérifier en post-bascule.

## Coffret DIY — 3 bouteilles au choix

Feature de différenciation : le visiteur compose son propre coffret cadeau en
choisissant 3 bouteilles parmi la gamme (exception : accessoires). Implémenté
depuis avril 2026.

- **UI** : `src/components/coffret/CoffretBuilder.tsx` (île React, client:load)
- **Pages** : `/composer-mon-coffret` (FR) et `/en/build-your-gift-box` (EN)
- **Teaser** sur la homepage (FR + EN) — section après le carousel produits
- **Intégration panier** : quand le visiteur valide, `cartActions.addItem` est
  appelé **3 fois**, une par bouteille, avec `cart_item_data` portant les flags
  `_coffret_diy: "3"`, `_coffret_position: "1/3"` et `_coffret_label`. Côté
  WordPress/WooCommerce, ces métadonnées apparaissent dans l'admin de commande
  (sous chaque ligne produit), signalant que les 3 bouteilles sont à emballer
  ensemble en coffret cadeau.
- **Pas de plugin WP nouveau requis** : la Store API native accepte
  `cart_item_data` et WC Blocks le préserve en BO. Stock, TVA, livraison,
  emails, WooPayments, EasyBee → fonctionnent comme d'habitude.
- **Contenances** : par défaut le composant choisit la plus petite contenance
  disponible du produit (`sizes[0]`). À ajuster si besoin dans
  `composer-mon-coffret.astro` (mapper `defaultSize` par produit).

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
| `src/data/products.ts` | Catalogue — source de vérité affichage |
| `scripts/sync-wc-stock.mjs` | Script prebuild : fetch stock WC, écrit `wc-live.json` |
| `src/lib/wc-live.ts` | Helpers `getSchemaAvailability`, `isOutOfStock`, etc. |
| `src/data/wc-live.json` | Snapshot stock live (régénéré à chaque build, committé) |
| `astro.config.mjs` | Config Astro + filtre sitemap (exclut /panier, /commande) + priorités différenciées |
| `vercel.json` | Headers sécurité (HSTS, X-Frame, CSP-like) + noindex sur `test.*` |
| `wordpress-plugin/astro-cors/astro-cors.php` | Plugin WP pour autoriser CORS depuis Astro |

## Gotchas

- **Hydratation entre îles** : plusieurs îles React doivent partager l'état
  panier. Astro ne partage pas le Context React entre îles séparées — on
  utilise donc un **store niveau module** + `useSyncExternalStore` dans
  `cart-store.tsx`. Ne pas remplacer par un Context React.
- **Stock live au build** : `scripts/sync-wc-stock.mjs` s'exécute au
  `prebuild` et lit `/wp-json/wc/v3/products` avec `WC_CONSUMER_KEY` +
  `WC_CONSUMER_SECRET`. Le résultat va dans `src/data/wc-live.json`
  (committé). Les helpers de `src/lib/wc-live.ts` le consomment pour
  injecter le vrai `availability` dans le schema Product + badges UI
  "Rupture temporaire" / "Sur commande". Sans clés (dev local), le
  script préserve le fichier existant et sort en code 0 — le build ne
  plante jamais. Les clés `WC_CONSUMER_*` sont maintenant obligatoires
  côté **Vercel** (Production + Preview) pour un sync réel.
- **Fiche produit `coffret-original`** : pas de `wcId`. Ajouter quand le
  produit sera créé côté WP.
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
- **Les clés REST API WC "Astro site"** (`ck_…` / `cs_…`) créées pour du
  debug sont à **régénérer** (elles ont transité dans une conversation Claude)
  → WP Admin → WooCommerce → Réglages → Avancé → API REST → supprimer / recréer
- **Admin WP exposé** : `/wp-json/wp/v2/users` révèle le nom d'utilisateur
  admin. Corriger côté WP avec un plugin type "Stop User Enumeration"
  (indépendant de notre code)

## Backlog (ce qui reste à faire)

1. **Tester un paiement réel** de 1-2 € en conditions réelles, puis
   rembourser depuis l'admin WooCommerce. Vérifier que la commande tombe bien
   dans le WP admin comme une commande classique, que l'email part, que
   EasyBee reçoit.
2. **Régénérer la clé REST API WC "Astro site"** une fois les tests finis.
3. **Préparer la bascule `www.`** : quand le moment est venu, ajouter
   `https://www.labrasseriedesplantes.fr` aux origines autorisées dans le
   plugin CORS, faire pointer `www.` sur Vercel, garder le WP accessible via
   un autre nom (ex. `wp.labrasseriedesplantes.fr`) pour les API.
4. **Activer IndexNow** une fois en live : le fichier
   `public/e3e81d795b356f57b451d271fc89a108.txt` est déjà là. Il reste à
   envoyer un POST à IndexNow à chaque rebuild (hook Vercel `build` ou
   action GitHub).
5. ~~**Sync stock live**~~ ✅ **FAIT (avril 2026)** — `scripts/sync-wc-stock.mjs`
   au prebuild + `src/lib/wc-live.ts` helpers consommés par les templates.
6. **Interface d'admin de contenu** (optionnel) : mini-CMS pour que l'équipe
   puisse éditer les textes de `products.ts` sans passer par le code. Pas
   urgent, à discuter quand le site sera en live.
