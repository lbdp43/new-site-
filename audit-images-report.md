# Audit images — test.labrasseriedesplantes.fr

Date : 2026-04-27
Auditeur : Claude (Opus 4.7 1M)
Périmètre : `public/images/` repo + 4 pages live HTML render

---

## 1. Score global

**78 / 100** — bon niveau global, deux gros bémols structurels (CLS + 1 fichier monstre).

| Catégorie | Note | Remarques |
|---|---|---|
| Alt text | 19/20 | 100 % des `<img>` ont un alt non vide (133/133). Sémantique riche, 0 alt placeholder. |
| Format / poids | 16/20 | 67 % WebP. Mais 1 fichier à 1,67 MB et 5 JPG > 400 KB qui devraient être en WebP. |
| Lazy loading | 16/20 | 86/90 lazy en home, parfait au-dessus de la ligne. Article blog à 0/4 lazy. |
| `decoding="async"` | 8/15 | Inégal : 13 % en home, 30 % en produit, 53 % about, 0 % blog. |
| **Width/height (CLS)** | **5/20** | **Quasi aucun `<img>` n'a width+height** (1/19, 1/20, 1/4 selon page). LCP risque. |
| `<picture>` / srcset | 4/15 | Aucun `<picture>` ni `srcset` — 1 seule taille servie quel que soit le device. |
| Conformité règle d'or | 10/10 | Aucun alt ne viole la règle (vérifié). |

---

## 2. Stats globales repo

### Taille totale

- **23 MB** sur 166 fichiers dans `public/images/`
- Médiane par fichier : ~140 KB

### Répartition par format

| Format | Count | % |
|---|---|---|
| `.webp` | 111 | 67 % |
| `.jpg`  |  39 | 23 % |
| `.png`  |  12 |  7 % |
| `.svg`  |   4 |  2 % |

### Top 20 plus gros fichiers (KB)

| KB | Fichier |
|---:|---|
| **1672** | `ateliers/artisans.jpg` ⚠️ |
|  472 | `team/portrait-etienne.jpg` |
|  436 | `gallery/evenement-03.webp` |
|  424 | `gallery/production-01.jpg` |
|  408 | `gallery/evenement-04.webp` |
|  408 | `gallery/atelier-01.jpg` |
|  404 | `stories/world-drinks-awards-2025.jpg` |
|  380 | `gallery/evenement-02.webp` |
|  352 | `gallery/atelier-02.jpg` |
|  340 | `gallery/production-02.webp` |
|  336 | `team/portrait-guillaume.webp` |
|  336 | `gallery/evenement-05.webp` |
|  292 | `brand/logo-clair.webp` |
|  288 | `products/sizes/cerf-gent-70cl.webp` |
|  284 | `gallery/atelier-04.webp` |
|  280 | `gallery/atelier-03.webp` |
|  276 | `team/portrait-etienne.webp` |
|  272 | `products/sizes/herbe-des-druides-50cl.webp` |
|  272 | `products/sizes/fleche-ardente-70cl.webp` |
|  268 | `products/sizes/lime-des-pres-70cl.webp` |

### Fichiers > 500 KB

- **1 seul** : `ateliers/artisans.jpg` à **1,67 MB** (servi tel quel par Vercel : 1 709 361 octets vérifiés).

### JPG / PNG candidats WebP (les 10 plus gros)

| KB | Fichier | Action |
|---:|---|---|
| 1672 | `ateliers/artisans.jpg` | **Convertir + redimensionner d'urgence** |
|  472 | `team/portrait-etienne.jpg` | Doublon : la version WebP existe déjà (276 KB), basculer le HTML |
|  424 | `gallery/production-01.jpg` | Convertir WebP |
|  408 | `gallery/atelier-01.jpg` | Convertir WebP |
|  404 | `stories/world-drinks-awards-2025.jpg` | Convertir WebP |
|  352 | `gallery/atelier-02.jpg` | Convertir WebP |
|  240 | `press-covers/le-bonbon-wda.jpg` | Convertir WebP |
|  240 | `ateliers/liqueur-6.jpg` | Convertir WebP |
|  236 | `stories/plantes.jpg` | Convertir WebP |
|  232 | `ateliers/liqueur-1.jpg` | Convertir WebP |

Total JPG > 100 KB : ~3,5 MB. Conversion WebP qualité 80 → ~1,2 MB économisés.

