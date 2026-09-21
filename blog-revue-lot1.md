# Revue éditoriale — lot 1

**8 articles les plus longs de « Fabrication » et « Plantes »** (~11 400 mots),
ceux qui porteront le trafic quand l'Actualité rouvrira.

| # | Article | Mots |
|---|---|---|
| 1 | `choisir-liqueur-artisanale-guide` | 2 109 |
| 2 | `liqueur-artisanale-vs-industrielle` | 1 824 |
| 3 | `plantes-liqueur-haute-loire` | 1 580 |
| 4 | `comment-faire-liqueur-maison` | 1 285 |
| 5 | `liqueur-digestif-eau-de-vie-amer-difference` | 1 190 |
| 6 | `liqueur-gentiane-suze-salers-difference` | 1 189 |
| 7 | `elixir-vegetal-7-plantes-liqueur` | 1 160 |
| 8 | `alternatives-artisanales-chartreuse-suze-benedictine` | 1 081 |

---

## ✅ Corrigé sans attendre (36 corrections)

Ce sont des erreurs objectives : soit l'article se contredit lui-même, soit il
contredit la fiche produit. Aucun arbitrage nécessaire.

### Degrés d'alcool

| Article | Erreur | Corrigé en | Preuve |
|---|---|---|---|
| `choisir-liqueur-artisanale-guide` (FR + EN) | Cerf'Gent « 16 % » | **15,5 %** | le même article écrit 15,5 % 70 lignes plus bas |
| `choisir-liqueur-artisanale-guide` (FR + EN) | Alchimie Végétale « 42 % » | **50 %** | le même article écrit 50 % 75 lignes plus bas |
| `servir-liqueur-aux-plantes-guide` | Flèche Ardente « 27° » | **22°** | fiche produit |

Les deux premières sont des **contradictions internes** : un lecteur attentif
qui parcourt l'article voit deux chiffres différents pour le même produit.

### Le compteur de la gamme : 18 → la réalité

Le retrait de la gamme CBD a fait passer le catalogue de 18 à **15 références**,
mais le chiffre 18 est resté partout. Il était donc **faux sur tout le site**,
pas seulement dans le blog.

Chiffres de référence, calculés depuis `products.generated.json` :

| | Nombre |
|---|---|
| Références au catalogue | **15** |
| Liqueurs (hors coffret et flasque) | **13** |
| Proposées dans le configurateur de coffret | **11** |

Corrigé dans 15 endroits : 6 articles FR et EN, les deux pages 404, `llms.txt`,
le configurateur de coffret et la page `/composer-mon-coffret` — qui promettait
18 bouteilles au choix alors que la grille n'en affiche que 11.

### « Trois amis » → « Deux amis »

L'article s'intitule **« Deux amis, une brasserie »** et ne raconte que deux
fondateurs, Étienne et Guillaume. Quatorze fichiers annonçaient « Trois amis »
ou « Three friends » dans leurs liens et leurs pages 404.

### Anglicismes dans le texte français

« Trois amis, une **liqueur house** » — reste de la version anglaise, dans deux
articles français.

---

## 🟠 À trancher — 5 points

### 1. Le prix annoncé ne correspond pas à la boutique

`choisir-liqueur-artisanale-guide`, deuxième phrase de l'article :

> « Et à côté, des flacons à **35-45 €** signés par trois artisans dans un
> village de Haute-Loire — comme ceux que nous élaborons. »

Tes liqueurs sont à **16 à 22 €** en 70 cl. Seules les éditions limitées
montent à 50-70 €. Un lecteur qui arrive par cette page attend donc un prix
deux fois supérieur à la réalité — ou pense que tu parles d'une autre maison.

*Note : la phrase dit aussi « trois artisans », même problème que « Trois
amis » ci-dessus. Je ne l'ai pas touchée pour ne pas modifier un prix sans
ton accord.*

**Ma proposition** : « des flacons à 16-22 € signés par deux artisans ». Mais
c'est ton positionnement, pas le mien — dis-moi.

### 2. Un claim réglementaire sur toute la gamme

Même article :

> « Dans notre gamme, nous avons : des liqueurs au sens strict (…), **toutes
> au-dessus de 100 g/L de sucre**. »

C'est exactement le schéma du « sans arôme » : une affirmation vérifiable,
portant sur **l'ensemble** de la gamme, que je ne peux pas contrôler. Si une
seule référence passe sous le seuil, la phrase est fausse — et il s'agit d'une
définition réglementaire européenne.

**À confirmer ou à retirer.** Tant que ce n'est pas tranché, je laisse tel quel.

Accessoirement, cette liste n'a **qu'une seule puce** — elle en comptait
vraisemblablement une seconde pour la gamme CBD, supprimée avec elle.

### 3. « La verveine est présente dans 14 de nos liqueurs »

`plantes-liqueur-haute-loire`, version anglaise :

> « Present in 14 of our 18 liqueurs as a secondary note. »

J'ai corrigé le « 18 », mais **le « 14 » reste invérifiable** : les
compositions déclarées ne mentionnent la verveine que dans 3 recettes (Herbe
des Druides, Gorgeon des Machurés, et la finition fût de chêne). Elle peut
évidemment entrer en note secondaire ailleurs — je n'ai pas les recettes.

**Soit tu confirmes le chiffre, soit on écrit quelque chose de non chiffré**
(« présente en note secondaire dans plusieurs de nos recettes »).

### 4. La Flèche Ardente : 22° ou 27° ?

J'ai aligné l'article sur la fiche produit (**22°**). Mais la photo du 20 cl
montre une étiquette à **27°** — l'ancienne bouteille, qu'on écoule
volontairement. Un client qui a la petite bouteille en main lira 27° sur le
verre et 22° sur le site.

Ça ne me semble pas grave tant que le 70 cl est bien à 22°, mais je préfère
que tu le saches.

### 5. Le slug contredit le titre

L'URL est `/blog/trois-amis-une-brasserie` alors que l'article s'appelle
« **Deux** amis, une brasserie ». L'Actualité n'ayant jamais été publique,
le slug peut encore être renommé sans redirection — **mais seulement tant que
la section reste masquée**.

Même situation que `producteurs-partenaires-bio-velay`, signalé dans la revue
systématique. Je peux traiter les deux d'un coup si tu veux.

---

## Ce que je n'ai pas encore fait sur ce lot

La relecture **ligne à ligne du fond** — est-ce que l'argumentaire tient, est-ce
que les comparaisons avec Chartreuse, Suze et Salers sont justes et prudentes,
est-ce que le ton correspond à ce que tu veux dire. J'ai lu les deux premiers
articles en entier et parcouru les six autres à la recherche de faits
vérifiables.

Les articles 6 et 8 (`liqueur-gentiane-suze-salers-difference`,
`alternatives-artisanales-chartreuse-suze-benedictine`) **nomment des
concurrents et les comparent à nos produits**. C'est autorisé et c'est bon pour
le référencement, mais ce sont ceux qui mériteront ta lecture la plus attentive :
une comparaison inexacte sur une marque comme Chartreuse se remarque.

**Dis-moi si tu veux que j'enchaîne sur le lot 2** (les brèves d'actualité et
les recettes), ou que je reprenne ces 8 articles pour une lecture de fond.
