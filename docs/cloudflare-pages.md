# Cloudflare Pages — plan de repli (non retenu)

> ## ⛔ Décision finale du 21/09/2026 : **on reste sur Vercel.**
>
> Cette migration a été préparée puis **écartée** le jour même. Guillaume a
> arbitré en faveur de la simplicité : pas de zone DNS à déplacer, pas de
> risque sur les emails, pas de configuration à retraduire.
>
> **Ne pas exécuter les étapes 1 à 5 sans une nouvelle décision explicite.**
>
> Ce qui reste vrai et utile :
> - L'**étape 0 est faite et committée** — `public/_redirects` et
>   `public/_headers` sont générés à chaque build. Ils sont inertes sur Vercel,
>   qui les ignore. Basculer resterait donc une affaire d'heures, pas de jours.
> - Le script `verify-cloudflare-config.mjs` tourne au build et **protège le
>   plan de 301 quelle que soit la plateforme** : il a déjà attrapé 10 URL
>   manquantes. Le garder.
> - ⚠️ **Le motif qui a déclenché cette réflexion n'a PAS disparu** — voir
>   ci-dessous. Il est reporté en pré-requis de `docs/bascule-www.md`.

---

## Le problème d'origine, toujours ouvert

Le plan Vercel du compte est le plan gratuit (Hobby), dont les
conditions réservent l'usage à un cadre **personnel et non commercial**, et
citent explicitement comme interdits « toute méthode de demande ou de
traitement de paiement auprès des visiteurs » et « les transactions
e-commerce ». Vercel se réserve le droit de désactiver un projet Hobby **avec
ou sans préavis**. Tant que le site est sur `test.` en construction, le risque
est théorique ; le jour où `www.` encaisse des cartes, il ne l'est plus.

**La solution retenue est donc le passage en Vercel Pro (20 $/mois)**, à faire
avant que `www.` encaisse des cartes.

**Options comparées le 21/09/2026, toutes écartées :**

| Option | Coût | Pourquoi écartée |
|---|---|---|
| **Cloudflare Pages** | gratuit | Impose de déplacer la zone DNS (risque sur les emails) + retraduction de la config + zone grise sur les vidéos |
| **Railway** | usage facturé | Mauvais outil pour du statique : une seule région, bande passante facturée, serveur allumé en permanence pour servir des fichiers |
| **Hébergement IONOS** | déjà payé | Pas de CDN, pas de déploiement automatique, et surtout perte de l'isolation d'avec WordPress — un WP en panne emporterait la boutique |

---

## ⚠️ Si la migration est un jour relancée : rien en même temps que la bascule

Chacune des étapes ci-dessous est réversible et se valide seule. Le jour de la
bascule DNS, **tout doit déjà être en place et éprouvé depuis des jours**.
Deux inconnues simultanées, c'est une panne qu'on ne sait pas diagnostiquer.

---

## État d'avancement

- [x] **Étape 0 — traduction de `vercel.json`** ✅ fait le 21/09/2026
- [ ] Étape 1 — créer le projet Cloudflare Pages, le brancher sur GitHub
- [ ] Étape 2 — autoriser l'origine de test dans le plugin CORS WordPress
- [ ] Étape 3 — faire tourner `test.` sur Cloudflare une semaine
- [ ] Étape 4 — déplacer la zone DNS chez Cloudflare
- [ ] Étape 5 — bascule `www.` (voir `docs/bascule-www.md`)

---

## Étape 0 — traduction de `vercel.json` ✅

`vercel.json` reste le **fichier source**. Deux scripts en dérivent la config
Cloudflare, exécutés automatiquement au `prebuild` :

| Script | Rôle |
|---|---|
| `scripts/generate-cloudflare-config.mjs` | écrit `public/_redirects` et `public/_headers` |
| `scripts/verify-cloudflare-config.mjs` | rejoue les 44 redirections et **fait échouer le build** si une seule diverge |

