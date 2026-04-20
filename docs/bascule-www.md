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

- [ ] **Vérifier le `site` dans astro.config.mjs**
  Si après bascule, les URLs du sitemap pointent encore sur l'apex
  `https://labrasseriedesplantes.fr/...` alors que le domaine canonique
  est `www.`, IndexNow soumettra les mauvaises URLs. Vérifier `site`
  dans `astro.config.mjs` + `site.url` dans `src/data/site.ts`.
  Si on veut `www.` en canonique : changer pour `https://www.labrasseriedesplantes.fr`
  partout + redirection apex → www. dans Vercel (déjà au point 4.2 du plan
  de bascule).

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
    `LocalBusiness`, `Product` sur les fiches, `BlogPosting` sur les articles.
  - [Rich Results Test](https://search.google.com/test/rich-results) —
    doit détecter au moins : Product, LocalBusiness, Breadcrumb, FAQ (sur
    `/faq`), Recipe (sur les cocktails).

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
