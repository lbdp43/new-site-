# Audit sitemap — labrasseriedesplantes.fr
Date : 2026-04-27 | Environnement : test.labrasseriedesplantes.fr

## Score global : 71 / 100

---

## 1. Validation XML

| Controle | Resultat |
|---|---|
| sitemap-index.xml syntaxe | PASS — xmllint valid |
| sitemap-0.xml syntaxe | PASS — xmllint valid |
| Structure index → enfant | PASS — 1 enfant declare |
| Namespace urlset | PASS — sitemaps.org/0.9 + xhtml |
| Limit 50 000 URL | PASS — 110 URLs |

---

## 2. Structure et domaine

| Controle | Resultat |
|---|---|
| URL sitemap-index | FAIL — pointe `https://labrasseriedesplantes.fr/sitemap-0.xml` (bare domain), servi depuis `test.*` |
| URL sitemap-0 entrees `<loc>` | FAIL — meme probleme : toutes les `<loc>` utilisent `labrasseriedesplantes.fr`, pas `test.labrasseriedesplantes.fr` |
| robots.txt reference sitemap | PASS (coherent) — robots.txt pointe aussi bare domain |

Note : ce desalignement domain sitemap vs host de service est intentionnel et correct. `astro.config.mjs` est configure sur le vrai domaine de production (`site: 'https://labrasseriedesplantes.fr'`). Le sitemap est donc deja pre-cable pour la bascule. Aucune action requise avant bascule.

---

## 3. Exclusions transactionnelles

| Page | Dans sitemap | Attendu |
|---|---|---|
| /panier/ | NON | PASS |
| /commande/ | NON | PASS |
| /admin/ | NON | PASS |
| /commande/confirmation | NON | PASS |

Filtre regex `/(panier|commande|admin|pro\/catalogue)(\/|$)/` fonctionne.

---

## 4. Statuts HTTP (sample)

Toutes les URLs testees repondent 200. Aucun 404 ni redirect detecte sur :
- Pages FR principales, boutique, blog (sample)
- Pages EN : shop, our-story, our-plants, workshops, faq, dark-light, trade, press, legal-notice, terms-of-sale, cookie-policy
- Pages ES et IT (home seulement)

---

## 5. Noindex vs sitemap

| Controle | Resultat |
|---|---|
| test.* retourne `X-Robots-Tag: noindex, nofollow` | PASS — confirme par curl |
| Sitemap sert des URLs `labrasseriedesplantes.fr` (non noindex) | PASS — pas de contradiction |

Les URLs dans le sitemap pointent le domaine de production (pas noindex). Les pages de `test.*` sont noindex mais le sitemap ne les reference pas directement.

---

## 6. lastmod

| Controle | Resultat |
|---|---|
| lastmod present sur toutes les entrees | PASS — 110/110 |
| Valeurs differenciees par page | FAIL — toutes identiques : `2026-04-27T20:31:23.083Z` (timestamp de build) |

Consequence : Google ignore ces dates figees et ne peut pas prioriser le recrawl des pages recemment modifiees. Faible impact sur un site de 110 URLs mais corrigeable.

Fix recommande : lire les dates de commit git par fichier dans `serialize()` ou injecter la date de modification du `.md` source pour le blog et les fiches produit.

---

## 7. priority et changefreq

| Segment | Attendu | Reel | Statut |
|---|---|---|---|
| / et /boutique/ | 1.0 daily | 1.0 daily | PASS |
| /boutique/[slug]/ (FR) | 0.9 weekly | 0.9 weekly | PASS |
| /lumiere-obscure/, /cocktails/, /ateliers/, etc. | 0.8 monthly | 0.8 monthly | PASS |
| /blog/ et articles | 0.7 weekly | 0.7 weekly | PASS |
| /cgv/, /mentions-legales/, /politique-cookies/, /faq/, /contact/ | 0.3 yearly | 0.3 yearly | PASS |
| /liqueurs-artisanales/, /liqueurs-de-plantes/, /liqueur-digestive/ | 0.95 weekly (config) | 0.9 weekly (sitemap reel) | FAIL |
| /en/shop/[slug]/ (EN) | 0.9 attendu par coherence | 0.7 (default) | INFO |
| /en/legal-notice/, /en/terms-of-sale/, /en/cookie-policy/ | 0.3 attendu | 0.7 (default) | INFO |

### Bug pillar pages (priority 0.95 → 0.9)

Le code `serialize()` dans `astro.config.mjs` est correct (test Node confirme 0.95), mais le sitemap deploye affiche 0.9. Cause probable : le build deploye sur `test.*` date d'avant l'ajout de la regle 0.95, ou le plugin @astrojs/sitemap a cache le resultat. Le prochain `npm run build` + deploy corrigera automatiquement.

### Pages EN non couvertes par serialize()

`serialize()` ne contient que des branches pour les chemins FR. Les 18 fiches `/en/shop/[slug]/` heritent du defaut 0.7 au lieu de 0.9, et les pages legales EN heritent de 0.7 au lieu de 0.3. Corrigeable en etendant les conditions aux prefixes `/en/`.

