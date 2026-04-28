# Audit hreflang / i18n — test.labrasseriedesplantes.fr

**Date** : 2026-04-27
**Scope** : implémentation hreflang HTML + sitemap, cohérence FR / EN / ES / IT

---

## 1. Score hreflang : **62 / 100**

Décomposition :

- HTML head — codes courts cohérents, x-default → FR, og:locale OK : **+45**
- Filtrage `hasTranslation` correct sur les pages statiques (FR sans EN n'émet pas vers /en/) : **+10**
- ES / IT minimal correctement géré (home seule, autres pages FR n'émettent pas hreflang es/it) : **+10**
- **Sitemap : 100 / 110 URLs sans `<xhtml:link>` alternate** (slugs traduits non détectés par `@astrojs/sitemap`) : **−20**
- **Bug filtrage prefix** : 19 articles FR émettent `hreflang="en"` vers un /en/journal/&lt;slug&gt; **404** : **−15**
- 1 produit FR cassé (`/boutique/lalchimie-vegetale` = 404, doublon) émet hreflang vers 404 : **−3**
- ES / IT : scope minimal mais stratégie cohérente (pas de promesse non tenue côté Google) : **+5**

---

## 2. Tableau pages testées

Légende cohérence : **OK** = HTML et sitemap alignés, **KO‑sitemap** = HTML correct mais sitemap sans `<xhtml:link>`, **KO‑404** = hreflang pointe vers une URL 404.

| Page | HTTP | `<html lang>` | og:locale | hreflang HTML | hreflang sitemap | Cohérence |
|---|---|---|---|---|---|---|
| `/` | 200 | fr | fr_FR | fr,en,es,it,x-default | fr,en,es,it | **OK** |
| `/en/` | 200 | en | en_GB | fr,en,es,it,x-default | fr,en,es,it | **OK** |
| `/boutique` | 200 | fr | fr_FR | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/en/shop` | 200 | en | en_GB | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/boutique/alchimie-vegetale` | 200 | fr | fr_FR | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/en/shop/alchimie-vegetale` | 200 | en | en_GB | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/notre-histoire` | 200 | fr | fr_FR | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/en/our-story` | 200 | en | en_GB | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/composer-mon-coffret` | 200 | fr | fr_FR | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/en/build-your-gift-box` | 200 | en | en_GB | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/blog` | 200 | fr | fr_FR | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/en/journal` | 200 | en | en_GB | fr,en,x-default | _aucun_ | **KO‑sitemap** |
| `/faq` | 200 | fr | fr_FR | fr,en,x-default | fr,en | **OK** |
| `/es/` | 200 | es | es_ES | fr,en,es,it,x-default | fr,en,es,it | **OK** |
| `/it/` | 200 | it | it_IT | fr,en,es,it,x-default | fr,en,es,it | **OK** |
| `/blog/likora-2022-portrait-de-curateur` | 200 | fr | fr_FR | fr,en (en→**404**),x-default | _aucun_ | **KO‑404 + KO‑sitemap** |
| `/blog/cerfgent-or-salon-agriculture-2025` | 200 | fr | fr_FR | fr,en (en→**404**),x-default | _aucun_ | **KO‑404 + KO‑sitemap** |
| `/boutique/lalchimie-vegetale` | **404** | fr | — | fr→/404/, x-default→/404/ | _exclu_ | **KO‑page** |

---

## 3. Issues détectées

### 3.1 [BLOQUANT] Sitemap sans `<xhtml:link>` sur 100 URLs / 110

`@astrojs/sitemap` v3 attend des **URLs parallèles** (`/en/<même-slug>`) pour générer automatiquement les annotations `<xhtml:link rel="alternate" hreflang>`. Or le projet utilise des **slugs traduits** (`/boutique` ↔ `/en/shop`, `/notre-histoire` ↔ `/en/our-story`, `/blog` ↔ `/en/journal`).

Conséquence : seules les pages dont le slug est identique FR/EN reçoivent les annotations sitemap (10/110 : `/`, `/cocktails`, `/contact`, `/faq` et leurs `/en/…`). Les 100 autres pages ont **HTML correct mais sitemap muet**. Google n'a alors qu'un seul signal hreflang (le HTML) au lieu de deux.

**Fix recommandé** : passer en `serialize()` custom dans `astro.config.mjs` qui injecte les `links` calculés via `getHreflangLinks()`. L'option `links` est supportée par le format de `@astrojs/sitemap` :

```js
serialize(item) {
  const path = new URL(item.url).pathname;
  const lang = getLangFromUrl(path);
  const alternates = getHreflangLinks(path, lang, 'https://labrasseriedesplantes.fr');
  item.links = alternates
    .filter((a) => a.hreflang !== 'x-default')
    .map((a) => ({ lang: a.hreflang, url: a.href }));
  // …priorités existantes
  return item;
}
```

### 3.2 [BLOQUANT] `hasTranslation` retourne `true` pour tous les `/blog/<slug>` même quand l'EN n'existe pas

Dans `src/i18n/utils.ts`, `translatedPages.en` contient `'/en/journal'`. `hasTranslation` fait `translated.startsWith('/en/journal/')` — toute fiche blog FR considère donc l'EN présent, alors qu'**en réalité 19 articles FR n'ont pas de pendant EN** dans `src/content/blog-en/`.

Articles FR émettant un `hreflang="en"` vers une 404 EN :
- artinov-2023-verveine-a-la-tirette
- cerfgent-or-salon-agriculture-2025
- dans-la-presse-2025
- elixir-vegetal-7-plantes-liqueur
- embouteillage-a-la-main
- haute-loire-tourisme-video-atelier
- la-verveine-citronnelle
- likora-2022-portrait-de-curateur
- liqueur-digestif-eau-de-vie-amer-difference
- liqueur-gentiane-suze-salers-difference
- loire-semene-tourisme-plantes-oubliees
- nos-cocktails-signature
- premiere-medaille-or-concours-lyon-2023
- quelle-liqueur-verveine-choisir-2026
- reconnaitre-vraie-liqueur-artisanale-checklist
- reussir-pamac-2021-les-debuts
- servir-liqueur-aux-plantes-guide
- velay-attractivite-portrait-institutionnel
- world-drinks-awards-comment-ca-marche

Risque SEO : Google détecte le hreflang cassé, ignore le cluster, **possible perte de l'attribution canonique** sur le couple FR/EN concerné.

**Fix recommandé** : durcir `hasTranslation` pour les chemins dynamiques. Soit :

1. **(Préférable)** Au prebuild, scanner `src/content/blog-en/*.md` (et idem pour les fiches produit EN si applicable) pour générer la liste réelle des slugs traduits, étendre `translatedPages.en` automatiquement.
2. Ou : ajouter dans `src/pages/blog/[...slug].astro` une prop `lang` + `noTranslation` au Layout pour les articles sans pendant EN, et faire en sorte que `getHreflangLinks` accepte un override.

Variante minimale possible : enlever simplement `'/en/journal'` du tableau pour stopper le startsWith permissif, et passer une prop `enSlug?` au Layout sur les seuls articles FR dont l'EN existe.

### 3.3 [MINEUR] `/boutique/lalchimie-vegetale` : URL FR cassée

`href="/boutique/lalchimie-vegetale"` est listé dans le HTML de `/boutique` mais la page renvoie 404 (le vrai slug est `alchimie-vegetale`). Hreflang émet vers `/404/`. À corriger côté lien sortant (probablement un produit obsolète encore référencé dans `products.generated.json`).

### 3.4 [INFO — pas un bug] Toutes les URLs hreflang pointent vers `https://labrasseriedesplantes.fr/`

Cohérent avec `site:` dans `astro.config.mjs`. Sur `test.*` les hreflang renvoient vers la prod (les URLs renvoient actuellement le WordPress). Tant que la bascule www. n'est pas faite, ce comportement est **attendu mais non testable bout-en-bout** : Google n'indexe pas `test.*` (X-Robots noindex), donc aucun risque.

### 3.5 [OK] Filtrage ES/IT correct sur pages secondaires

Sur `/boutique`, `/notre-histoire`, etc., le HTML émet uniquement `fr` + `en` + `x-default` — pas de `hreflang="es"` ou `hreflang="it"` puisque seules les homes existent. C'est conforme à `translatedPages.es = ['/es/']` et `translatedPages.it = ['/it/']`. Bon pattern.

### 3.6 [OK] Réciprocité

Toutes les paires FR/EN testées sont réciproques : `/notre-histoire` → `/en/our-story` ET `/en/our-story` → `/notre-histoire`. `<html lang>` et `og:locale` cohérents partout, x-default → FR partout, en_GB utilisé pour EN comme prévu.

---

## 4. Recommandation go / no-go bascule

### **NO-GO en l'état** — 2 correctifs à livrer avant DNS switch www.

Les fondations hreflang HTML sont solides (codes courts alignés, x-default OK, og:locale correct, helpers bien pensés). Mais deux problèmes touchent directement la confiance de Google sur l'i18n :

1. **Sitemap sans `<xhtml:link>` sur 91 % des URLs** — pas un fail technique, juste un signal manquant qu'on devrait fournir avant que GSC commence à crawler les nouvelles URLs Astro.
2. **19 hreflang `en` vers des 404** sur les articles blog — ça, c'est un vrai problème : à la bascule, le crawl révélera ces 404, le cluster hreflang sera invalidé, et on perdra le bénéfice du travail i18n.

### Plan d'action minimal pré-bascule

| Priorité | Action | Effort |
|---|---|---|
| P0 | Étendre `translatedPages.en` à la liste réelle des articles `blog-en/` (génération automatique au prebuild dans `generate-products.mjs` ou nouveau script `generate-translated-pages.mjs`) | ~1 h |
| P0 | Corriger le lien sortant `/boutique/lalchimie-vegetale` (slug obsolète) | ~10 min |
| P1 | Ajouter `serialize()` dans `astro.config.mjs` qui injecte `item.links` via `getHreflangLinks()` pour annoter le sitemap | ~30 min |
| P2 (post-bascule) | Vérifier dans GSC > International targeting que les clusters hreflang sont reconnus, surveiller les "pages avec erreurs hreflang" | suivi |

Une fois P0+P1 livrés, le score remonterait à ~92/100 et la bascule serait safe côté i18n.
