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

### Étape 5 — Validation post-bascule

Dans l'heure qui suit :
- [ ] `https://www.labrasseriedesplantes.fr/` → Astro homepage ✓
- [ ] `https://labrasseriedesplantes.fr/` → redirige vers `www.` ✓
- [ ] `https://www.labrasseriedesplantes.fr/boutique/alchimie-vegetale` → page
      produit Astro ✓
- [ ] Ajouter au panier → checkout → commande réelle → apparaît dans WP admin ✓
- [ ] Sitemap `https://www.labrasseriedesplantes.fr/sitemap-index.xml`
      accessible ✓
- [ ] TTFB mesuré < 300 ms (vs ~1000 ms sur l'ancien WP direct) ✓

Dans les 48h :
- [ ] Google Search Console → notification de changement de domaine OK
- [ ] Pas d'augmentation anormale des 404 (monitor via GSC)
- [ ] Pas de chute de trafic (normal 10-15% de turbulence les 2 premières
      semaines, puis récupération)

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
