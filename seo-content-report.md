# Audit qualité éditoriale & E-E-A-T — Pages statiques LBDP
_Date : 2026-04-27 — Périmètre : 11 pages statiques hors blog et fiches produit_
_Analyste : Content Quality specialist (Google QRG Sept 2025)_

---

## 1. Score éditorial global : 72/100

Bon niveau d'ensemble pour un site artisanal. Les points forts sont réels (fondateurs nommés, parcours détaillés, distinctions vérifiables, avis clients sourcés). Les gaps tiennent surtout à trois choses : quelques overclaims résiduels, un manque d'autorité externe explicite sur certaines pages, et plusieurs pages dont le volume textuel est trop court pour couvrir le sujet en profondeur.

---

## 2. E-E-A-T par page

### `/` — Home FR
- **Experience** (16/20) : Vidéo atelier en boucle, histoire des fondateurs, galerie. Présence physique très bien signalée (boutique, horaires, Google Maps). Coffret DIY = preuve de différenciation produit.
- **Expertise** (20/25) : Etienne présenté comme biotechnologue des plantes, formulation 27 plantes citée. Titre World Drinks Awards 2025 correctement sourcé.
- **Authoritativeness** (18/25) : PressStrip présent (logos presse) mais sans titres ni dates d'articles citables. Pas d'auteur nommé sur la page elle-même.
- **Trustworthiness** (24/30) : Adresse physique, horaires, téléphone, email, schema LocalBusiness complet, SIRET dans schema. Très solide.
- **Score page : 78/100**

### `/notre-histoire`
- **Experience** (19/20) : Portraits des 2 fondateurs avec parcours nominatifs (biotechnologie Toulouse, restauration Saint-Étienne), galerie 10 photos contextuelles, vidéo making-of. Campagne Ulule citée nominativement. Fort signal first-hand.
- **Expertise** (23/25) : Etienne "nez de la Brasserie", 4 ans de formulation pour L'Alchimie Végétale. Tableau complet des médailles par produit et concours. Artinov 2023.
- **Authoritativeness** (20/25) : 10 distinctions listées avec concours et années. Manque de liens vers les concours pour vérification externe.
- **Trustworthiness** (25/30) : Persona réels, visages, schema Person avec @id, BreadcrumbList. L'alt text ligne 322 ("cueillies en Haute-Loire") est un claim interdit — voir section 8.
- **Score page : 87/100** (meilleure page du site sur E-E-A-T)

### `/nos-plantes`
- **Experience** (15/20) : Vidéo verveine avec Etienne. Grille ~40 plantes avec nom latin, rôle, saison, "utilisée dans". Intro honnête ("nous ne cultivons pas nos plantes nous-mêmes"). Bonne.
- **Expertise** (20/25) : Noms latins présents sur toutes les plantes, classification par famille botanique correcte. Manque : pas d'indication de comment les plantes sont choisies au-delà du "un par un".
- **Authoritativeness** (16/25) : Page référentielle utile mais aucun lien vers une source externe botanique, aucune certification externe citée.
- **Trustworthiness** (22/30) : Honnêteté sur le bio ("pas toutes"). La description du serpolet ("thym sauvage de nos estives du Velay") est un claim de sourcing géographique interdit — voir section 8.
- **Score page : 73/100**

### `/cocktails`
- **Experience** (14/20) : 5 recettes propres signées par "l'Organisation" dans le schema Recipe, pas par un auteur nominatif. Photos cocktails + produit (hover) : bon. Manque une voix/signature.
- **Expertise** (18/25) : Ingrédients précis, étapes correctes, temps de préparation. Aucune note sur les assemblages ou le raisonnement derrière chaque accord.
- **Authoritativeness** (13/25) : Aucune citation externe (presse, blogosphère cocktail). Recettes auto-publiées sans endossement tiers.
- **Trustworthiness** (22/30) : Bonne structuration schema Recipe par cocktail. Pas d'overclaim.
- **Score page : 67/100**

