# CMS admin — guide utilisateur

**URL d'accès** : `https://www.labrasseriedesplantes.fr/admin/` (ou
`https://test.labrasseriedesplantes.fr/admin/` pour tester avant la bascule).

Le CMS permet à toute personne de l'équipe (ayant un compte GitHub autorisé
sur le repo) de **créer, éditer et publier des articles de blog** sans
toucher au code. Chaque publication crée un commit qui déclenche un redeploy
Vercel automatique — l'article est en ligne dans les 60-90 secondes.

---

## Première connexion (5 minutes)

### 1. Avoir un compte GitHub

Si tu n'en as pas encore : [github.com/signup](https://github.com/signup).
Tu peux utiliser ton email `@labrasseriedesplantes.fr` ou gmail.

### 2. Être invité au repo

Guillaume (admin) doit t'ajouter comme collaborateur sur
[github.com/lbdp43/new-site-/settings/access](https://github.com/lbdp43/new-site-/settings/access).

Tu reçois une invitation par mail → **accepte**.

### 3. Se connecter au CMS — 2 méthodes

Sur la page `/admin/`, tu as 2 boutons de connexion. **La méthode "Access Token"
est plus fiable** pour notre setup Vercel, on la recommande.

#### ✅ Méthode A : "Sign In Using Access Token" (recommandée)

1. Ouvre un nouvel onglet : [github.com/settings/tokens/new](https://github.com/settings/tokens/new?scopes=repo&description=Sveltia%20CMS%20La%20Brasserie%20des%20Plantes)
   - Le lien ci-dessus pré-remplit le scope correct (`repo`) et le nom.
   - Si tu y vas manuellement : **Personal Access Tokens → Tokens (classic) → Generate new token (classic)**.
2. **Note** : `Sveltia CMS La Brasserie des Plantes`
3. **Expiration** : 1 an (ou `No expiration` si tu ne veux pas t'en soucier)
4. **Scope** : coche uniquement `repo` (contrôle total des repos privés — nécessaire pour commit)
5. Clic **Generate token** en bas. GitHub affiche un token qui commence par `ghp_…`. **Copie-le immédiatement** (il ne sera plus affiché après).
6. Retourne sur `/admin/`, clic **Sign In Using Access Token**, colle ton token, valide.
7. Tu es connecté. Le token est stocké en localStorage de ton navigateur — la prochaine fois tu n'auras pas besoin de le ressaisir (tant que tu n'effaces pas tes données navigateur).

⚠️ **Sécurité du token** : ne le partage avec personne. Si tu le perds ou si un ordinateur est volé, révoque-le depuis [github.com/settings/tokens](https://github.com/settings/tokens) et crée-en un nouveau.

#### ⚠️ Méthode B : "Sign In with GitHub" (bouton bleu)

Cette méthode utilise un **proxy OAuth hébergé gratuitement par Sveltia**
(`auth.sveltia.app`). Elle devrait fonctionner, mais elle dépend d'un service
tiers qu'on ne contrôle pas. Si elle tombe ou affiche une erreur "Not Found",
bascule sur la Méthode A.

---

## Créer un nouvel article

1. Clic sur la collection **Articles — FR** (ou **Articles — EN** pour
   l'anglais) dans la sidebar gauche.
2. Clic **New Article FR** (en haut à droite).
3. Remplis les champs :
   - **Titre** : doit contenir le mot-clé principal (ex: *"Verveine du Velay :
     notre plante signature"*).
   - **Description (meta SEO)** : 120-160 caractères. C'est ce que Google
     affiche sous le titre dans les résultats. Il faut que ça donne envie de
     cliquer.
   - **Date de publication** : aujourd'hui par défaut.
   - **Auteur** : choisis dans la liste.
   - **Image de couverture** : ratio 16:9, 1920×1080 idéal. Upload directement
     ou lien depuis une image déjà dans `public/images/`.
   - **Catégorie** : l'une des 5 fixées (Plantes, Recettes, Terroir,
     Fabrication, Actualité). Pas d'ajout possible sans modifier le code.
   - **Temps de lecture** : *"5 min"*, *"3 min"* etc. Estime à la louche
     (200 mots = 1 min).
   - **Contenu** : éditeur Markdown — titres `##`, **gras**, _italique_,
     listes, liens, images. Tu peux basculer en mode "Raw" si tu es à
     l'aise avec Markdown.
4. Clic **Save** (en haut à droite) → le brouillon est gardé sans
   publication.
5. Quand tu es prêt : clic **Publish now**. Le CMS fait un commit sur la
   branche `main` avec le message *"Create Article FR …"*. Vercel redeploy
   automatiquement — ton article est en ligne dans 90s.

---

## Éditer un article existant

1. Collection → clique sur l'article dans la liste.
2. Modifie → **Save** ou **Publish**.
3. Le commit a pour message *"Update Article FR …"*.

---

## Supprimer un article

Dans la liste → clique sur l'article → bouton **Delete** en haut à droite.
Le fichier `.md` est supprimé par un commit sur `main`.

**⚠️ Attention** : si l'article était indexé par Google, son URL va
retourner une 404. Pour un SEO propre, mieux vaut :
- soit le **dépublier** en changeant la date de publication dans le futur
  (jamais affiché tant que la date n'est pas atteinte),
- soit rédiger un **successeur** et ajouter une redirection dans `vercel.json`.

---

## Markdown — cheatsheet express

```md
# Titre H1 (déjà utilisé par le titre de l'article — ne pas refaire)

## Sous-titre H2

### Sous-sous-titre H3

**Gras** et _italique_

- Liste
- à puces

1. Liste
2. numérotée

[Lien vers notre histoire](/notre-histoire)

![Légende de l'image](/images/blog/ma-photo.jpg)

> Citation en bloc — style "épigraphe".

---

Ligne horizontale (comme ci-dessus — 3 tirets).
```

---

## Conseils SEO rapides

1. **Longueur** : viser 800-1500 mots pour un article "substantiel". Sous
   400 mots, Google considère ça comme "thin content".
2. **Maillage interne** : 2-3 liens vers d'autres pages du site (fiche
   produit, autre article, page terroir…). Utilise toujours le chemin
   relatif commençant par `/` (ex: `/boutique/alchimie-vegetale`), pas
   l'URL complète.
3. **Image couverture** : nom de fichier descriptif (ex:
   `verveine-parcelle-saint-didier.jpg`, pas `IMG_1234.jpg`). Alt text
   automatique depuis le champ "Légende".
4. **Titre H2 avec mot-clé secondaire** : aide Google à comprendre la
   structure.
5. **Un seul article par semaine maximum** : mieux vaut 4 articles de
   qualité par mois que 20 bâclés.

---

## Troubleshooting

### "Login with GitHub" me renvoie une erreur 404 ou 500

Le proxy Sveltia (`auth.sveltia.app`) est peut-être momentanément down.
Réessaye dans 5 minutes. Si persistant, utiliser le workaround PagesCMS
(voir ci-dessous).

### Je publie mais l'article n'apparaît pas

1. Vérifie que Vercel a bien rebuild : [vercel.com](https://vercel.com) →
   projet → dernier déploiement doit être < 2 minutes.
2. Vide le cache du navigateur (Cmd+Shift+R).
3. Si le déploiement Vercel a échoué, ouvre les logs : une erreur de
   validation du schema Zod a peut-être bloqué le build. Message type :
   *"Invalid frontmatter: category must be one of..."*.

### Je vois mon édition dans le CMS mais l'article n'est pas créé

Le CMS a échoué silencieusement à commit. Rafraîchis la page → re-login.
Vérifie sur [github.com/lbdp43/new-site-/commits/main](https://github.com/lbdp43/new-site-/commits/main)
si ton commit est là.

### Workaround de secours : PagesCMS

Si Sveltia CMS ne fonctionne pas (rare), on peut utiliser
[pagescms.org](https://pagescms.org) comme alternative :
1. Connecte-toi sur pagescms.org avec GitHub.
2. Sélectionne le repo `lbdp43/new-site-`.
3. Edite les fichiers dans `src/content/blog/` directement.

Fonctionne identiquement (c'est juste une autre interface sur les mêmes
fichiers Git).

---

## Limites actuelles

- **Que le blog est éditable** via ce CMS. Les fiches produit, la page
  "Notre histoire", les traductions UI, etc. nécessitent toujours une
  modification de code. Phase 2 à prévoir si nécessaire.
- **Pas de preview avant publication** pour l'instant — tu publies direct.
  Si tu veux un système brouillon → relecture → merge, activer
  `publish_mode: editorial_workflow` dans `/admin/config.yml` (nécessite
  une branche dédiée et un workflow PR).
- **Les images uploadées** atterrissent dans `public/images/blog/`. Si tu
  en mets beaucoup, le repo grossit — on peut basculer sur un CDN d'images
  externe (Cloudinary, Vercel Blob) plus tard.

---

## Pour l'admin technique

- Config CMS : `public/admin/config.yml`
- Interface : `public/admin/index.html` (script Sveltia chargé via unpkg)
- Schema de validation : `src/content.config.ts` (Zod)

À chaque ajout de champ ou catégorie dans `content.config.ts`, il faut
miroiter dans `config.yml` pour que le CMS sache quoi afficher.
