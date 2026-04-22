# Bascule `www.labrasseriedesplantes.fr` : du WordPress au site Astro

Ce document liste les étapes à suivre quand tu veux faire passer `www.` sur le
nouveau site Astro (aujourd'hui sur `test.labrasseriedesplantes.fr`).

**Objectif** : le visiteur qui tape `www.labrasseriedesplantes.fr` arrive sur le
site Astro (Vercel) ; le WordPress continue de tourner en arrière-plan pour
gérer commandes/paiements/stock/emails mais n'est plus accessible publiquement
via `www.`.

---

## ☝️ Avant de commencer — pré-requis à valider

- [ ] **Testé un vrai paiement en conditions réelles** (commande de 1-2 €
      depuis test.labrasseriedesplantes.fr, puis rembourser depuis l'admin WC).
      Vérifier : commande visible dans WP admin, email client reçu, EasyBee
      notifié, facture générée.
- [ ] **Testé le Coffret DIY** en commande réelle — vérifier que les 3 lignes
      apparaissent dans l'admin WC avec la metadata `_coffret_diy`.
- [ ] **Clés API WC "Astro site" régénérées** (point backlog sécurité).
- [ ] **Backups WordPress** à jour (complet BDD + fichiers). UpdraftPlus ou
      équivalent vers Google Drive / Dropbox.
- [ ] **Produit `coffret-original` créé côté Woo** (actuellement manquant, le
      bouton affiche "bientôt disponible").
- [ ] **Site soumis à Google Search Console + Bing Webmaster Tools** avec le
      sitemap `sitemap-index.xml`.
- [ ] **Preview Astro validé** sur mobile + desktop par au moins 2 personnes.
- [ ] **TTFB / Core Web Vitals OK** sur test. (LCP < 2.5s, INP < 200ms, CLS <
      0.1).

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

- [ ] **Google Search Console — Sitemaps**
  1. Ouvrir la propriété domaine `labrasseriedesplantes.fr` dans GSC.
  2. Section *Sitemaps* → supprimer l'ancien `sitemap_index.xml` (format
     Yoast WordPress, plus valide).
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