### `/ateliers`
- **Experience** (19/20) : 23 avis Wecandoo intégrés avec nom, date, contenu. Etienne présenté avec portrait et bio. Déroulé étape par étape. Localisation précise avec accès voiture. Très fort signal d'expérience réelle.
- **Expertise** (21/25) : Compétences d'Etienne explicitées. Deux formats distincts avec inclusion, prix, durée, participants.
- **Authoritativeness** (18/25) : Source Wecandoo déclarée en pied de section. Manque : pas de lien vers la fiche Wecandoo dans la déclaration de source (seulement en CTA booking).
- **Trustworthiness** (26/30) : Schema Event avec lieu, prix, dates calculés. Avis datés et nominatifs. Transparence source explicite.
- **Score page : 84/100**

### `/professionnels`
- **Experience** (14/20) : 3 commerciaux nommés, FAQ pro détaillée (10 Q/R). Bon. Manque de témoignages clients pros (caviste, bar) — aucun logo de référence visible.
- **Expertise** (20/25) : Formats exhaustifs (20cl → Jéroboam), zones précises, minimums de commande concrets. Schema FAQPage.
- **Authoritativeness** (15/25) : Aucun client pro identifiable par nom (caviste, restaurant partenaire). Pas de logo partenaire.
- **Trustworthiness** (24/30) : Contact direct visible (email, téléphone, catalogue), réponse 48h garantie, sans-engagement énoncé. BreadcrumbList.
- **Score page : 73/100**

### `/boutique` (index + bloc SEO)
- **Experience** (14/20) : Navigation par gamme, sidebar "Vu récemment". Bloc SEO bas de page bien rédigé mais court (~180 mots). Manque de photos éditorialisant la boutique.
- **Expertise** (19/25) : Bloc SEO distingue arômes synthèse vs matière brute, mentionne la macération manuelle.
- **Authoritativeness** (16/25) : Award mentionné dans le bloc SEO. Manque de liens internes vers les concours ou la presse.
- **Trustworthiness** (23/30) : Schema CollectionPage + ItemList + BreadcrumbList. La phrase "18 liqueurs artisanales bio" dans le bloc SEO (ligne 215) est un overclaim — voir section 8.
- **Score page : 72/100**