Astro recopie les deux fichiers dans `dist/`, où Cloudflare Pages les lit.
Vercel les ignore : **les deux plateformes peuvent tourner en parallèle** sur
le même build, sans branche séparée. C'est ce qui rend la bascule réversible.

Ne pas éditer `public/_redirects` ni `public/_headers` à la main — ils sont
régénérés à chaque build. Modifier `vercel.json`, puis
`npm run generate:cloudflare`.

**Ce que le contrôle vérifie** (152 URL testées) :
- chaque règle de `vercel.json` est couverte, avec la même destination et le
  même code HTTP
- la forme **avec slash final** l'est aussi — c'est celle que WordPress publie
  et que Google a indexée. La première version du script l'avait ratée sur
  10 URL ; c'est le contrôle qui l'a trouvée.
- les limites Cloudflare sont respectées (52 règles exactes sur 2100 possibles,
  32 à joker sur 100)
- **23 pages vivantes du site ne sont capturées par aucune redirection** —
  garde-fou contre une règle trop large qui rendrait une page inaccessible

---

## Étape 1 — créer le projet

Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git →
dépôt `lbdp43/new-site-`, branche `main`.

| Réglage | Valeur |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | variable `NODE_VERSION` = `20` (ou plus) |

**Variables d'environnement à recopier depuis Vercel** (Production *et*
Preview) :

```
PUBLIC_WC_BASE_URL
PUBLIC_STRIPE_PUBLISHABLE_KEY
PUBLIC_STRIPE_ACCOUNT_ID
WC_CONSUMER_KEY          ← sinon le stock et les prix ne se synchronisent pas
WC_CONSUMER_SECRET
```

⚠️ Ne PAS définir `INDEXNOW_ENABLED` tant que la bascule `www.` n'est pas
faite — le script refuserait de toute façon un host `test.` ou `.pages.dev`,
mais autant ne pas le mettre.

⚠️ Sans `WC_CONSUMER_*`, `sync-wc-stock.mjs` ne plante pas : il conserve le
`wc-live.json` committé et sort en code 0. Le site se construira donc très
bien **avec un stock figé**, sans rien signaler. À vérifier explicitement.

---

## Étape 2 — CORS : autoriser l'origine de test

**C'est le piège de l'étape 3.** Le plugin `astro-cors` du WordPress
n'autorise aujourd'hui que :

```
https://test.labrasseriedesplantes.fr
http://localhost:4321
http://127.0.0.1:4321
```

Le premier déploiement Cloudflare arrive sur une URL en
`https://<projet>.pages.dev`. Depuis cette origine, **le panier et le paiement
échoueront** — la navigation semblera parfaite, mais tout appel à WooCommerce
sera bloqué par le navigateur. Symptôme : bouton « Ajouter au panier » sans
effet, erreur CORS dans la console.

Avant de tester quoi que ce soit de transactionnel, ajouter l'origine dans
`lbdp_astro_allowed_origins()` (`wordpress-plugin/astro-cors/astro-cors.php`)
et réuploader le plugin.

Astuce : brancher tout de suite un domaine personnalisé
`cf.labrasseriedesplantes.fr` (simple CNAME depuis IONOS, aucun besoin de
déplacer la zone) évite de devoir autoriser une URL `.pages.dev` jetable.

---

## Étape 3 — laisser tourner une semaine

Faire pointer `test.labrasseriedesplantes.fr` sur Cloudflare Pages (CNAME
depuis IONOS) et **laisser Vercel branché en parallèle** sur son URL propre.
Aucun basculement, juste deux copies qui tournent.

À valider avant de continuer :

- [ ] Les 114 pages s'affichent, FR et EN
- [ ] Le stock et les prix sont à jour (donc `WC_CONSUMER_*` sont bien lues)
- [ ] Une dizaine de redirections à la main, **avec et sans slash final** :
      `/shop/la-fleche-ardente`, `/shop/la-fleche-ardente/`,
      `/produit-categorie/quelque-chose`, `/cart`, `/my-account/`
- [ ] Les en-têtes de sécurité sont présents (onglet Réseau du navigateur)
- [ ] **Aucune erreur CSP en console** — c'est le point le plus sensible :
      une directive manquante casse Stripe silencieusement
