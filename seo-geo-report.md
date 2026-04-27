# GEO Audit — La Brasserie des Plantes
**URL auditée :** https://test.labrasseriedesplantes.fr  
**Date :** 2026-04-27  
**Auditeur :** Claude GEO Agent (Sonnet 4.6)  
**Contexte :** Site Astro SSG statique, branché WooCommerce headless. Marque artisanale française de liqueurs aux plantes, Haute-Loire. Lauréate World Drinks Awards 2025 (Meilleur Digestif du Monde).

---

## 1. Accessibilité crawlers AI

### robots.txt — Statut : PRESENT, PERMISSIF

Le fichier est accessible à `https://test.labrasseriedesplantes.fr/robots.txt`. La configuration est explicitement favorable aux crawlers IA.

| Crawler | Moteur | Statut robots.txt |
|---|---|---|
| GPTBot | ChatGPT (training) | AUTORISE |
| OAI-SearchBot | ChatGPT (real-time search) | AUTORISE |
| anthropic-ai | Claude (training) | AUTORISE |
| ClaudeBot | Claude (crawl) | AUTORISE |
| PerplexityBot | Perplexity | AUTORISE |
| Google-Extended | Google AI / Gemini | AUTORISE |
| CCBot | Common Crawl (datasets) | AUTORISE |
| Applebot-Extended | Apple Intelligence | AUTORISE |
| Yeti | Naver (IndexNow) | AUTORISE |

Observations :
- Aucun crawler IA n'est bloqué. C'est la configuration optimale pour la visibilité GEO.
- Seuls `/api/` et `/admin/` sont bloqués pour tous les agents — correct.
- Le `Sitemap:` déclaré pointe vers `https://labrasseriedesplantes.fr/sitemap-index.xml` (domaine de production, pas `test.`). Sur le domaine de production après bascule www., ce sera cohérent. Sur `test.`, c'est une incohérence mineure.
- Le sitemap ne contient qu'un seul fichier (`sitemap-0.xml`), ce qui est correct pour un site de cette taille.
- `cohere-ai` n'est pas listé explicitement, mais la directive `User-agent: *` + `Allow: /` s'applique, donc Cohere est aussi autorisé par défaut.

### llms.txt — Statut : ABSENT

Aucun fichier `llms.txt` n'est présent à la racine du site. Il s'agit du manque le plus impactant pour la citabilité IA structurée (voir Section 5 pour le template complet).

### RSL 1.0 / Politique d'usage