### `/composer-mon-coffret`
- **Experience** (13/20) : Configurateur React interactif avec aperçu visuel empilé. Trios suggérés. Différenciateur fort. Mais la page Astro she-même est très courte en contenu éditorial (PageHeader seulement, tout est dans l'île React).
- **Expertise** (15/25) : Aucun texte éditorial expliquant la démarche de composition ou comment accorder les liqueurs entre elles.
- **Authoritativeness** (11/25) : Page quasi vide textuellement. Pas de preuve sociale (avis, presse).
- **Trustworthiness** (20/30) : Schema Product avec AggregateOffer, BreadcrumbList. Pas d'overclaim.
- **Score page : 59/100** — page la plus faible

### `/lumiere-obscure`
- **Experience** (16/20) : Ambiance visuelle très forte (mode nuit). 3 produits avec notes de dégustation détaillées (attaque / cœur / fond de bouche). FAQ YMYL complète et précise.
- **Expertise** (21/25) : FAQ CBD : taux THC/CBD explicité, effet alcool vs CBD distingué, températures, légalité, grossesse. Vraie expertise santé-réglementation.
- **Authoritativeness** (14/25) : Aucune source externe citée sur la légalité CBD (arrêté 30 décembre 2021 mentionné dans le code mais non lié). Pas de certification.
- **Trustworthiness** (24/30) : Schema FAQPage bien structuré. Disclaimer alcool + CBD grossesse présent. Bon YMYL handling.
- **Score page : 75/100**

### `/faq`
- **Experience** (14/20) : 12 questions utiles, 5 catégories. Réponses concrètes avec chiffres (65 €, 12-18 mois, 50% vol.).
- **Expertise** (20/25) : La réponse sur le bio (catégorie Produits) est exemplaire et conforme à la règle d'or. La réponse CBD faq.astro (ligne 62) dit "sans aucune trace de THC" alors que lumiere-obscure.astro dit "< 0,1%". Légère incohérence à aligner.
- **Authoritativeness** (13/25) : Aucune source externe, aucun auteur nommé. Standard pour une FAQ.
- **Trustworthiness** (24/30) : Schema FAQPage + BreadcrumbList. CTA contact en bas. Honnêteté sur le bio.
- **Score page : 71/100**

### `/en/` — Home EN
- **Experience** (15/20) : Contenu quasi identique à la version FR, adapté (pas traduit mot-à-mot). Hero copy clean et sans overclaim.
- **Expertise** (18/25) : Même niveau FR.
- **Authoritativeness** (15/25) : Pas de presse anglophone citée malgré le titre World Drinks Awards (Londres).
- **Trustworthiness** (20/30) : La meta description dit "Organic craft liqueurs" — overclaim. Voir section 8.
- **Score page : 68/100**

---

## 3. Lisibilité

Le style éditorial est homogène et bien écrit sur l'ensemble du site. Quelques observations :

**Points forts :**
- Phrases courtes à moyennes (15-25 mots en moyenne), ton direct, première personne assumée ("nous", "on").
- Paragraphes rarement au-delà de 4-5 lignes.
- Structure titrée avec h2/h3 cohérents.

**Points faibles :**
- `/lumiere-obscure` : le style poétique ("laissez-vous bercer par la chouette effraie", "contrées de vos esprits rationnels") rend la page difficile à lire pour une recherche informative sur le CBD. Score Flesch estimé < 40 (difficile) sur la section hero.
- `/cocktails` : aucune intro éditoriale avant les recettes. Un visiteur qui arrive via recherche "recette cocktail verveine" n'a aucun contexte de marque.
- `/composer-mon-coffret` : le corps de la page `.astro` (hors composant React) ne contient que le PageHeader. Illisible hors JavaScript.

---

## 4. Profondeur (mots, structure, exemples)

Estimation des mots de contenu éditorial (hors code et attributs HTML) :

| Page | Mots estimés | Minimum recommandé | Statut |
|------|-------------|-------------------|--------|
| `/` | ~650 | 500 (homepage) | OK |
| `/notre-histoire` | ~1 100 | 500 | OK |
| `/nos-plantes` | ~900 (intro + fiches) | 800 (service) | OK |
| `/cocktails` | ~450 (recettes seules) | 500 | Limite basse |
| `/ateliers` | ~1 200 | 800 | OK |
| `/professionnels` | ~1 500 | 800 | OK |
| `/boutique` (index) | ~400 (intro + SEO) | 500 | Sous le seuil |
| `/composer-mon-coffret` | ~80 (hors React) | 300 | Thin content |
| `/lumiere-obscure` | ~700 | 800 (service) | Limite basse |
| `/faq` | ~900 | 500 | OK |
| `/en/` | ~600 | 500 | OK |

---

## 5. Thin content

**`/composer-mon-coffret`** : le seul contenu statique est le PageHeader (3 phrases). Le configurateur React génère du HTML côté client mais Google le voit aussi en rendu JS — cela reste à risque pour l'indexation du contenu éditorial. Il n'y a aucun texte expliquant la proposition de valeur du coffret, ni le concept d'empilement, ni d'accord suggéré. Aucune preuve sociale.

**`/boutique`** : l'intro (~180 mots) et le bloc SEO (~180 mots) sont suffisants mais sans profondeur. Les descriptions de gamme (ranges) sont déportées dans `products.ts` et très courtes (1-2 lignes par gamme).

---

## 6. Duplication interne

**Boilerplate CTA récurrent :** Le CTA "Livraison offerte dès 65 €" apparaît de manière identique sur la home, la boutique, la page coffret et la meta description de plusieurs pages. Ce n'est pas un problème SEO mais c'est un signal de copier-coller qui affaiblit la singularité de chaque page.

**Vidéo `lbdp-pro.mp4` et `boutique-sortie.mp4` :** La même vidéo de l'atelier est utilisée en hero sur `/` et `/professionnels`, et la vidéo sortie boutique apparaît à la fois sur `/` et `/ateliers`. Pas de conséquence SEO directe, mais risque de dévalorisation de chaque page comme destination unique.

**Bloc distinctions :** Les médailles de L'Herbe des Druides et de L'Alchimie Végétale sont mentionnées sur la home, `/notre-histoire`, `/professionnels` et (partiellement) `/boutique`. La répétition est justifiée par la nature des pages mais les formulations sont presque identiques d'une page à l'autre — un effort de variation éditoriale apporterait plus de valeur.

**Schema FAQPage :** `/faq`, `/lumiere-obscure` et `/professionnels` émettent chacune un FAQPage indépendant. Pas de conflit technique, mais les Q/R sur le CBD se chevauchent partiellement entre `/faq` (catégorie CBD) et `/lumiere-obscure`.

---

## 7. AI Citation Readiness

Les passages les plus citables par les AI Overviews et les agents IA (format 120-180 mots, factuel, structuré) :

**Excellent — directement citable :**
- `/notre-histoire` — section "Meilleur Digestif du Monde 2025" : contexte + produit + compétition + date + processus en ~120 mots. Passage bien délimité avec h3 propre.
- `/ateliers` — bloc "Votre hôte Etienne" + liste de ce qui est inclus dans l'atelier : factuels, chiffrés (75 €, 2h, 2-6 personnes).
- `/faq` — réponse "Les liqueurs de La Brasserie des Plantes sont-elles biologiques ?" : nuancée, précise, sans overclaim.
- `/lumiere-obscure` — FAQ CBD : répond directement à des questions de type "est-ce légal ?", "y a-t-il du THC ?", "peut-on conduire ?". Format Q/R natif.

**Passages citables mais à améliorer :**
- `/nos-plantes` — l'intro est bonne mais n'inclut pas de chiffres assez précis pour être citée seule ("une quarantaine" est vague).
- `/cocktails` — les recettes ont un schema Recipe mais pas de paragraphe d'introduction citable décrivant la philosophie d'accord.
- `/composer-mon-coffret` — aucun passage citable hors du composant React.

**Manque critique :** Aucune page ne contient de passage type "Qu'est-ce qu'une liqueur artisanale ?" avec définition précise exploitable par les AI overviews. L'audit SEO d'avril 2026 identifiait déjà ce gap (article pilier manquant).

---

## 8. Claims sourcing interdits

### Violations actives (à corriger)

**Gravité HAUTE — claim de cueillette géographique sur les plantes :**

| Fichier | Ligne | Extrait | Problème |
|---------|-------|---------|---------|
| `src/data/plants.ts` | 44 | `"Le thym sauvage de nos estives du Velay."` | Implique un sourcing géographique local des plantes (Velay). Règle d'or violée. |
| `src/pages/notre-histoire.astro` | 322 | `alt="Plantes aromatiques et médicinales cueillies en Haute-Loire pour nos liqueurs artisanales"` | Claim explicite de cueillette en Haute-Loire. Interdit. |

**Gravité HAUTE — "organic" comme qualificatif global de la gamme :**

| Fichier | Ligne | Extrait | Problème |
|---------|-------|---------|---------|
| `src/pages/en/index.astro` | 110 | `description="Organic craft liqueurs and digestifs handmade in Haute-Loire…"` | "Organic" qualifie toutes les liqueurs alors que la plupart (pas toutes) utilisent des plantes bio. Claim trop large en meta description. |
| `src/pages/boutique/index.astro` | 215 | `"nos 18 liqueurs artisanales bio"` | Toutes les liqueurs déclarées "bio". Overclaim. |

**Gravité MOYENNE — incohérence THC entre deux pages :**

| Fichiers | Formulation |
|---------|-------------|
| `src/pages/faq.astro` (CBD Q/R) | "ne contiennent que du CBD, sans aucune trace de THC" |
| `src/pages/lumiere-obscure.astro` (FAQ intégrée) | "THC : strictement inférieur à 0,1 %" |

La formulation de `/lumiere-obscure` est la bonne (seuil légal français précis). Celle de `/faq` est inexacte — "sans aucune trace" est un claim absolu qui ne correspond pas à la réalité réglementaire (le seuil légal autorise jusqu'à 0,1 %).

### Non-violations confirmées (contexte correct)

Les occurrences suivantes ont été vérifiées et sont conformes à la règle d'or (Haute-Loire qualifie la maison, pas les plantes) :

- `index.astro` l. 117 : "séchage des plantes et de l'embouteillage dans notre atelier de Saint-Didier-en-Velay (Haute-Loire)" — production maison, OK.
- `notre-histoire.astro` l. 131 et 132 : "La Brasserie des Plantes, Haute-Loire" en title/description — maison, OK.
- `notre-histoire.astro` l. 242 : alt "Étienne et Guillaume célébrant une bouteille de la Brasserie des Plantes, dans les prés de Haute-Loire" — localise les personnes, pas les plantes en tant que matière première sourcée. OK (limite acceptable).
- `nos-plantes.astro` l. 179 : lien vers l'article des producteurs — neutre, OK.

---

## 9. Top 3 actions priorisées

### Action 1 — Corriger les 4 claims interdits (urgence : immédiate)

Corrections à apporter dans le même commit :

1. `src/data/plants.ts` l. 44 : remplacer `"Le thym sauvage de nos estives du Velay."` par `"Le thym sauvage qui pousse à ras du sol sur les pelouses d'altitude."` (supprime la localisation géographique sans perdre l'information botanique).

2. `src/pages/notre-histoire.astro` l. 322 : remplacer l'alt `"Plantes aromatiques et médicinales cueillies en Haute-Loire pour nos liqueurs artisanales"` par `"Plantes aromatiques et médicinales — matières premières de nos liqueurs artisanales"`.

3. `src/pages/en/index.astro` l. 110 : remplacer `"Organic craft liqueurs and digestifs"` par `"Craft botanical liqueurs and digestifs"` dans la meta description.

4. `src/pages/boutique/index.astro` l. 215 : remplacer `"nos 18 liqueurs artisanales bio"` par `"nos 18 liqueurs artisanales"`.

5. `src/pages/faq.astro` catégorie CBD : remplacer `"sans aucune trace de THC"` par `"avec un taux de THC inférieur à 0,1 % (seuil légal français)"`.

### Action 2 — Renforcer `/composer-mon-coffret` (priorité : haute)

Ajouter dans la page Astro, entre le PageHeader et le composant React, un bloc textuel statique de 150-200 mots couvrant :
- La proposition de valeur (pourquoi composer son coffret plutôt que d'en acheter un prêt)
- Une phrase sur le format empilable 20cl et ce qu'il apporte (cadeau, découverte)
- Un ou deux des trios suggérés présentés textuellement (les 6 trios existants dans `coffret-trios.ts` peuvent nourrir ce texte)
- Un lien vers `/nos-plantes` pour le contexte botanique

Ce bloc rend la page indexable et citable sans dépendre du JS, et passe le seuil des 300 mots minimum.

### Action 3 — Ajouter une source externe vérifiable sur `/nos-plantes` et `/lumiere-obscure` (priorité : normale)

Pour `/nos-plantes` : ajouter un lien vers la fiche ANSM ou une source botanique de référence sur au moins une plante clé (par ex. la verveine citronnée ou la gentiane). Cela renforce l'autorité de la page référentielle et facilite la vérification par les crawlers IA.

Pour `/lumiere-obscure` : lier explicitement le texte "arrêté du 30 décembre 2021" (déjà cité dans le code du FAQ) vers `legifrance.gouv.fr`. Un lien gouvernemental sur une page YMYL CBD est un signal de trustworthiness fort selon les QRG Sept 2025.