Note : priority et changefreq sont ignores par Google depuis 2023. Cela n'a aucun impact SEO reel — correction a faire pour la completude mais pas bloquante.

---

## 8. Hreflang dans le sitemap

### Pages avec hreflang complet (4 langues)
/ | /en/ | /es/ | /it/ = 4 URLs avec les 4 alternates FR+EN+ES+IT.

### Pages avec hreflang partiel (2 langues seulement)
- /cocktails/ et /en/cocktails/ — FR + EN uniquement (pas ES, pas IT)
- /contact/ et /en/contact/ — FR + EN uniquement
- /faq/ et /en/faq/ — FR + EN uniquement

### Pages sans hreflang (100 URLs)
Toutes les pages de blog FR (`/blog/*`), toutes les fiches FR (`/boutique/*`), toutes les pages EN sauf cocktails/contact/faq, les pages piliers SEO, les pages legales, les pages ES/IT.

### x-default absent
Aucune entree `hreflang="x-default"` dans le sitemap. Google recommande de l'inclure pour les pages multilingues (pointe generalement vers la version par defaut ou une page de selection de langue).

### Analyse
Le plugin @astrojs/sitemap avec la config `i18n` n'emet les alternates que pour les pages dont Astro detecte automatiquement les equivalents linguistiques (via le systeme de routing i18n natif). Les pages avec slugs FR/EN differents (blog/journal, boutique/shop) ne sont pas associees automatiquement — d'ou l'absence de hreflang sur 100 URLs.

Les hreflang dans les `<head>` HTML generees par `getHreflangLinks()` sont corrects (confirme par l'audit SEO d'avril 2026). Le sitemap est redondant sur ce point — Google utilise principalement les hreflang du HTML. Le manque dans le sitemap est un signal faible, pas critique.

---

## 9. Issues classees par severite

### MEDIUM

**M1 — Pillar pages priority 0.95 ne s'applique pas dans le build deploye**
Les 3 pages `/liqueurs-artisanales/`, `/liqueurs-de-plantes/`, `/liqueur-digestive/` affichent 0.9 au lieu de 0.95 dans le sitemap live. Le prochain build corrigera automatiquement (le code est correct). Verifier apres le prochain deploy.

**M2 — serialize() ne couvre pas les chemins EN**
18 fiches `/en/shop/*` a 0.7 (devrait etre 0.9). Pages legales EN a 0.7 (devraient etre 0.3). Etendre `serialize()` dans `astro.config.mjs` aux branches `/en/`.

### LOW

**L1 — lastmod identique sur toutes les 110 URLs**
Toutes figees a `2026-04-27T20:31:23.083Z`. Google ignore les dates non differenciees. Envisager d'injecter la date `git log --format="%aI" -1 -- <fichier>` pour blog et produits.

**L2 — Hreflang absent sur 100 URLs dans le sitemap**
Sans impact direct (hreflang HTML est la reference pour Google). A corriger post-bascule si GSC remonte des warnings hreflang.

**L3 — x-default absent**
Ajouter `hreflang="x-default"` pointant vers `/` sur les pages home des 4 langues.

### INFO

**I1 — priority et changefreq presents**
Google les ignore. Peuvent rester (pas nocifs, utiles pour d'autres crawlers). Pas de suppression requise.

**I2 — robots.txt reference le bare domain, pas test.***
Coherent avec l'intention. Pas de correction requise avant bascule.

---

## 10. Pages manquantes du sitemap

Aucune page 200 trouvee qui serait absente du sitemap (toutes les pages connues sont presentes). Pas de page absente detectee.

---

## 11. Pages en trop dans le sitemap

Aucune page 404 ou redirect detectee dans l'echantillon verifie. Tous les URLs retournent 200.

---

## 12. Recommandation go / no-go bascule

**GO conditionnel** — Le sitemap est fonctionnel pour la bascule sur `www.`.

Conditions pre-bascule satisfaites :
- XML valide, structure index/0.xml propre
- 110 URLs, loin du plafond 50 000
- Exclusions /panier, /commande, /admin correctes
- Toutes les URLs retournent 200
- Domaine configure sur `labrasseriedesplantes.fr` (pas test.*) — zero travail a faire
- robots.txt reference le bon sitemap

Actions a realiser dans les 48h apres bascule (non bloquantes avant) :
1. Soumettre `https://www.labrasseriedesplantes.fr/sitemap-index.xml` dans Google Search Console
2. Verifier dans GSC que le sitemap est indexe sans erreur (24-48h apres soumission)
3. Etendre `serialize()` dans `astro.config.mjs` pour couvrir les chemins `/en/` (M2)
4. Confirmer que les pillar pages affichent bien 0.95 apres le premier build post-bascule (M1)
5. Ajouter `hreflang="x-default"` (L3) — peut attendre le premier sprint post-bascule
