# Audit avant bascule — 21 septembre 2026

Performance, référencement, Google Analytics, état de préparation.
Mesures faites sur le build de la branche `claude/fiches-produit-wp`
(124 pages), et sur le rendu réel dans un Chromium piloté.

---

## Verdict

**Le site est prêt techniquement.** Un seul point peut coûter cher s'il
passe inaperçu : **l'hôte canonique**. Voir § Bloquants.

---

## 1. Feux verts

### Construction et intégrité

| Contrôle | Résultat |
|---|---|
| Build | 124 pages, aucune erreur |
| Liens internes morts | **0** (66 corrigés cette session) |
| Images / vidéos manquantes | **0** (5 corrigées) |
| Balises `<img>` sans `alt` | **0** sur 1 084 |
| Titles ou descriptions dupliqués | **0** |
| JSON-LD invalide | **0** |

### Référencement

- **Schema.org complet** : `LocalBusiness` + `Organization` avec adresse
  postale, coordonnées GPS, horaires, zones de livraison, fondateurs,
  note agrégée issue des vrais avis Google. Plus `WebSite` avec
  `SearchAction` (éligible à la barre de recherche Google),
  `VideoObject`, et sur l'ensemble du site : 38 `Product`,
  110 `BreadcrumbList`, 44 `BlogPosting`, 20 `Recipe`, 11 `FAQPage`.
- **hreflang** sur 4 langues + `x-default`, **0 URL inexistante**.
- **Sitemap** : 73 URL, toutes valides, priorités différenciées.
- **robots.txt** propre, avec autorisation explicite des robots IA
  (GPTBot, ClaudeBot) et deux manifestes `llms.txt` / `llms-full.txt`.
- **Titles et descriptions** : les 76 pages publiques tiennent désormais
  dans les limites d'affichage de Google (60 et 160 caractères).
- **Image de partage** `og-default.jpg` présente, au bon format 1200×630.
- Le **portail d'âge n'empêche pas l'indexation** : il est masqué par
  défaut dans le HTML et révélé en JavaScript. Google lit les 6 537 mots
  de la page d'accueil.

### Performance

Mesures à 390 px de large, réseau local (donc optimistes en absolu, mais
comparables entre elles) :

| Page | LCP | CLS | Poids |
|---|---|---|---|
| Accueil | 272 ms | **0** | 13,3 Mo |
| Boutique | 172 ms | **0** | 1,9 Mo |
| Fiche produit | 160 ms | **0** | 0,9 Mo |
| Notre histoire | 156 ms | **0** | 3,2 Mo |

- **CLS à 0 partout** — aucun décalage de mise en page. C'est le seul des
  trois Core Web Vitals qui ne dépend pas du réseau : le résultat est
  transposable en production.
- **Polices auto-hébergées et préchargées** — aucun appel à Google Fonts,
  donc aucune requête tierce bloquante.
- **Cache immuable d'un an** sur images, vidéos et polices.
- JS total 422 Ko (dont 182 Ko de runtime React pour les îlots), CSS
  135 Ko en un seul fichier.
- **Aucun débordement horizontal** sur 23 pages testées à 390 px.

### Sécurité