Les 12 PNG sont essentiellement des logos presse (88 KB max, presque tous < 4 KB), le PNG du palmarès Lyon 2026 à 88 KB pourrait passer en WebP/SVG.

---

## 3. Pages live — HTML render

### Légende
| Critère | Cible |
|---|---|
| `alt` non vide | 100 % |
| `width` + `height` | 100 % (anti-CLS) |
| `loading="lazy"` below-the-fold | ≥ 90 % |
| `decoding="async"` | 100 % |

### 3.1 Home `/`

| Métrique | Valeur |
|---|---|
| `<img>` total | 90 |
| Alt non vide | **90/90** ✅ |
| width+height | **14/90** (15 %) ❌ |
| loading=lazy | 86/90 (95 %) ✅ |
| loading=eager | 1 (logo-mark hero, OK c'est le LCP) |
| decoding=async | 12/90 (13 %) ⚠️ |
| `<picture>` | 0 |
| `srcset` | 0 |

LCP candidate : `/images/brand/logo-mark.webp` 54 KB, `eager` + width/height OK.
Preload présent : `/videos/lbdp-pro-poster.jpg` (143 KB) — bien câblé.

### 3.2 Fiche produit `/boutique/alchimie-vegetale`

| Métrique | Valeur |
|---|---|
| `<img>` total | 20 |
| Alt non vide | **20/20** ✅ |
| width+height | **1/20** (5 %) ❌ |
| loading=lazy | 16/20 |
| decoding=async | 6/20 (30 %) ⚠️ |
| `<picture>` | 0 / srcset 0 |
| LCP | `alchimie-vegetale-70cl.webp` 192 KB, `fetchpriority="high"`, **sans width/height** ❌ |

L'image hero du produit déclenche le LCP mais sans dimensions → CLS quasi garanti.

### 3.3 Notre histoire `/notre-histoire`

| Métrique | Valeur |
|---|---|
| `<img>` total | 19 |
| Alt non vide | **19/19** ✅ |
| width+height | **1/19** (5 %) ❌ |
| loading=lazy | 16/19 |
| decoding=async | 10/19 (53 %) ⚠️ |
| `<picture>` / srcset | 0 |
| Image bizarre | `team/portrait-etienne.jpg` 472 KB référencée alors qu'un `.webp` 276 KB existe |

### 3.4 Article blog `/blog/alchimie-vegetale-27-plantes-composition`

| Métrique | Valeur |
|---|---|
| `<img>` total | 4 |
| Alt non vide | **4/4** ✅ |
| width+height | **1/4** ❌ |
| **loading=lazy** | **0/4** ❌ |
| **decoding=async** | **0/4** ❌ |
| `<picture>` / srcset | 0 |

Le template d'article blog est le moins optimisé : ni lazy, ni async, ni dimensions. Probablement un composant React/MDX qui ne propage pas les attributs.

---

## 4. Issues critiques

### CRIT-1 — `ateliers/artisans.jpg` à 1,67 MB
Servi tel quel sur prod (`Content-Length: 1 709 361`). À redimensionner (max 1920px de large) + convertir WebP qualité 80 → cible **180 KB**. Gain : ~1,5 MB sur les pages qui l'utilisent.

### CRIT-2 — Width/height absents partout
- Home : 15 % | Produit : 5 % | About : 5 % | Blog : 25 %
- Conséquence : **CLS imprévisible**, surtout sur mobile (les bouteilles produits font partie du LCP).
- Patch : tous les composants qui servent `<img>` (`ProductCard`, gallery, blog markdown, etc.) doivent recevoir `width` + `height` du `wc-live.json` ou des dimensions stockées dans la frontmatter.

### CRIT-3 — Cache HTTP cassé sur les images
Tous les fichiers servis avec `cache-control: public, max-age=0, must-revalidate`. **Aucune image n'est cachée par le navigateur.** Chaque visite re-télécharge ~3 MB d'assets. Vercel devrait servir avec `max-age=31536000, immutable` pour `/images/*` (fichiers fingerprint-able ou pas, ce sont des assets statiques).

### CRIT-4 — Article blog sans lazy/async/dimensions
0/4 sur les 3 critères du template article. Tous les articles partagent ce template → **40+ pages affectées**. Probablement à corriger dans un seul composant.

### CRIT-5 — Aucun `srcset` / `<picture>` du site entier
1 seule taille servie quel que soit le device. Un mobile 375px télécharge la même WebP 270 KB qu'un écran 4K. Astro propose `<Image>` qui génère srcset automatiquement → migration prévue dans le backlog SEO d'avril 2026 (déjà mentionnée dans `CLAUDE.md`).

---

## 5. Quick wins (ordonnés par ROI)

1. **Convertir `ateliers/artisans.jpg`** (1672 → ~180 KB) — 5 min, gain 1,5 MB. Idem pour les 5 autres JPG > 400 KB. Total gain : ~2,2 MB.
2. **Re-pointer les `<img src="*.jpg">` vers les `.webp` qui existent déjà** dans le repo (cas `team/portrait-etienne` flagrant). Audit grep dans `src/` à faire.
3. **Patcher `vercel.json`** : ajouter un header `Cache-Control: public, max-age=31536000, immutable` sur `/images/*` et `/videos/*`. Gain : Speed Index sur retours visiteurs.
4. **Ajouter `decoding="async"` partout** : 1 seul attribut sur le composant `<img>` partagé. Effort : 10 min.
5. **Fixer le template article blog** : ajouter `loading="lazy" decoding="async"` au composant qui rend les images markdown (probablement un `remark` ou un `<img>` MDX).
6. **Width/height sur images produit** : `wc-live.json` connaît déjà les bouteilles. Stocker `width:600, height:1200` dans le data + propager au template. Effort : 30 min.
7. **OG image manquante** : `defaultOgImage` pointe vers `logo-complet-fond-blanc.webp` (déjà fait dans l'audit SEO d'avril) — à terme créer une vraie 1200×630.
8. **Migrer vers `<Image>` Astro** (déjà au backlog) : srcset + AVIF + lazy + dimensions auto. Plus gros chantier mais le quick win définitif.

---

## 6. Conformité règle d'or sourcing (alts/captions)

Grep regex strict sur les 4 pages live, mots-clés interdits appliqués aux plantes/sourcing :

| Page | Hits suspects | Verdict |
|---|---|---|
| `/` | 2 (logos partenaires "Haute-Loire Tourisme" + "Velay Attractivité") | ✅ OK — noms de partenaires, pas un claim |
| `/boutique/alchimie-vegetale` | 1 — `alt="…(Haute-Loire)"` qualifie la **maison** | ✅ OK selon règle d'or ("Haute-Loire qualifie la MAISON") |
| `/notre-histoire` | 4 hits | ✅ OK — décrivent l'**atelier** (Saint-Didier-en-Velay), un **salon** (Origine Auvergne), une **scène** (Étienne et Guillaume dans les prés). Pas de claim "plantes locales" ou "cueillies en". |
| `/blog/alchimie-vegetale-27-plantes-composition` | 0 | ✅ OK |

**Conclusion conformité : 0 violation détectée**, le travail de la PR #5 et des commits du 26-27 avril a tenu jusque dans les alts. Rien à corriger côté règle d'or.

⚠️ Audit limité aux 4 pages demandées. Pour exhaustivité totale, lancer la commande de vérification du `CLAUDE.md` sur l'ensemble de `src/`.

---

## 7. Recommandation bascule www. → **GO conditionnel**

### GO si tu fais 2 trucs avant la bascule (1h de boulot total) :

1. **Compresser `artisans.jpg`** (1,67 MB → 180 KB). Trivial avec `cwebp -q 80` ou Squoosh.
2. **Patcher `vercel.json`** pour ajouter `Cache-Control: public, max-age=31536000, immutable` sur `/images/*`. Sans ça, chaque visiteur re-télécharge 3 MB à chaque page.

### Reste en backlog post-bascule (pas bloquant) :

- Migration vers `<Image>` Astro pour srcset/AVIF/dimensions auto (déjà flaggué `CLAUDE.md`)
- Patch composant article blog (lazy + async sur les 4 `<img>` MDX)
- Width/height sur templates produit pour CLS propre
- OG image dédiée 1200×630

### Pourquoi pas NO-GO

- Aucun alt manquant ou vide → pas de blocage accessibilité ni SEO image
- Aucune violation règle d'or → pas de risque légal/réputation
- 67 % du parc déjà en WebP → la base est saine
- 95 % des images en lazy sur la home → bonne hygiène déjà en place
- Les CLS et dimensions absentes affectent le **score Web Vitals** mais ne cassent rien fonctionnellement

**Verdict : GO après les 2 quick wins critiques. Le reste se traite tranquille post-bascule.**