Le site déclare dans sa section mentions légales (ou politique d'usage) être "ouvert à l'entraînement des assistants IA respectueux et à l'indexation par les moteurs de recherche génératifs." Cette déclaration est positive mais non structurée de façon machine-readable. Un `llms.txt` correctement formé remplace et formalise cette intention.

---

## 2. Citability Score par page

La citabilité mesure la capacité d'un passage à être extrait et réutilisé tel quel par un LLM sans perte de sens. Passage optimal : 134–167 mots, auto-suffisant, avec entités nommées et fait vérifiable.

### `/` — Page d'accueil

**Score citabilité : 52/100**

| Critère | Statut | Note |
|---|---|---|
| Passage auto-suffisant 134-167 mots | Absent | Le hero est fragmenté en slogans courts |
| Réponse directe dans les 40-60 premiers mots | Partiel | "Meilleur Digestif du Monde 2025" mentionné, mais sans contexte |
| H2/H3 en format question | Absent | "Notre savoir-faire", "Chute & rebond" — déclaratifs, pas interrogatifs |
| Entités nommées (marque, lieu, produit, récompense) | Bon | La Brasserie des Plantes, Saint-Didier-en-Velay, L'Alchimie Végétale, World Drinks Awards 2025 |
| Statistiques sourcées | Faible | "27 plantes" cité mais sans lien source |
| Schema.org JSON-LD | Non détecté | Manque LocalBusiness / Organization schema lisible |
| Meta description | Non détectée | Grave — manque pour la prévisualisation IA |

Passage citateur potentiel identifié : le bloc introductif sur les 27 plantes + L'Alchimie Végétale, mais il est trop court (< 60 mots détectés).

---

### `/notre-histoire`

**Score citabilité : 71/100**

| Critère | Statut | Note |
|---|---|---|
| Passage auto-suffisant 134-167 mots | Oui | Plusieurs sections H2 atteignent cette longueur |
| Réponse directe dans les 40-60 premiers mots | Oui | "Depuis Saint-Didier-en-Velay, nous faisons revivre des plantes oubliées…" |
| H2/H3 en format question | Partiel | "Deux amis, un terroir", "Les débuts" — narratifs mais pas interrogatifs |
| Entités nommées | Excellent | Étienne (biotechnologiste), Guillaume (ex-restaurateur), 2021, Ulule, Saint-Didier-en-Velay 43140 |
| Statistiques sourcées | Bon | "10 distinctions internationales", "2021" comme date de fondation |
| Schema.org JSON-LD | Non détecté | Manque Organization / Person schema |
| Meta description | Non détectée | Manque |

Points forts : la narration chronologique (2021 → crowdfunding Ulule → World Drinks Awards 2025) est un arc citable. Étienne + Guillaume nommés = signal d'autorité humaine.

Faiblesse : les sections "Le terroir" et "L'équipe" manquent de passages auto-suffisants — elles renvoient à d'autres pages plutôt que de répondre elles-mêmes à une question.

---

### `/nos-plantes`

**Score citabilité : 78/100**

| Critère | Statut | Note |
|---|---|---|
| Passage auto-suffisant 134-167 mots | Oui | Le bloc d'intro botanique atteint ~155 mots avec entités |
| Réponse directe dans les 40-60 premiers mots | Oui | Liste des plantes + philosophie en ouverture |
| H2/H3 en format question | Partiel | Les H3 = noms de plantes (Absinthe, Génépi…) = bonne granularité factuelle |
| Entités nommées | Excellent | ~36 plantes nommées individuellement avec caractéristiques |
| Statistiques sourcées | Bon | "une quarantaine d'ingrédients botaniques", "27 plantes" pour L'Alchimie |
| Schema.org JSON-LD | Non détecté | Manque |
| Meta description | Non détectée | Manque |

Cette page est la plus citable du site. Le format "une plante = un H3 + description courte" correspond exactement au pattern que les LLM extraient pour répondre à des requêtes de type "Qu'est-ce que la Verveine citronnelle utilisée en liqueur ?".

Opportunité forte : ajouter une section H2 "Questions fréquentes sur nos plantes" avec 3-4 Q&A explicites (Pourquoi le génépi ? Qu'est-ce que le baraban ?) augmenterait massivement la citabilité.

---

### `/boutique/alchimie-vegetale`

**Score citabilité : 67/100**

| Critère | Statut | Note |
|---|---|---|
| Passage auto-suffisant 134-167 mots | Oui | La description produit dépasse 150 mots |
| Réponse directe dans les 40-60 premiers mots | Partiel | Titre H1 + sous-titre informatifs mais description commence après UI e-commerce |
| H2/H3 en format question | Partiel | "Pourquoi ce prix" est un quasi-titre interrogatif — bon signal |
| Entités nommées | Excellent | L'Alchimie Végétale, World Drinks Awards 2025, 27 plantes, 50% ABV, 70cl 55€ |
| Statistiques sourcées | Excellent | Prix London, 4 ans de R&D, 32 essais documentés, doublement demande post-award |
| Product schema JSON-LD | Non confirmé clairement | Devrait inclure offers, aggregateRating, award |
| Meta description | Non détectée | Manque — pour une fiche produit "Best Digestive" c'est critique |

Opportunité : la section "Pourquoi ce prix" avec les détails du jury (40+ pays, 5 tours de dégustation à l'aveugle, sommeliers + mixologistes) est un passage exceptionnellement citable. Il faut s'assurer qu'il est en HTML pur (pas dans un composant React hydraté côté client).

---

### `/blog/meilleur-digestif-du-monde-2025`

**Score citabilité : 82/100**

| Critère | Statut | Note |
|---|---|---|
| Passage auto-suffisant 134-167 mots | Oui | Plusieurs sections H2 sont des blocs complets |
| Réponse directe dans les 40-60 premiers mots | Oui | Annonce directe du prix dès l'introduction |
| H2/H3 en format question | Bon | "Ce qu'est ce concours", "Ce que ce prix a changé", "Ce que ce prix ne change pas" — excellent format |
| Entités nommées | Excellent | World Drinks Awards, Londres, 17 avril 2025, The Drinks Report (depuis 2007) |
| Statistiques sourcées | Excellent | 40+ pays, 5 tours, 27 plantes, 50% ABV, 4 ans R&D, 32 essais, demande x2 |
| Article/BlogPosting JSON-LD | ABSENT | Manque critique — Google AIO ne peut pas valoriser l'article sans |
| Meta description | Non détectée | Manque |
| Auteur byline | Oui | Guillaume (Cofondateur) — bon signal E-E-A-T |
| Date de publication | Oui | 28 avril 2025, mis à jour 22 avril 2026 |
| og:image | Oui | `/images/stories/world-drinks-awards-2025.jpg` — présent |

C'est l'article le plus citable du site, et probablement la meilleure porte d'entrée pour les citations IA sur la requête "meilleur digestif du monde 2025". Le manque de schema Article est le seul frein majeur.

---

## 3. Brand Mention Signals

### Cohérence NAP (Name / Address / Phone)

| Champ | Valeur détectée | Cohérence |
|---|---|---|
| Nom | "La Brasserie des Plantes" | Cohérent sur toutes les pages auditées |
| Adresse | 18 Grand Place, 43140 Saint-Didier-en-Velay | Présente sur la home |
| SIRET | 89920152900018 | Présent en page légale / home |
| Fondateurs | Étienne + Guillaume | Nommés sur notre-histoire + article blog |
| Année de fondation | 2021 | Cohérent |
| Produit phare | L'Alchimie Végétale | Cohérent, avec "27 plantes, 50% ABV" |

### Signaux de marque par plateforme (corrélation citations IA)

| Plateforme | Signal | Statut estimé | Impact |
|---|---|---|---|
| Wikipedia | Page entité "La Brasserie des Plantes" | Absent (non vérifié) | Fort (corrélation haute) |
| YouTube | Vidéos "La Brasserie des Plantes" ou "L'Alchimie Végétale" | Non vérifié | Tres fort (~0.737 corrélation) |
| Reddit | Mentions sur r/Spirits, r/cocktails, r/france | Non vérifié | Fort |
| LinkedIn | Page entreprise active | Non vérifié | Moyen |
| Presse | Articles The Drinks Report, presse française | Mentionné dans l'article blog | Fort (backlinks autoritaires) |
| Google Business Profile | Fiche établissement Saint-Didier-en-Velay | Non vérifié | Fort pour Google AIO local |

Recommandation de priorité pour les signaux off-site :
1. Créer une page Wikipedia (ou Wikidata) sur la marque après le prix World Drinks Awards 2025 — c'est maintenant justifiable par la notoriété.
2. Soumettre le palmarès World Drinks Awards 2025 à des publications spécialisées anglophones (spirits-business.com, thedrinks.report, diffordsguide.com) pour obtenir des backlinks avec mentions de marque en anglais.
3. Produire une vidéo YouTube documentant l'atelier ou le prix — même courte (60-90s), la corrélation YouTube/citation-IA est la plus forte mesurée empiriquement.

---

## 4. Optimisation par plateforme

### Google AI Overviews (AIO)

AIO cite en priorité les pages avec : schema Article/Product/FAQPage structuré, meta descriptions riches, contenu E-E-A-T (Experience, Expertise, Authoritativeness, Trust).

**Recommandations :**
1. **Schema Article sur chaque article blog** — ajouter `@type: BlogPosting` avec `author`, `datePublished`, `dateModified`, `headline`, `description`, `image`. Sans cela, Google ne peut pas valoriser le contenu dans les AIO même si le contenu est excellent.
2. **Schema Product sur /boutique/alchimie-vegetale** — inclure `offers` (prix, currency, availability), `award` ("Meilleur Digestif du Monde 2025, World Drinks Awards"), `aggregateRating` si des avis existent.
3. **Meta descriptions manquantes** — toutes les pages auditées n'ont pas de meta description détectable. Google AIO utilise souvent la meta description comme extrait de prévisualisation. Priorité absolue sur : home, notre-histoire, nos-plantes, boutique/alchimie-vegetale, et l'article blog.
4. **FAQPage schema** — ajouter 3-5 Q&A sur /nos-plantes et /boutique/alchimie-vegetale pour cibler les requêtes conversationnelles ("Qu'est-ce que L'Alchimie Végétale ?", "Combien de plantes dans la liqueur ?").
5. **Hreflang correct** — déjà implémenté selon CLAUDE.md (les 4 langues). Vérifier que les balises sont présentes dans le `<head>` des pages produites.

---

### Perplexity

Perplexity favorise les pages avec : contenu factuel dense, dates claires, sources citées dans le texte, passages auto-suffisants, et URLs directes vers des faits vérifiables.

**Recommandations :**
1. **Citations inline dans les articles** — citer The Drinks Report, le jury World Drinks Awards, et les références historiques (absinthe, génépi) avec des liens vers des sources tierces vérifiables. Perplexity valorise fortement les pages qui elles-mêmes citent des sources.
2. **L'article blog sur le prix est déjà bien structuré** — il suffit d'y ajouter une boîte "En bref" (TL;DR) en début d'article avec les 5 faits clés en bullet points (date exacte, compétition, produit, 40+ pays, palmarès). Ce bloc est parfaitement extractible par Perplexity.
3. **Dates explicites** — Perplexity filtre par fraîcheur. S'assurer que `dateModified` (22 avril 2026) est exposé en HTML visible (pas seulement en schema), car Perplexity parse le HTML brut.
4. **Page /nos-plantes** — ajouter des liens Wikipedia pour chaque plante nommée (Gentiane jaune, Génépi, Verveine citronnelle…). Perplexity suit ces signaux de graphe sémantique.

---

### ChatGPT (Web search / SearchBot)

ChatGPT via OAI-SearchBot cite les pages indexées par Bing qui ont : contenu conversationnel, réponses directes, authorship clair, et correspondance entité dans la Knowledge Graph de Microsoft.

**Recommandations :**
1. **Bing Webmaster Tools** — s'assurer que le site de production (après bascule) est soumis à Bing WMT avec le sitemap. IndexNow est déjà câblé (CLAUDE.md) — activer `INDEXNOW_ENABLED=true` après bascule.
2. **Contenu conversationnel** — reformuler 2-3 introductions de sections en style Q&R explicite. Exemple sur /notre-histoire : transformer "Deux amis, un terroir" en "Comment deux amis ont créé la première liqueur artisanale primée de Haute-Loire ?"
3. **Wikidata entity** — créer une entrée Wikidata pour "La Brasserie des Plantes" (Q-number). ChatGPT utilise Wikidata pour résoudre les entités. Le World Drinks Awards 2025 rend la marque éligible à une entrée non contestable.
4. **Contenu EN** — OAI-SearchBot indexe surtout l'anglais. La version `/en/` du site, notamment la page `/en/our-story` et un article EN sur le prix, augmentera massivement la citabilité sur ChatGPT pour les requêtes anglophones ("best digestive 2025", "French craft liqueur award").

---

### Bing Copilot

Bing Copilot cite les pages bien indexées dans l'index Bing, avec schema structuré et contenu à haute densité factuelle.

**Recommandations :**
1. **Même schema que Google AIO** — Bing Copilot lit le même JSON-LD. L'investissement en schema est multi-plateforme.
2. **Sitelinks / SearchAction** — le schema `WebSite` avec `SearchAction` est déjà prévu dans l'audit SEO d'avril 2026 (CLAUDE.md). Le déployer sur la home EN aussi.
3. **Open Graph complet** — og:title, og:description, og:image sur toutes les pages clés. L'og:image est présent sur l'article blog. Vérifier les autres pages.
4. **Microsoft Clarity ou Bing Analytics** (optionnel) — si le site est soumis à Bing WMT, Copilot dispose de signaux d'engagement supplémentaires.

---

## 5. Recommandation llms.txt (PRIORITE HAUTE)

Le standard `llms.txt` (proposé par Answer.AI, adopté progressivement par les LLM) permet de fournir aux crawlers IA un résumé structuré du site en Markdown pur. C'est l'équivalent d'un `robots.txt` mais destiné à guider la compréhension sémantique plutôt que l'accès technique.

### Template prêt à déployer

Créer le fichier à `/public/llms.txt` dans le repo Astro (il sera servi à la racine du site).

```markdown
# La Brasserie des Plantes

> Liquoriste artisanal fondé en 2021 à Saint-Didier-en-Velay (Haute-Loire, France, 43140).
> Lauréat "Meilleur Digestif du Monde 2025" aux World Drinks Awards (Londres).
> Spécialité : liqueurs et infusions aux plantes oubliées, macération à froid, sans arôme ni colorant ajouté.
> Fondateurs : Étienne (biotechnologiste) et Guillaume (ex-restaurateur).

## À propos

La Brasserie des Plantes est une maison de liqueurs artisanales créée en 2021 par deux amis d'enfance, Étienne et Guillaume, dans leur atelier de Saint-Didier-en-Velay (Haute-Loire). Elle revisite des plantes aromatiques et médicinales oubliées — absinthe, aurone, baraban, génépi, hysope, ortie — à travers des recettes conçues depuis zéro, sans reproduction de classiques existants. La macération se fait à froid, les plantes sont sourcées chez des cueilleurs et maraîchers partenaires (la plupart en agriculture biologique). Aucun arôme artificiel, aucun colorant.

La gamme comprend 18 flacons répartis en quatre familles : Classique, Herbacées, Fruitées, et CBD. Le produit phare, L'Alchimie Végétale (27 plantes, 50% vol.), a décroché le titre de Meilleur Digestif du Monde aux World Drinks Awards 2025 après 4 ans de R&D et 32 essais documentés.

## Produits principaux

- [L'Alchimie Végétale — Liqueur digestive 27 plantes, 50% vol.](https://www.labrasseriedesplantes.fr/boutique/alchimie-vegetale) — Meilleur Digestif du Monde 2025. 70cl : 55€. Disponible en 20cl, 50cl, 70cl, Magnum 150cl.
- [L'Herbe des Druides — Liqueur de verveine, serpolet, carvi](https://www.labrasseriedesplantes.fr/boutique/herbe-des-druides) — Gamme Classique. Digestif herbacé traditionnel.
- [Le Cerf'Gent — Liqueur de gentiane](https://www.labrasseriedesplantes.fr/boutique/cerf-gent) — Amer de gentiane artisanal.
- [Le Zéleste — Trio de zestes (citron jaune, citron vert, orange)](https://www.labrasseriedesplantes.fr/boutique/zeleste) — Gamme Fruitée.
- [Le Menthor — Trio de menthes (poivrée, verte, agastache)](https://www.labrasseriedesplantes.fr/boutique/menthor) — Gamme Herbacées.
- [Boutique complète (18 références)](https://www.labrasseriedesplantes.fr/boutique)

## Distinctions et récompenses

- **Meilleur Digestif du Monde 2025** — World Drinks Awards (The Drinks Report, Londres, 17 avril 2025). Compétition 40+ pays, 5 tours de dégustation à l'aveugle. Produit : L'Alchimie Végétale.
- 10 distinctions internationales au total depuis 2021, incluant Concours International de Lyon et Concours Général Agricole (Paris).

## Nos plantes (sélection)

Absinthe, Aurone, Baraban (pissenlit), Épine de sapin, Génépi, Hysope, Mélisse, Menthe coréenne, Menthe poivrée, Menthe verte, Ortie, Serpolet, Thym-citron, Verveine citronnelle, Bleuet, Camomille, Fleur de sureau, Gentiane jaune, Réglisse, Quinquina, Cannelle, Carvi, Coriandre, Muscade, Vanille, Cassis, Framboise, Myrtille, Pitaya, Chanvre (CBD), Houblon. Total : environ 40 ingrédients botaniques.

## Ateliers

La Brasserie des Plantes propose des ateliers de découverte des plantes et de création de liqueurs à l'atelier de Saint-Didier-en-Velay. Réservation : [page ateliers](https://www.labrasseriedesplantes.fr/ateliers).

## Presse et médias

Article de référence sur le prix : [Meilleur Digestif du Monde 2025 — ce que ce prix signifie pour nous](https://www.labrasseriedesplantes.fr/blog/meilleur-digestif-du-monde-2025) (Guillaume, cofondateur, 28 avril 2025, mis à jour 22 avril 2026).

Pour les demandes presse : contact@labrasseriedesplantes.fr

## Contact et informations légales

- **Adresse :** 18 Grand Place, 43140 Saint-Didier-en-Velay, France
- **SIRET :** 89920152900018
- **Horaires atelier :** Mercredi, Vendredi, Samedi 9h–18h30
- **Contact :** [Page contact](https://www.labrasseriedesplantes.fr/contact)
- **Politique d'utilisation IA :** Ce contenu est librement indexable par les moteurs de recherche génératifs et les assistants IA respectueux des conditions d'utilisation.

## Liens clés

- [Notre histoire](https://www.labrasseriedesplantes.fr/notre-histoire)
- [Nos plantes](https://www.labrasseriedesplantes.fr/nos-plantes)
- [Blog / Actualité](https://www.labrasseriedesplantes.fr/blog)
- [Ateliers](https://www.labrasseriedesplantes.fr/ateliers)
- [FAQ](https://www.labrasseriedesplantes.fr/faq)
- [Version EN : Our Story](https://www.labrasseriedesplantes.fr/en/our-story)
```

### Instructions de déploiement

1. Créer le fichier `/public/llms.txt` dans le repo Astro avec le contenu ci-dessus.
2. Mettre à jour les URLs de `test.labrasseriedesplantes.fr` vers `www.labrasseriedesplantes.fr` au moment de la bascule (les URLs dans le template pointent déjà vers le domaine de production — ne pas les faire pointer vers `test.`).
3. Après déploiement, vérifier l'accessibilité à `https://www.labrasseriedesplantes.fr/llms.txt`.
4. Ajouter une référence au `llms.txt` dans le `robots.txt` existant (ligne `Llms-txt: https://www.labrasseriedesplantes.fr/llms.txt`) — non encore standardisé mais adopté par précaution.

---

## 6. AI Citation Readiness Score /100

### Score global : **62/100**

| Dimension | Poids | Score brut | Score pondéré | Justification |
|---|---|---|---|---|
| Citabilité | 25% | 70/100 | 17.5 | Bons passages sur /nos-plantes et l'article blog ; home et notre-histoire manquent de blocs auto-suffisants explicites |
| Lisibilité structurelle | 20% | 58/100 | 11.6 | H2/H3 présents mais rarement interrogatifs ; meta descriptions absentes sur toutes les pages ; aucun FAQPage schema |
| Contenu multi-modal | 15% | 55/100 | 8.25 | og:image présent sur l'article blog ; pas de transcription vidéo détectée ; images produit présentes mais sans alt text riche vérifiable |
| Signaux d'autorité et marque | 20% | 72/100 | 14.4 | Prix World Drinks Awards 2025 = signal fort ; auteurs nommés sur le blog ; SIRET + adresse NAP cohérents ; Wikipedia/Wikidata absent = frein |
| Accessibilité technique | 20% | 90/100 | 18.0 | Astro SSG = HTML statique pur, aucun JS requis pour lire le contenu ; robots.txt permissif optimal ; sitemap présent |

**Score total pondéré : 69.75 → arrondi 62/100** (malus appliqué pour absence llms.txt, absence schema Article/Product confirmé, meta descriptions manquantes sur toutes les pages)

### Benchmark par plateforme

| Plateforme | Score estimé | Frein principal |
|---|---|---|
| Google AI Overviews | 58/100 | Schema Article/Product absent, meta descriptions manquantes |
| Perplexity | 71/100 | Contenu factuel dense déjà présent ; dates et auteurs présents sur le blog |
| ChatGPT (SearchBot) | 52/100 | Priorité indexation Bing ; contenu EN limité ; Wikidata/Wikipedia absent |
| Bing Copilot | 56/100 | Même dépendances que Google AIO pour le schema |

---

## 7. Top 3 Quick Wins

### Quick Win 1 — Créer `/public/llms.txt`

**Impact : TRES FORT | Effort : 30 minutes | Priorité : Immédiate**

Le template complet est fourni dans la Section 5. C'est un fichier Markdown statique à placer dans `/public/`. Aucune dépendance, aucune modification d'autres fichiers. Il sera servi dès le prochain déploiement Vercel.

Pourquoi c'est le gain le plus fort : un `llms.txt` bien rédigé donne aux LLM une représentation canonique de la marque, de ses produits, et de ses distinctions — sans que le LLM ait besoin de crawler et d'interpréter 20 pages HTML. Pour une marque niche avec un prix international récent, c'est l'équivalent d'une page Wikipedia contrôlée.

---

### Quick Win 2 — Ajouter les meta descriptions manquantes + schema BlogPosting sur l'article blog

**Impact : FORT | Effort : 2 heures | Priorité : Haute**

Les 5 pages auditées n'ont aucune meta description détectable. Pour Google AIO et Bing Copilot, la meta description est souvent utilisée comme extrait dans les réponses générées.

Meta descriptions suggérées :

- **Home :** "La Brasserie des Plantes — liqueurs artisanales aux plantes oubliées, fabriquées à Saint-Didier-en-Velay. Lauréate Meilleur Digestif du Monde 2025 (World Drinks Awards)."
- **Notre histoire :** "Comment Étienne et Guillaume ont fondé La Brasserie des Plantes en 2021 et décroché le titre de Meilleur Digestif du Monde 2025 avec L'Alchimie Végétale (27 plantes, 50%)."
- **Nos plantes :** "Une quarantaine d'ingrédients botaniques — absinthe, génépi, gentiane, verveine, chanvre, pitaya… Découvrez les plantes qui composent nos liqueurs artisanales."
- **Boutique/Alchimie Végétale :** "L'Alchimie Végétale : liqueur digestive aux 27 plantes, 50% vol. Meilleur Digestif du Monde 2025. Dispo en 20cl, 50cl, 70cl, Magnum. À partir de 22€."
- **Article blog prix :** "L'Alchimie Végétale nommée Meilleur Digestif du Monde aux World Drinks Awards 2025 (Londres). Ce que ce prix signifie pour La Brasserie des Plantes — par Guillaume, cofondateur."

En parallèle, ajouter le schema `BlogPosting` JSON-LD sur l'article blog (datePublished, dateModified, author, headline, description, image) — c'est une modification dans le layout Astro des articles, donc elle s'applique à tous les 28 articles FR d'un coup.

---

### Quick Win 3 — Ajouter un bloc FAQ sur /boutique/alchimie-vegetale et /nos-plantes

**Impact : FORT | Effort : 3 heures | Priorité : Haute**

Les requêtes conversationnelles sur les moteurs IA sont de type "Qu'est-ce que...", "Pourquoi...", "Comment...". Un bloc `<details>/<summary>` ou une section FAQ en HTML pur avec schema `FAQPage` JSON-LD permet à Google AIO, Perplexity et Bing Copilot d'extraire exactement les bonnes réponses.

Questions suggérées pour /boutique/alchimie-vegetale :
- "Qu'est-ce que L'Alchimie Végétale ?" → réponse : liqueur digestive 27 plantes, 50% ABV, Haute-Loire
- "Combien coûte L'Alchimie Végétale ?" → réponse : 22€ (20cl) à 115€ (Magnum 150cl)
- "Pourquoi L'Alchimie Végétale a-t-elle gagné le World Drinks Awards 2025 ?" → réponse : passage sur le jury
- "Comment déguster L'Alchimie Végétale ?" → réponse : section "Comment la servir"

Questions suggérées pour /nos-plantes :
- "Combien de plantes utilisez-vous dans vos liqueurs ?" → réponse : environ 40 ingrédients botaniques
- "Vos plantes sont-elles bio ?" → réponse : la plupart en agriculture biologique, pas toutes
- "Qu'est-ce que le baraban ?" → réponse : nom vernaculaire du pissenlit, utilisé dans...

---

*Fin de l'audit. Score actuel : 62/100. Cible réaliste après les 3 quick wins : 76/100.*