HSTS avec `preload`, CSP **appliquée** (pas en report-only),
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` restrictive avec exception Stripe.
`noindex` correctement limité à `test.labrasseriedesplantes.fr`.

---

## 2. Google Analytics — état

**Mesure GA4 `G-DK89M6D81H`, Consent Mode v2.**

Le script est chargé en `denied` sur tous les stockages. Aucun cookie,
aucune donnée envoyée tant que le visiteur n'a pas coché la case dans le
portail d'âge — case **décochée par défaut**. C'est conforme CNIL.

### Événements envoyés

| Événement | État |
|---|---|
| `page_view` | au consentement |
| `view_item` | fiche produit |
| `add_to_cart` | bouton d'ajout |
| `begin_checkout` | **ajouté aujourd'hui** |
| `purchase` | **complété aujourd'hui** — `value`, `currency`, `items` |

Le `purchase` ne transmettait que le numéro de commande : GA4 comptait
les conversions mais affichait **0 € de chiffre d'affaires**. Le paiement
se terminant côté WooCommerce, la page de confirmation ne reçoit pas le
montant. Le panier est désormais mémorisé juste avant le paiement et
relu à la confirmation.

### À faire dans l'interface GA4, après la bascule

1. Vérifier que le **flux de données** pointe bien sur le domaine servi.
2. Marquer **`purchase` comme conversion** (ce n'est pas automatique).
3. Connecter **Search Console** à la propriété GA4.
4. Vérifier que le chiffre d'affaires remonte sur une vraie commande.

> Ce qui manque encore : `view_cart` et `remove_from_cart`. Sans eux, le
> rapport d'entonnoir aura un trou entre l'ajout au panier et le
> paiement. Ni bloquant ni urgent.

---

## 3. Bloquant avant bascule

### L'hôte canonique n'est pas celui prévu pour la production

`src/data/site.ts` déclare `url: "https://labrasseriedesplantes.fr"`
— **sans `www.`**. Cette valeur alimente les balises canoniques, le
sitemap, les hreflang, le `robots.txt` et le schema.

Or la bascule est prévue sur **`www.labrasseriedesplantes.fr`**.

Si `www.` sert le site en l'état, **chaque page déclarera que sa version
canonique est ailleurs**. Google suivra la déclaration, pas l'URL servie.
C'est le genre d'erreur qui coûte des semaines de visibilité.

**Deux issues, à trancher avant le jour J :**

- **Servir sur l'apex** `labrasseriedesplantes.fr` et rediriger `www.`
  vers lui en 301. Rien à changer dans le code.
- **Servir sur `www.`** : changer `site.url` et régénérer. Vérifier aussi
  le plugin CORS WordPress et l'URL déclarée dans Search Console.

---

## 4. À traiter, sans bloquer

| Sujet | Détail |
|---|---|
| **Vidéo du hero** | 11,6 Mo à elle seule. La page d'accueil est passée de 28,9 à 13,3 Mo aujourd'hui en différant les deux vidéos hors écran ; celle du hero reste. La recompresser autour de 2 Mo diviserait encore le poids par cinq. |
| **11 listes d'ingrédients** | Dérivées de la composition, pas recopiées d'une étiquette. Mention réglementaire : à relire sur les bouteilles. |
| **Blog en `noindex`** | 45 pages hors sitemap, volontairement. 11 liens depuis les fiches produit y mènent : ils fonctionnent pour un visiteur, mais ne transmettent rien à Google. |
| **Titles du blog** | 29 titles et 40 descriptions dépassent les limites. Sans effet tant que le blog est masqué. |
| **CORS WordPress** | Ajouter le domaine de production dans `lbdp_astro_allowed_origins()`, sinon le panier ne fonctionnera plus. |
| **IndexNow** | Poser `INDEXNOW_ENABLED=true` dans Vercel, **après** la bascule seulement. |
| **`view_cart` / `remove_from_cart`** | Entonnoir GA4 incomplet. |

---

## 5. Ce qui a été corrigé pendant cette session

- 66 liens internes morts, 5 médias cassés
- Le bouton de langue menait à une 404 sur 35 pages
- Les pages d'accueil espagnole et italienne avaient 17 liens sur 17 en 404
- 95 titles et 59 descriptions hors limites → 0 hors blog
- Vocabulaire de macération retiré (162 occurrences)
- Claims « sans arôme » généralisés à toute la gamme, retirés
- Formulation du sourcing des plantes alignée sur la réalité
  (cueilleurs, maraîchers, coopératives, filières spécialisées)
- 11 violations de la règle d'or sur le sourcing, dont une dans les CGV
- Le format 20 cl de la gamme Lumière Obscure, invendable sur le site
- Le champ « brouillon » ne masquait pas les articles
- `/blog` émettait deux `<h1>`
- Cibles tactiles de 10 px sur la galerie produit
- Bouteilles agrandies de 85 % sur mobile, 56 % sur ordinateur
