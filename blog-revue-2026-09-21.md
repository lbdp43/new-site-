# Revue des articles d'Actualité — 21 septembre 2026

Passe systématique sur les **33 articles FR** (29 634 mots) et les 8 articles EN,
avant remise en ligne de la section. L'Actualité reste **masquée** en attendant
(décision Guillaume, 21/09/2026) : `noindex`, hors menu, hors sitemap.

Cette revue couvre ce qui se vérifie mécaniquement. La relecture éditoriale
article par article reste à faire — voir « Ce qui reste » en fin de document.

---

## 1. Conformité aux règles en vigueur — ✅ rien à corriger

Chaque règle de `CLAUDE.md` a été passée sur les 41 fichiers (FR + EN) :

| Règle | Occurrences |
|---|---|
| Procédé interdit (`macér*`, `macerat*`) | **0** |
| CBD / chanvre / THC / Lumière Obscure | **0** |
| « sans arôme » généralisé à la gamme | **0** |
| Ancienne formule sourcing (« un par un », « rencontré », « hand-picked ») | **0** |
| « 100 % bio » / « toutes bio » | **0** |
| Noms produit obsolètes (Essence des Alpes, Mâchurés, PraliCoquine) | **0** |
| Liens internes morts | **0** |

**Sourcing géographique des plantes** : 6 occurrences remontées, **toutes
légitimes** après vérification du texte visible (hors URL et cibles de liens) :

- `quelle-liqueur-verveine-choisir-2026` — « Verveine du Velay (Pagès) »,
  « Verveine du Forez » : concurrents nommés avec leur ancrage. Explicitement
  autorisé par la règle d'or.
- `trois-amis-une-brasserie` — « déclarée au greffe de Haute-Loire » :
  ancrage de la **maison**, pas de la matière première. Autorisé.

---

## 2. Trois notes de `CLAUDE.md` étaient périmées

Corrigées dans le même commit que ce document.

| Note | Réalité au 21/09/2026 |
|---|---|
| « L'article `maceration-froide-pourquoi-pas-distillation.md` est passé en `draft: true`, à réécrire ou supprimer » | Le fichier **n'existe plus** — il a été supprimé, pas mis en brouillon. Aucun brouillon dans la collection. |
| « `producteurs-partenaires-bio-velay` est construit entièrement sur la promesse de sur-engagement, à réécrire sur accord de Guillaume » | **Déjà réécrit** (màj 2026-04-27). Il dit aujourd'hui « cueilleurs, maraîchers, **coopératives et filières spécialisées** », « certaines ne poussent qu'en altitude, d'autres à l'autre bout du monde », « la plupart en bio — pas toutes ». C'est exactement la formulation demandée. |
| « Tension non résolue : 3 landings + 2 articles conseillent de chercher la mention "sans arôme ajouté" » | **Résolue** — plus aucune occurrence du mot « arôme » dans les articles ni dans les landings concernées. |

---

## 3. Le seul reste de conformité : un slug

`producteurs-partenaires-bio-velay` — le **corps de l'article est conforme**,
mais son URL porte encore `bio-velay`, ce qui rattache implicitement les
plantes au Velay. C'est le dernier endroit du site où ce claim survit.

**Il est encore temps de le changer sans casse** : la section Actualité n'a
jamais été publique sur Astro, donc aucun lien externe ne pointe dessus et
aucune redirection n'est à prévoir. Une fois la section ouverte, ce ne sera
plus vrai.

Proposition de slug : `comment-nous-sourcons-nos-plantes` (colle au titre
actuel, « Comment nous sourçons nos plantes — cueilleurs, maraîchers et
filières »). Les 6 articles qui pointent vers lui seraient mis à jour dans
le même mouvement.

---

## 4. Métadonnées — le gros du travail mécanique

| Contrôle | Résultat |
|---|---|
| Titres > 60 caractères (tronqués par Google) | **24 / 33** |
| Descriptions hors 70–160 caractères | **29 / 33** |

Les pires cas :

| Article | Titre | Description |
|---|---|---|
| `world-drinks-awards-comment-ca-marche` | 101 car. | — |
| `comment-faire-liqueur-maison` | 91 car. | — |
| `liqueur-artisanale-vs-industrielle` | 89 car. | 231 car. |
| `choisir-liqueur-artisanale-guide` | 78 car. | 246 car. |
| `reconnaitre-vraie-liqueur-artisanale-checklist` | 83 car. | 213 car. |

Sans incidence tant que la section est masquée. À traiter **avant** de la
rouvrir : un titre tronqué au milieu d'un mot fait perdre des clics.

---

## 5. Maillage interne

**Aucun cul-de-sac** : les 33 articles pointent tous vers au moins un autre.

**4 articles ne sont liés depuis aucun autre** — ils ne reçoivent donc aucune
autorité interne :

- `alternatives-artisanales-chartreuse-suze-benedictine` (1 081 mots)
- `comment-faire-liqueur-maison` (1 285 mots)
- `liqueur-noel-cadeau-fetes` (918 mots)
- `tisane-digestive-ou-liqueur` (817 mots)

Ce sont tous des articles récents (avril 2026) et substantiels. Ils ont été
écrits après la passe de maillage et n'y ont jamais été intégrés.

---

## 6. Format et fraîcheur

**14 articles sous 700 mots.** Ce n'est pas disqualifiant — beaucoup sont des
brèves d'actualité (médaille, passage presse, vidéo), et une brève courte est
légitime. Mais quatre d'entre eux visent des requêtes de fond et mériteraient
d'être étoffés :

| Article | Mots | Remarque |
|---|---|---|
| `la-verveine-citronnelle` | 536 | Sujet plante porteur, traité trop court |
| `plantes-oubliees-du-velay` | 619 | Idem |
| `alchimie-vegetale-27-plantes-composition` | 689 | Porte le produit phare |
| `producteurs-partenaires-bio-velay` | 628 | Sujet de fond, sous-développé |

**Deux articles n'ont jamais été mis à jour** depuis leur publication :
`likora-2022-portrait-de-curateur` (2022) et `reussir-pamac-2021-les-debuts`
(2021). Ce sont des archives assumées — pas un problème en soi.

---

## Ce qui reste : la relecture éditoriale

Cette passe garantit que **rien d'interdit ne subsiste** et que la mécanique
est saine. Elle ne dit pas si un article est **juste, utile et bien écrit** —
ça demande de les lire, et ça représente 29 634 mots.

Ce qu'il faudrait vérifier article par article, et qui ne s'automatise pas :

1. **Exactitude factuelle** — degrés, millésimes de médailles, noms de
   concours, dates, prix. Plusieurs articles citent des degrés ; ils ont
   changé sur certaines références (Cerf'Gent et Pralicoquine à 15,5 %).
2. **Cohérence avec la gamme actuelle** — la gamme CBD a été supprimée et
   trois plantes avec elle (absinthe, ortie, chanvre). Aucun article ne les
   mentionne, mais certains décrivent la gamme dans son ensemble.
3. **Affirmations sur le procédé** — le vocabulaire interdit est absent,
   mais certains articles décrivent quand même *comment* on fabrique. À
   relire avec l'œil de Guillaume.
4. **Ton et actualité** — un article de 2021 qui parle au présent de choses
   qui ont changé (cf. le cas de la tireuse, corrigé le 21/09).

**Ordre suggéré** : les 8 articles « Fabrication » et « Plantes » les plus
longs d'abord (ce sont eux qui porteront le trafic), puis les brèves.
