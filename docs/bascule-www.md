# Bascule `www.labrasseriedesplantes.fr` : du WordPress au site Astro

Ce document liste les étapes à suivre quand tu veux faire passer `www.` sur le
nouveau site Astro (aujourd'hui sur `test.labrasseriedesplantes.fr`).

**Objectif** : le visiteur qui tape `www.labrasseriedesplantes.fr` arrive sur le
site Astro (Vercel) ; le WordPress continue de tourner en arrière-plan pour
gérer commandes/paiements/stock/emails mais n'est plus accessible publiquement
via `www.`.

---

## 🏷 Adresse officielle : `www.` (tranché le 21/09/2026)

Guillaume a arbitré : l'adresse canonique du site est
**`https://www.labrasseriedesplantes.fr`** — c'est celle qui est imprimée sur
les étiquettes et les cartes, et celle que le WordPress sert déjà.

✅ **Déjà appliqué dans le code** (commit du 21/09/2026) : `site.url`
(`src/data/site.ts`), `site` (`astro.config.mjs`), `public/robots.txt`,
`public/llms.txt`, `public/llms-full.txt` et `scripts/generate-llms-full.mjs`
émettent tous des URL en `www.`. Canonical, hreflang, Open Graph, schema.org
et le sitemap suivent automatiquement.

⚠️ Conséquence à ne pas oublier à l'étape 4 : **l'apex doit rediriger vers
`www.`**, jamais l'inverse. Si les deux répondent en 200, Google voit deux
sites identiques et le référencement se dilue.

ℹ️ Le CSP de `vercel.json` autorise déjà `https://*.labrasseriedesplantes.fr`
en `connect-src` : le passage de l'API WooCommerce sur `wp.` ne demandera
aucune retouche.

---

## 🚧 L'Actualité reste masquée à la bascule

Décision Guillaume, 21/09/2026 : **la section Actualité ne s'ouvre PAS le jour
de la bascule.** Les 33 articles doivent d'abord être relus un par un.

Concrètement : `noindex` conservé, section absente du menu, articles hors
sitemap — exactement l'état actuel. Rien à faire le jour J, c'est un
non-changement volontaire.

Ne pas confondre avec un oubli : si une future session voit le blog en
`noindex` et veut « corriger », la réponse est non tant que la revue n'est
pas terminée. État d'avancement : `blog-revue-2026-09-21.md`.

Les trois leviers à lever ensemble le jour de la réouverture sont listés
dans la section « Actualité temporairement retirée » de `CLAUDE.md`.

---

## 🔒 Hébergement : Vercel, en plan Pro ✅

Décision Guillaume, 21/09/2026 : après avoir comparé Cloudflare Pages, Railway
et l'hébergement IONOS, **le site reste sur Vercel**. Pas de zone DNS à
déplacer, pas de risque sur les emails, pas de configuration à retraduire :
le plan de bascule ci-dessous s'applique tel quel.

✅ **Le compte est passé en plan Pro le 21/09/2026.** C'était le point
bloquant : le plan gratuit réserve l'usage à un cadre personnel et non
commercial et interdit le traitement de paiement, avec désactivation possible
sans préavis. Le sujet est réglé — `www.` peut encaisser des cartes.

⚠️ Ne pas redescendre en Hobby tant que la boutique est en ligne.

ℹ️ Le travail de migration Cloudflare reste committé comme plan de repli
(`docs/cloudflare-pages.md`). `public/_redirects` et `public/_headers` sont
générés à chaque build et ignorés par Vercel : ils ne gênent rien et
permettraient de basculer en quelques heures.

---

## ☝️ Avant de commencer — pré-requis à valider

- [x] ✅ **Compte Vercel passé en plan Pro** — fait le 21/09/2026. Le plan
      Hobby interdisait l'usage commercial et l'encaissement de paiements ;
      un projet en infraction pouvait être désactivé sans préavis.
- [ ] **Testé un vrai paiement en conditions réelles** (commande de 1-2 €
      depuis test.labrasseriedesplantes.fr, puis rembourser depuis l'admin WC).
      Vérifier : commande visible dans WP admin, email client reçu, EasyBee
      notifié, facture générée.
- [ ] **Testé le Coffret DIY** en commande réelle — vérifier que les 3 lignes
      apparaissent dans l'admin WC avec la metadata `_coffret_diy`.
- [x] ✅ **Clés API WC présentes sur Vercel** — `WC_CONSUMER_KEY` et
      `WC_CONSUMER_SECRET` vérifiées le 21/09/2026 via l'API, posées sur
      Production ET Preview. La synchronisation du stock tourne donc pour de
      vrai ; elle ne se rabat pas en silence sur le `wc-live.json` committé.
      (Les 3 variables `PUBLIC_*` sont également en place sur les trois
      environnements, et `INDEXNOW_ENABLED` est bien absente.)
- [x] ✅ **Plan de redirections 301 vérifié contre le WordPress réel** —
      les 5 sitemaps relevés le 21/09/2026. 32 URL réellement publiées,
      toutes couvertes (1 trou trouvé et corrigé : `/shop/lessence-des-cimes/`).
      Le WordPress n'a **aucun article de blog**, aucune catégorie, aucune
      étiquette. Contrôlé à chaque build.
- [ ] 🔴 **Vérifier que WP Fastest Cache ne met pas en cache `/wp-json/`**

      Deux plugins de cache tournaient en parallèle (IONOS Performance et WP
      Fastest Cache). **Guillaume a désactivé IONOS Performance le
      21/09/2026** — il en reste un.

      Le danger, s'il met en cache les réponses de la Store API : **deux
      clients différents reçoivent le même panier**. Le second voit les
      articles du premier, et une commande peut partir avec le mauvais
      contenu. Rien ne le signale — tout a l'air de fonctionner.

      **Le contrôle** (2 minutes) : ouvrir
      `https://www.labrasseriedesplantes.fr/wp-json/wc/store/v1/cart` en
      navigation privée, puis l'inspecteur → onglet Réseau → en-têtes de
      réponse. Aucun `x-cache: HIT`, `age:`, `x-wp-fastest-cache` ni
      équivalent ne doit apparaître. Recharger deux fois : le contenu doit
      pouvoir différer.

      **Le réglage** : WP Fastest Cache → onglet *Exclure* → ajouter une
      règle sur l'URL commençant par `/wp-json/`. Par défaut le plugin ne
      met en cache que les pages HTML pour les visiteurs déconnectés, donc
      il y a de bonnes chances que ce soit déjà propre — mais c'est à
      vérifier, pas à supposer.

      ⚠️ **Attention au cache de l'hébergeur** : « IONOS Performance » est
      aussi un service côté serveur. Désactiver le plugin ne coupe pas
      forcément le cache appliqué par IONOS en amont. Si le contrôle
      ci-dessus montre encore un `age:` ou un `x-cache`, regarder du côté du
      panneau IONOS, pas seulement des plugins WordPress.

      À décider après la bascule : le WordPress ne servira plus aucune page
      publique. Un cache HTML n'aura quasiment plus d'objet — autant s'en
      débarrasser pour simplifier.
- [ ] **Backups WordPress** à jour (complet BDD + fichiers). **WPvivid
      Backup est déjà installé** sur le WP (vu le 21/09/2026) — il suffit de
      lancer une sauvegarde complète et de vérifier qu'elle part bien vers un
      stockage externe (Drive / Dropbox), pas seulement sur le serveur.
- [ ] 🔴 **PayPal sur le checkout Astro** — **BLOQUANT**.

      Guillaume, 22/09/2026 : « les clients utilisent PayPal souvent ». La
      question est tranchée : on ne bascule pas en supprimant un moyen de
      paiement réellement utilisé.

      Aujourd'hui WooCommerce propose carte **et** PayPal ; le checkout Astro
      ne propose que la carte. Sans ce chantier, la bascule ferait perdre des
      commandes — silencieusement, sans la moindre erreur à l'écran.

      Cadrage complet, état d'avancement et informations à relever :
      **`docs/paypal-checkout.md`**.
- [ ] 🔴 **Inspecter les champs personnalisés du checkout WooCommerce** —
      l'extension **Checkout Field Editor for WooCommerce** est active sur le
      WP (relevé le 22/09/2026). Elle permet d'ajouter, modifier ou rendre
      obligatoires des champs sur la page de commande.

      Si des champs **obligatoires** ont été ajoutés, le checkout Astro ne les
      envoie pas — la commande peut être refusée par WooCommerce, ou partir
      sans une information dont l'équipe a besoin pour préparer le colis.

      À vérifier dans WooCommerce → Checkout Form → liste des champs, et à
      reporter dans `CheckoutPage.tsx` si nécessaire.
- [ ] **Produit `coffret-original` créé côté Woo** (actuellement manquant, le
      bouton affiche "bientôt disponible").
- [ ] **Site soumis à Google Search Console + Bing Webmaster Tools** avec le
      sitemap `sitemap-index.xml`.
- [ ] **Preview Astro validé** sur mobile + desktop par au moins 2 personnes.
- [ ] **TTFB / Core Web Vitals OK** sur test. (LCP < 2.5s, INP < 200ms, CLS <
      0.1).
- [ ] **Listes d'ingrédients relues sur les étiquettes physiques** — 11 des
      16 mentions `ingredients` ont été dérivées de la composition, pas
      recopiées d'une étiquette (toutes sauf Herbe des Druides, Lime des
      Prés, Nectar d'Ostara, Flèche Ardente et Gorgeon, qui viennent du
      WordPress). Mention réglementaire : à valider avant d'être publique
      sur `www.`. Voir la section « Listes d'ingrédients » de `CLAUDE.md`.
- [ ] **Question des colorants tranchée** et les deux FAQ alignées : la FAQ
      FR dit « pas de colorant », la FAQ EN cite le charbon végétal du
      Gorgeon et la cochenille de la Pralicoquine.

---

## 🔄 Plan de bascule en 4 étapes

### Étape 1 — Préparer le nouveau domaine technique pour WordPress

Le WP continue d'exister, mais doit être accessible sur un autre nom DNS pour
que l'Astro puisse lui parler. On choisit `wp.labrasseriedesplantes.fr`.

1. Chez ton registrar, créer un sous-domaine `wp.labrasseriedesplantes.fr`
   pointant vers l'IP de ton hébergeur WordPress actuel (celle qui héberge
   `www.` aujourd'hui).
2. Dans l'admin WordPress → Réglages → Général :
   - Adresse web WordPress (URL) : `https://wp.labrasseriedesplantes.fr`
   - Adresse web du site (URL) : `https://wp.labrasseriedesplantes.fr`
3. Régénérer le certificat HTTPS pour `wp.` (Let's Encrypt via hébergeur).
4. Tester que `https://wp.labrasseriedesplantes.fr/wp-admin` fonctionne et que
   tu peux te connecter.
5. Tester que `https://wp.labrasseriedesplantes.fr/wp-json/wc/store/v1/cart`
   renvoie du JSON (pas une erreur CORS).

### Étape 2 — Mettre à jour l'Astro pour pointer vers le nouveau WP

Dans Vercel → Settings → Environment Variables, modifier la variable :

```
PUBLIC_WC_BASE_URL = https://wp.labrasseriedesplantes.fr
```

Déclencher un rebuild Vercel (commit vide ou bouton "Redeploy").

Tester sur `test.labrasseriedesplantes.fr` :
- [ ] Ajouter au panier fonctionne
- [ ] Checkout fonctionne
- [ ] Commande visible dans WP admin

### Étape 3 — Mettre à jour le plugin CORS WordPress

✅ **Peut être fait DÈS MAINTENANT, sans attendre le jour J.** La version
**1.2.0** du plugin (dans le dépôt) contient déjà `www.` et l'apex. Autoriser
une origine qui n'existe pas encore n'a **aucun effet** : le navigateur
n'envoie un en-tête `Origin` que depuis le domaine réellement servi.

L'installer à l'avance retire une étape du jour J — et surtout, évite le
scénario où le panier casse sur `www.` parce que le plugin n'a pas été
téléversé dans le feu de l'action. Zippe `wordpress-plugin/astro-cors/`,
téléverse, remplace, réactive.

Dans `wordpress-plugin/astro-cors/astro-cors.php`, la fonction
`lbdp_astro_allowed_origins()` doit autoriser :

```php
function lbdp_astro_allowed_origins() {
  return [
    'https://www.labrasseriedesplantes.fr',      // ← à ajouter
    'https://labrasseriedesplantes.fr',          // ← à ajouter (sans www)
    'https://test.labrasseriedesplantes.fr',
    'http://localhost:4321',
    'http://127.0.0.1:4321',
  ];
}
```

Réuploader le plugin (ou SSH) sur le WordPress.

### Étape 4 — Basculer les DNS publics vers Vercel

1. Chez ton registrar DNS :
   - Supprimer l'enregistrement `A` de `www.labrasseriedesplantes.fr` qui
     pointait vers l'IP du WordPress.
   - Ajouter un `CNAME` : `www.labrasseriedesplantes.fr` →
     `cname.vercel-dns.com.`
   - Ajouter ou mettre à jour l'apex : `labrasseriedesplantes.fr` (ANAME ou
     A record) → `76.76.21.21` (IP d'apex Vercel).
2. Dans Vercel → Project → Settings → Domains :
   - Ajouter `www.labrasseriedesplantes.fr`
   - Ajouter `labrasseriedesplantes.fr` (avec redirection vers `www.`)
3. Vercel va automatiquement générer un certificat HTTPS (Let's Encrypt).
   Attendre 5-10 minutes que ce soit actif.

### Étape 5 — Validation post-bascule (dans l'heure)

- [ ] `https://www.labrasseriedesplantes.fr/` → Astro homepage ✓
- [ ] `https://labrasseriedesplantes.fr/` → redirige vers `www.` ✓
- [ ] `https://www.labrasseriedesplantes.fr/boutique/alchimie-vegetale` → page
      produit Astro ✓
- [ ] Ajouter au panier → checkout → commande réelle → apparaît dans WP admin ✓
- [ ] Sitemap `https://www.labrasseriedesplantes.fr/sitemap-index.xml`
      accessible ✓
- [ ] TTFB mesuré < 300 ms (vs ~1000 ms sur l'ancien WP direct) ✓

---

## ⏭ À faire APRÈS la bascule (checklist post-J)

Cette liste est alimentée au fil des sessions. À chaque fois qu'une décision
ou une intégration est marquée "à faire après la bascule", elle finit ici.
L'ordre n'est pas critique, mais plus c'est fait vite mieux c'est pour le
SEO et pour éviter les oublis.

### Dans les 24h après bascule

- [ ] **Google Analytics — marquer les événements clés** ⚠️ *non rétroactif*

  Le code envoie déjà `view_item`, `add_to_cart`, `begin_checkout` et
  `purchase` (avec montant, devise et lignes depuis le 21/09/2026). Mais
  GA4 ne compte une conversion qu'**à partir du moment où on coche** :
  tout ce qui arrive avant reste en donnée brute et n'apparaîtra jamais
  dans les rapports de conversion. À faire dans les jours qui suivent la
  mise en ligne, pas dans six mois.

  1. [analytics.google.com](https://analytics.google.com) → propriété
     **G-DK89M6D81H**.
  2. **Admin** (roue dentée, en bas à gauche) → **Événements clés**
     (libellé *Conversions* dans les versions plus anciennes).
  3. Activer l'interrupteur sur **`purchase`**, puis sur `add_to_cart`
     et `begin_checkout` pour avoir l'entonnoir complet.
  4. Si `purchase` n'est pas dans la liste : c'est que l'événement n'est
     jamais arrivé. GA4 n'affiche que ce qu'il a déjà reçu. Passer une
     commande réelle, ou utiliser **Créer un événement clé** et saisir
     `purchase` à la main.

- [ ] **Google Analytics — vérifier que le montant remonte**

  Passer une commande de 1-2 € puis la rembourser depuis l'admin
  WooCommerce (test de toute façon au programme, voir les pré-requis).
  Dans GA4 : **Rapports → Temps réel**, l'événement `purchase` doit
  apparaître **avec sa valeur**. Avant la correction du 21/09/2026 il
  arrivait sans montant et GA4 affichait 0 € de chiffre d'affaires.

- [ ] **Google Analytics — flux de données sur le bon domaine**

  **Admin → Flux de données** : vérifier que l'URL déclarée correspond à
  l'hôte réellement servi (voir la question apex / `www.` dans
  `audit-pre-bascule-2026-09-21.md`). Un flux pointant sur l'ancien
  domaine continue de collecter, mais les rapports d'acquisition et les
  liens vers les pages deviennent faux.

- [ ] **Google Analytics — relier Search Console**

  **Admin → Associations de produits → Search Console**. Sans ça, les
  requêtes de recherche n'apparaissent pas dans GA4 et il faut jongler
  entre deux interfaces.

  > Rappel : les statistiques ne se déclenchent que si le visiteur
  > accepte dans le portail d'âge (case décochée par défaut, conforme
  > CNIL). Les chiffres seront donc structurellement inférieurs au trafic
  > réel — c'est normal et commun à tous les sites français conformes.

- [ ] **Google Search Console — Sitemaps**
  1. Ouvrir la propriété domaine `labrasseriedesplantes.fr` dans GSC.
  2. Section *Sitemaps* → supprimer l'ancien `sitemap_index.xml` (format
     SEOPress WordPress, plus valide).
  3. Ajouter le nouveau : `sitemap-index.xml` (⚠️ **tiret**, pas underscore —
     c'est le format que génère Astro automatiquement).
  4. Vérifier l'état `Opération effectuée` + attendre 24-48h que Google
     crawle les ~100 URLs listées.

- [ ] **Bing Webmaster Tools — Sitemaps**
  Idem que GSC mais côté Bing. Soumettre `sitemap-index.xml`. Si pas encore
  inscrit → créer un compte sur [bing.com/webmasters](https://www.bing.com/webmasters)
  et vérifier la propriété via DNS TXT ou fichier HTML.

- [ ] **⚠️ CRITIQUE — Mettre à jour `site.url` dans tout le code**
  Aujourd'hui `site.url = "https://labrasseriedesplantes.fr"` (sans `www.`).
  **Tous les `@id`, canonicals, hreflang, URLs absolues Schema.org** en
  dépendent — si `www.` devient le canonique sans mise à jour, tous les
  signaux pointent vers la mauvaise variante pendant quelques jours.

  **Fichiers à toucher en même temps que la bascule DNS** :
  1. `src/data/site.ts` → `url: "https://www.labrasseriedesplantes.fr"`
  2. `astro.config.mjs` → `site: 'https://www.labrasseriedesplantes.fr'`
  3. `public/robots.txt` → `Sitemap: https://www.labrasseriedesplantes.fr/sitemap-index.xml`
  4. `public/llms.txt` et `public/llms-full.txt` (auto-régénéré au build)
     → vérifier que les URLs internes sont bien sur `www.`
  5. Script `scripts/indexnow-submit.mjs` → lit `process.env.PUBLIC_SITE_URL`
     ou la config — vérifier qu'il cible `www.`

  Commit + push : Vercel redéploie en ~2 min, le sitemap et tous les
  schemas se mettent à jour automatiquement.

- [ ] **Activer IndexNow**
  IndexNow = protocole Bing/Yandex pour l'indexation quasi-instantanée.
  Le fichier clé est déjà présent à `public/e3e81d795b356f57b451d271fc89a108.txt`.
  Un script `scripts/indexnow-submit.mjs` est déjà câblé au `postbuild` mais
  conditionné par une variable d'env — il est en dry-run tant que `www.`
  n'est pas sur Astro.

  **Action** : dans Vercel → Settings → Environment Variables :
  ```
  INDEXNOW_ENABLED = true
  ```
  Ajouter en **Production uniquement** (pas Preview, pas Development —
  sinon chaque PR re-submit 100 URLs à Bing pour rien).
  Déclencher un rebuild (`Redeploy`). Dans les logs Vercel, tu dois voir
  `[indexnow] ✓ X URLs soumises (HTTP 202)`.

- [ ] **Vérifier Featurable (avis Google live)**
  Ouvrir la homepage `www.`, scroller jusqu'à la section "Ce que disent nos
  clients". Les vrais avis Google doivent apparaître (pas les reviews
  internes). Si tu vois encore "Avis clients vérifiés" au lieu de "Avis
  Google en direct", c'est que Featurable n'a pas répondu au build ou que
  le widget n'est pas public sur featurable.com.

- [ ] **Tester le checkout réel** en conditions de production (1-2 €
      puis remboursement depuis WC admin). Si ça casse, voir § rollback.

### Dans la semaine qui suit

- [ ] **DMARC + emails transactionnels WC**
  Depuis que le `www.` est sur Astro, les emails de commande partent toujours
  via le WordPress (SMTP config WP). Vérifier qu'ils arrivent bien en boîte
  de réception (pas en spam) — particulièrement si le SPF WP cite encore
  `www.labrasseriedesplantes.fr` qui n'existe plus comme serveur SMTP.
  Si soucis : ajuster le SPF dans OVH/IONOS.

- [ ] **Google Business Profile — URL du site**
  Sur [business.google.com](https://business.google.com), ouvrir la fiche
  de Saint-Didier-en-Velay. Vérifier que l'URL pointe bien sur
  `https://www.labrasseriedesplantes.fr` (elle devrait déjà, mais autant
  s'assurer qu'il n'y a pas de redirect bizarre).

- [ ] **Schema.org — validation post-bascule**
  Passer `https://www.labrasseriedesplantes.fr` dans :
  - [Schema Markup Validator](https://validator.schema.org/) — doit valider
    `LocalBusiness`, `Product` sur les fiches, `BlogPosting` sur les articles,
    `Event` sur `/ateliers` (avec `startDate` + `eventStatus` déjà présents
    depuis l'audit SEO avril 2026).
  - [Rich Results Test](https://search.google.com/test/rich-results) —
    doit détecter au moins : Product, LocalBusiness, Breadcrumb, FAQ (sur
    `/faq`), Recipe (sur les cocktails), Event (sur `/ateliers`).

- [ ] **Repasser la CSP en mode enforce**
  Après l'audit SEO avril 2026, une CSP a été ajoutée dans `vercel.json`
  mais elle bloquait plusieurs domaines Stripe (`m.stripe.com`,
  `r.stripe.com`, `m.stripe.network`…) nécessaires au Payment Element
  → "Failed to fetch" au checkout. La CSP a été passée en
  **`Content-Security-Policy-Report-Only`** avec wildcards élargis
  (`*.stripe.com`, `*.stripe.network`, `*.labrasseriedesplantes.fr`) —
  elle observe sans bloquer.

  **Après la bascule** : valider un checkout réel avec 1-2 € en
  production puis repasser le header en `Content-Security-Policy`
  (enforce) si aucune requête critique n'a été signalée comme bloquée
  dans les DevTools console pendant le test. En cas de doute, garder
  en Report-Only — la sécurité dégradée est minime (HSTS + X-Frame +
  Permissions-Policy restent en place).

- [ ] **Régénérer les clés REST API WC "Astro site"**
  WP Admin → WooCommerce → Réglages → Avancé → API REST → supprimer
  les anciennes (qui ont transité par les conversations Claude). Créer une
  nouvelle clé "Astro Production" avec rôle **Lecture seule** (le script
  `sync-wc-stock.mjs` n'a besoin que de lire). Mettre à jour sur Vercel →
  Environment Variables (`WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`).

- [ ] **Monitoring 404s**
  Dans GSC → section *Indexation* → *Pages* → filtrer sur `404`. Les vieilles
  URLs WP qui ne matchent plus le slug Astro doivent être redirigées via
  `vercel.json` (section `redirects`). Ex : `/produit/alchimie-vegetale/`
  → `/boutique/alchimie-vegetale`. En général 10-20 URLs à rediriger en
  masse.

  **⚠️ Plan 301 préchargé (2026-04-27)** : 32 redirections déjà
  configurées dans `vercel.json` à partir de l'inventaire des sitemaps
  WP (`/sitemap_index.xml` extrait le 2026-04-27). Couvre les 18 fiches
  produit `/shop/X` → `/boutique/X` (avec mapping de slugs : `cerfgent`
  → `cerf-gent`, `lalchimie-vegetale` → `alchimie-vegetale`, etc.), les
  10 pages WP indexées (`/cart/` → `/panier/`, `/checkout/` → `/commande/`,
  `/nos-cocktails/` → `/cocktails/`, `/nous-contacter/` → `/contact/`,
  `/conditions-generales-de-vente/` → `/cgv/`, `/my-account/` → `/`),
  + 4 wildcards catch-all (`/produit-categorie/*`, `/product-category/*`,
  `/etiquette-produit/*`, `/product-tag/*`) qui redirigent vers `/boutique`.

  **Inertes tant que `www.` pointe sur WP** — Vercel ne reçoit aucune
  requête sur ces paths. Activation = jour de la bascule DNS. Après
  bascule, faire `curl -I https://www.labrasseriedesplantes.fr/shop/cerfgent/`
  et vérifier `HTTP/2 308` (Vercel utilise 308 = équivalent SEO 301)
  + `location: /boutique/cerf-gent`.

### Dans le mois qui suit

- [ ] **Pas de chute de trafic anormale**
  Normal : -10 à -15% de turbulence les 2 premières semaines, récupération
  dans le mois. Au-delà de -25% au jour 30, il y a un souci SEO structurel
  (mauvais canonicals, mauvais hreflang, mauvais robots.txt) à auditer.

- [ ] **Hreflang FR/EN validé**
  Ouvrir [merkle.com/hreflang](https://technicalseo.com/tools/hreflang/)
  ou un outil équivalent, tester quelques paires (ex: `/notre-histoire` vs
  `/en/our-story`). Les deux doivent se référencer mutuellement avec le bon
  code langue.

- [ ] **Core Web Vitals en champ (CrUX)**
  Une fois que Google a collecté assez de données (~28 jours), vérifier sur
  [pagespeed.web.dev](https://pagespeed.web.dev) que les CWV sont au vert :
  LCP < 2.5s, INP < 200ms, CLS < 0.1. Sur mobile principalement.

- [ ] **Supprimer la règle noindex du test.**
  Une fois que `www.` est stable et indexé proprement, on peut garder
  `test.` comme environnement de préprod (toujours en noindex) ou le
  supprimer. À décider selon l'usage.

- [ ] **Annuaires tourisme (Haute-Loire)** — ajout dans ~10 annuaires locaux
      pour renforcer les signaux NAP et le SEO local (voir note "tourisme"
      dans le backlog).

### Issues SEO reportées de l'audit avril 2026 — à vérifier après bascule

Ces items sont **conditionnés à la bascule** : on ne peut pas les faire ou les
mesurer sur `test.*`. Référence : `seo-audit-2026-04-22/ACTION-PLAN.md`.

- [ ] **CrUX field data — revalider LCP sur le domaine live**
  L'audit lab indiquait LCP home 7,3 s (mobile). Les fixes appliqués
  (preload du poster vidéo hero + `preload="none"` sur les vidéos hors
  écran + inline CSS auto < 4 KB) devraient amener le LCP sous 2,5 s —
  à confirmer avec le CrUX réel 28 jours après la bascule via
  [PageSpeed Insights](https://pagespeed.web.dev) sur quelques URLs clés
  (home, fiche produit Alchimie, article plantes-liqueur-haute-loire).
  Si LCP > 3 s persiste : passer les `<img>` critiques sur `<Image>`
  Astro avec `widths={[320, 640, 960]}` pour srcsets responsives
  (gain estimé −200 à −400 KB sur fiche produit + blog).

- [ ] **YouTube dans `sameAs` schemas**
  Le `sameAs` de `localBusinessSchema` ne liste que Instagram + Facebook.
  Corrélation citation IA la plus forte (~0,74) pour les marques avec
  présence YouTube. Décider :
  - Option A : créer un canal YouTube LBDP minimal (2-3 vidéos : duo
    making-of, visite atelier, présentation de L'Alchimie Végétale),
    uploader les vidéos déjà produites, déclarer le canal dans
    `src/data/site.ts` → `site.social.youtube` + l'ajouter dans les
    `sameAs` de `src/pages/index.astro` et `src/pages/en/index.astro`.
  - Option B : attendre d'avoir des vidéos "éditorialisées" avant de
    créer le canal.

- [ ] **Fiche Wikidata**
  Démarche externe, ~2 h. Critères éligibilité OK (presse nationale
  France 3 + France Bleu + Le Bonbon + prix international World Drinks
  Awards 2025). Un Q-number ancre la marque comme entité nommée dans
  tous les LLMs entraînés sur Wikidata — signal très fort pour GEO.
  Champs minimum : nom, type (entreprise artisanale liquoriste),
  fondation (2021), fondateurs (Étienne + Guillaume), siège
  (Saint-Didier-en-Velay), distinction (World's Best Digestive 2025).

- [ ] **Auteurs : noms de famille complets ou `sameAs`**
  Aujourd'hui les schemas Person (`src/pages/notre-histoire.astro` +
  `src/pages/blog/[...slug].astro`) déclarent les fondateurs par prénom
  uniquement (Étienne, Guillaume). Pour ancrer l'entité Author dans le
  Knowledge Graph : soit ajouter le nom de famille dans `name`, soit
  ajouter un `sameAs` vers le profil LinkedIn ou Instagram perso.

- [ ] **Envisager `<Image>` Astro pour la galerie produit**
  Gain −386 KB sur fiche Alchimie Végétale mobile, −193 KB sur article
  blog, −94 KB logo header. Refactor non-trivial (test visuel obligatoire
  sur toutes les pages) — à caler après la bascule une fois que le
  trafic réel dicte les priorités.

- [ ] **Mesurer la progression du score SEO**
  Relancer la skill `seo-audit` sur `https://www.labrasseriedesplantes.fr`
  une fois stabilisée. Score actuel staging : 74/100. Cible post-bascule
  après application des fixes SEO + optim performance : > 85/100.

### Stratégique — SEO & visibilité long terme

Ces chantiers ne sont pas urgents mais rapportent gros sur 3-6 mois. À caler
quand le site est stabilisé et les urgences techniques réglées.

- [ ] **Link building presse** — relance des 13 médias qui nous ont déjà
      couverts (liste complète dans `src/data/press.ts`) : Zoomdici, Le Bonbon
      Lyon, M Lyon, La Commère 43, France 3 ARA, France Bleu, Réussir, Likora,
      M Lyon, etc. Objectif : une nouvelle mention / article par trimestre
      (nouvelle distinction, lancement produit, saison). Plus d'articles
      = plus de backlinks = meilleure autorité domaine.

- [ ] **Annuaires spiritueux spécialisés** — inscription gratuite sur les
      annuaires métier : [Spiritueux-France](https://spiritueux-france.fr),
      [Distillerie.org](https://distillerie.org), [La Revue du Spiritueux](https://revuedespiritueux.fr),
      [Tastings.com](https://tastings.com), [Distiller.com](https://distiller.com).
      Fournit des backlinks thématiques de qualité. ~30 min par annuaire,
      à étaler sur 2-3 semaines.

- [ ] **Nouvel audit SEO complet post-bascule**
      Relancer un audit complet via la skill `seo-audit` sur
      `https://www.labrasseriedesplantes.fr` (une fois indexé par Google).
      Score cible : > 92/100. Vérifier que tous les fixes pré-bascule sont
      bien appliqués en prod (H1 uniques, PNG→WebP, vidéo pro compressée,
      titles/meta raccourcis).

- [ ] **Schema.org — validation Rich Results**
      Une fois sur `www.`, passer les URLs clés dans
      [Rich Results Test](https://search.google.com/test/rich-results) pour
      détection effective : Product (fiches boutique), LocalBusiness (home),
      Recipe (cocktails), Event (ateliers), FAQPage (pros + faq). Tous
      doivent apparaître comme "éligibles aux rich snippets" dans Google.

- [ ] **CWV field data (CrUX) via Google API**
      Une fois 28 jours de trafic accumulés en `www.`, configurer l'API CrUX
      (voir skill `seo-google`) pour suivre les Core Web Vitals réels
      (LCP/INP/CLS) par page. Permet de prioriser les optimisations
      d'images / JS selon ce que vivent vraiment les utilisateurs.

- [ ] **Google Business Profile — activité régulière**
      Sur [business.google.com](https://business.google.com), poster 1 photo
      + 1 post par semaine (Google pénalise les fiches dormantes). Inciter
      les visiteurs de la boutique à laisser un avis via QR code en caisse.
      Objectif : dépasser les 50 avis Google en 6 mois (signal fort pour
      le Local Pack).

- [ ] **Contenu saisonnier / blog cadence**
      Publier 1 article de blog par mois (déjà câblé via le CMS Sveltia).
      Thèmes qui convertissent : recettes cocktail saisonnières, portraits
      de plantes, backstage atelier, recettes cuisine aux liqueurs. Chaque
      article = nouvelle surface pour captrer du longue-traîne.

- [ ] **Email automatique demande d'avis après commande**
      Mettre en place un mail transactionnel qui part automatiquement
      X jours après la livraison d'une commande WooCommerce (typiquement
      7 jours), invitant le client à laisser un avis. Deux pistes :
      1. **Plugin WC natif** : "AutomateWoo" ou "Mailpoet" avec trigger
         "X jours après Completed order" → template email + lien vers
         la fiche Google Business Profile (ou Trustpilot, Featurable…)
      2. **Workflow n8n / Zapier** : webhook WooCommerce → délai →
         envoi via SMTP WP avec lien avis.
      Objectif : convertir chaque commande en ~30% de nouveaux avis
      Google, ce qui booste fortement le Local Pack SEO et la
      crédibilité en fiche produit.

---

## ⚠️ Plan de rollback si ça casse

Si après la bascule un problème critique apparaît (ex: checkout cassé,
erreurs 500 massives) :

1. Chez le registrar DNS : remettre l'enregistrement `A` de `www.` sur
   l'ancienne IP WordPress.
2. Propagation DNS : 1-4 heures.
3. Le WordPress est toujours fonctionnel sur `wp.labrasseriedesplantes.fr` en
   parallèle → tu peux investiguer le problème sans interruption réelle.

Garder ce doc à jour après la bascule : noter la date, les hics éventuels,
ce qui a été ajusté.

---

## 📅 Suggéré

**Bon moment** : mardi matin, hors période commerciale intense (pas avant
Noël, pas pendant les soldes).

**Mauvais moment** : vendredi soir (si ça casse, tu galères tout le weekend).