- [ ] Ajout au panier → checkout → **un vrai paiement de 1-2 €**, puis
      remboursement depuis l'admin WooCommerce
- [ ] Le CMS `/admin/` s'authentifie et publie
- [ ] Le configurateur de coffret fonctionne (île React `client:load`)

---

## Étape 4 — déplacer la zone DNS chez Cloudflare

**L'étape à risque.** Nécessaire uniquement pour que l'apex
`labrasseriedesplantes.fr` fonctionne : Cloudflare exige que la zone soit chez
eux pour servir un domaine racine. Un sous-domaine seul se contente d'un CNAME.

1. Ajouter le domaine dans Cloudflare → il importe la zone existante
2. **Comparer ligne à ligne** avec la zone IONOS. En particulier les **MX**
   (emails) et les TXT (SPF, DKIM, vérifications Google). Un enregistrement
   oublié = du courrier perdu, et on ne s'en aperçoit pas tout de suite.
3. Changer les serveurs de noms chez IONOS
4. Attendre la propagation, **vérifier l'envoi ET la réception d'un email**
5. Ne toucher à rien d'autre pendant 48 h

À ce stade, `www.` pointe toujours sur WordPress. Rien n'a changé pour les
visiteurs.

---

## Étape 5 — bascule `www.`

Voir `docs/bascule-www.md`, avec ces adaptations :

- Dans le projet Pages, ajouter **`www.labrasseriedesplantes.fr` en premier**.
  Le premier domaine ajouté devient le domaine principal et Cloudflare
  redirige automatiquement les suivants vers lui — donc l'apex vers `www.`,
  ce qui est exactement la décision du 21/09/2026.
- Ajouter ensuite `labrasseriedesplantes.fr`.
- Le plugin CORS doit autoriser `www.` **et** l'apex.

---

## Le `noindex` de `test.` — à recréer en Transform Rule

`vercel.json` pose `X-Robots-Tag: noindex, nofollow` uniquement quand l'hôte
est `test.labrasseriedesplantes.fr`. Le format `_headers` de Cloudflare **ne
sait pas conditionner par nom d'hôte** : cette règle est la seule qui ne se
traduit pas, et le script la signale en tête du fichier généré plutôt que de
la perdre en silence.

À recréer dans le tableau de bord (gratuit) :

> Rules → Transform Rules → **Modify Response Header** → Create
> - **Nom** : `noindex hors production`
> - **Si** : `Hostname` *is in* `test.labrasseriedesplantes.fr`,
>   `cf.labrasseriedesplantes.fr` — et cocher aussi `Hostname` *contains*
>   `.pages.dev` pour couvrir les prévisualisations par branche
> - **Alors** : *Set static* → `X-Robots-Tag` = `noindex, nofollow`

⚠️ **À faire AVANT de brancher le moindre domaine de test**, sinon Google
indexe une copie du site et on se retrouve avec du contenu dupliqué — le
problème exact que cette règle existe pour éviter.

---

## Points de vigilance

**Les vidéos.** Les conditions de Cloudflare découragent l'hébergement de
vidéos sur l'offre gratuite. Le site en compte 9, 28 Mo au total, la plus
lourde à 7,9 Mo (`lbdp-pro.mp4`). C'est modeste pour une vitrine, mais c'est
apprécié à leur discrétion. Si Cloudflare tique un jour, la réponse est
Cloudflare Stream ou un hébergeur vidéo tiers — pas un retour en arrière.

**Le CSP.** C'est le réglage le plus fragile de la migration : il est identique
mot pour mot à celui de Vercel, mais il doit être vérifié en conditions
réelles, console ouverte, **après un vrai paiement**. Une directive absente
casse Stripe sans message clair.

**Ne pas supprimer le projet Vercel** avant plusieurs semaines de
fonctionnement sur Cloudflare. Il reste le plan de repli : `vercel.json` est
toujours la source de vérité, donc un retour en arrière est une simple
manipulation DNS.
