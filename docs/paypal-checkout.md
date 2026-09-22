# PayPal sur le checkout Astro — cadrage

**Décision Guillaume, 22/09/2026 : « les clients utilisent PayPal souvent ».**

PayPal passe donc d'un arbitrage à un **point bloquant de la bascule `www.`**.
On ne peut pas basculer un site marchand en supprimant au passage un moyen de
paiement que les clients utilisent réellement.

---

## Ce qu'on sait déjà (vérifié)

**Côté WooCommerce**, deux moyens de paiement sont actifs. Relevé le
21/09/2026 sur `/wp-json/wc/store/v1/cart` :

```json
"payment_methods": ["woocommerce_payments", "ppcp"]
```

**L'extension est `pymntpl-paypal-woocommerce`** (« Plugins de paiement pour
PayPal WooCommerce », par Payment Plugins), **version 2.0.27** — confirmé le
22/09/2026 via `wp_list_plugins`.

**✅ Le signal décisif** : la réponse du panier contient un bloc
`extensions.wc_ppcp` :

```json
"extensions": {
  "wc_ppcp": {
    "needsSetupToken": false,
    "cart": { "total", "totalCents", "needsShipping", "currency",
              "countryCode", "availablePaymentMethods", "lineItems",
              "shippingOptions", "selectedShippingMethod" },
    "fastlane": { "features": [...], "fastlane_flow": "email_detection", ... }
  }
}
```

Une extension ne publie des données dans `extensions` de la Store API que si
elle **s'est enregistrée explicitement auprès d'elle** (`ExtendSchema`). Autrement
dit : **ce plugin sait parler au checkout Blocks / Store API**, celui-là même
que le site Astro utilise. C'est exactement la condition qui rend une
intégration headless réaliste plutôt qu'un bricolage.

Fastlane et la détection d'e-mail sont activés côté plugin.

### Passerelles PayPal : une seule est active

Relevé le 22/09/2026 via `wp_wc_list_payment_gateways` :

| ID | Titre | Activée |
|---|---|---|
| `ppcp` | PayPal | ✅ **oui** |
| `ppcp_card` | Credit/Debit Cards | non |
| `ppcp_googlepay` | Google Pay | non |
| `ppcp_applepay` | Apple Pay | non |

Il n'y a donc **qu'une seule passerelle PayPal à intégrer** : `ppcp`. Les
wallets Apple/Google Pay continuent de passer par WooPayments côté carte, il
n'y a pas de doublon à arbitrer.

ℹ️ Au passage : **SumUp est bien installé mais désactivé** comme passerelle
(`sumup`, `enabled: false`). Il n'est donc pas un sujet pour la bascule —
point d'interrogation levé, il figurait comme « à vérifier » dans `CLAUDE.md`.

---

## 🔍 Ce que deux vraies commandes PayPal nous apprennent

Lues le 22/09/2026 via le MCP WooCommerce (`wp_wc_get_order`) : commandes
**#26042** (09/09, 70,00 €) et **#25926** (06/09, 70,00 €).

### Champs de la commande

```
payment_method       = "ppcp"
payment_method_title = "PayPal - ccomcecile@free.fr"   ← e-mail du payeur
transaction_id       = "5KY21287UR815640M"             ← ID de CAPTURE PayPal
created_via          = "checkout"
date_paid            = +3 s après date_created
status               = processing → completed
```

### Métadonnées posées par le plugin

| Clé | Exemple | Ce que ça dit |
|---|---|---|
| `_ppcp_paypal_order_id` | `26D99705JH087882R` | ID de **commande** PayPal |
| `_ppcp_environment` | `production` | le plugin tourne en live |
| `_paypal_fee` | `2.38` | commission PayPal |
| `_paypal_net` | `67.62` | net encaissé |

### Notes de commande générées

```
Commande PayPal 26D99705JH087882R créée. ID de capture : 5KY21287UR815640M
Paiement via PayPal - ccomcecile@free.fr (5KY21287UR815640M).
```

### 🎯 Ce qu'on en déduit sur la forme du tunnel

Deux identifiants distincts coexistent : un **ID de commande** PayPal et un
**ID de capture**. La note dit « commande créée, ID de capture : … » dans le
même souffle, et `date_paid` tombe 3 secondes après la création de la commande
WooCommerce.

Conclusion : **le front fait approuver une commande PayPal par le client, puis
transmet son identifiant à WooCommerce, qui déclenche la capture côté
serveur.** Le front n'a jamais à capturer lui-même. C'est cohérent avec le fait
que la commande arrive directement en « En cours », frais PayPal déjà
enregistrés — un front qui capturerait lui-même laisserait la commande WC
désynchronisée.

C'est la bonne nouvelle : la dernière étape reste un simple
`POST /wc/store/v1/checkout` avec `payment_method: "ppcp"` et l'ID de commande
PayPal dans `payment_data`. La même mécanique que la carte.

### ✅ Effet de bord : Checkout Field Editor ne pose pas de problème

`CLAUDE.md` listait l'extension **Checkout Field Editor 2.2.0** comme risque
pour la bascule : si elle avait ajouté des champs **obligatoires**, le checkout
Astro ne les enverrait pas et les commandes seraient refusées.

Les `meta_data` de quatre commandes récentes passées par le checkout WordPress
(#26042, #26012, #25953, #25926) ne contiennent **aucun champ personnalisé** :
uniquement `is_vat_exempt`, l'attribution WooCommerce, les métadonnées de
paiement, les notifications et le suivi GA. Aucun `_billing_*` ni `_shipping_*`
ajouté.

**L'extension est active mais ne collecte aucun champ supplémentaire.** Le
risque est levé — à re-vérifier seulement si quelqu'un touche à ses réglages.

---

## ✅ Les routes REST du plugin — relevées le 22/09/2026

Namespace : **`wc-ppcp/v1`** (plus un `wc-ppcp/v1/admin` réservé au back-office).
Relevé par Guillaume sur `/wp-json/` puis `/wp-json/wc-ppcp/v1`.

| Route (POST sauf mention) | Args obligatoires | Lecture |
|---|---|---|
| `/wc-ppcp/v1/checkout-validation` | — | valide les champs du formulaire **avant** d'ouvrir PayPal |
| `/wc-ppcp/v1/cart/order` | `payment_method` | **crée la commande PayPal** depuis le panier → renvoie son ID |
| `/wc-ppcp/v1/cart/checkout` | `payment_method` | **finalise** : crée la commande WooCommerce et capture |
| `/wc-ppcp/v1/cart/item` (POST/PUT/PATCH/DELETE) | `payment_method`, ou `key` au DELETE | boutons express (fiche produit / panier) |
| `/wc-ppcp/v1/cart/shipping` (POST/PUT/PATCH) | `payment_method` | applique l'adresse de livraison renvoyée par PayPal |
| `/wc-ppcp/v1/cart/billing` | `payment_method` | idem pour la facturation |
| `/wc-ppcp/v1/cart/refresh` | — | recalcule le panier |
| `/wc-ppcp/v1/cart/order-update-callback` | **`cart_token`** | callback serveur→serveur de PayPal quand le client change d'adresse |
| `/wc-ppcp/v1/order/pay` | `payment_method`, `order_id` | payer une commande WooCommerce **déjà créée** |
| `/wc-ppcp/v1/vault/setup-tokens`, `/vault/payment-tokens`, `/billing-agreement/token/…` | variable | moyens de paiement enregistrés |
| `/wc-ppcp/v1/webhook/{environment}` | — | webhooks PayPal entrants |

### 🎯 Deux enseignements majeurs

**1. Le plugin a son PROPRE tunnel, parallèle à la Store API.** `cart/order`
puis `cart/checkout` suffisent à aller du panier à la commande payée sans
jamais toucher `/wc/store/v1/checkout`. Deux architectures sont donc
possibles pour Astro, et **le relevé réseau tranchera** :

- **A** — `cart/order` → approbation PayPal → `cart/checkout` : tout se joue
  dans le namespace du plugin. Plus d'inconnue sur `payment_data`, puisqu'on
  ne s'en sert pas.
- **B** — `cart/order` → approbation PayPal → `POST /wc/store/v1/checkout`
  avec `payment_method: "ppcp"` et l'ID dans `payment_data`. C'est le chemin
  que le checkout Blocks emprunterait.

**2. `order-update-callback` prend un `cart_token`.** C'est le même jeton que
celui que le front Astro stocke déjà en `localStorage` et renvoie en en-tête
`Cart-Token`. **Le plugin raisonne donc en session de panier Store API**, pas
en cookie de session PHP. C'est le signal le plus encourageant du relevé :
une intégration headless ne se bat pas contre l'architecture du plugin, elle
s'y branche.

⚠️ L'introspection REST ne liste que les arguments **obligatoires** déclarés.
Elle ne dit ni la forme complète des corps de requête, ni celle des réponses.
Le relevé réseau reste indispensable.

### Réglages du plugin observés le 22/09/2026

Relevés sur `wp-admin` → WooCommerce → Réglages → Paiements →
« Passerelle PayPal par Payment Plugins » → **Paramètres de l'API** :

| Réglage | Valeur |
|---|---|
| Environnement | **production** (un mode *sandbox* existe dans la liste déroulante) |
| Connexion PayPal | Connecté ✅ |
| Webhook | Créé ✅ — ID `2R08013951191004F` |
| URL du webhook | `https://labrasseriedesplantes.fr/wp-json/wc-ppcp/v1/webhook/production` |
| Admin Only Mode | décoché |
| **Débogage activé** | **coché** ✅ |

Trois conséquences :

1. **L'URL du webhook confirme le namespace** `wc-ppcp/v1` relevé plus haut.
2. **Le débogage est actif** → le plugin écrit un journal dans
   WooCommerce → État → **Journaux**. Il contient potentiellement les
   échanges réels avec PayPal, donc une partie de ce qu'on cherche, **sans
   rien avoir à payer**. ⚠️ Ces journaux contiennent des données clients
   (noms, e-mails, adresses) et parfois des jetons : ne jamais les coller
   en entier, extraire seulement les lignes utiles.
3. 🎯 **Un mode sandbox existe.** Ça rouvre la question du test final :
   le backlog prévoyait « une vraie commande de 1-2 € puis remboursement ».
   Une bascule temporaire en sandbox permettrait de tester sans argent réel
   — mais elle s'applique **à tout le site**, donc elle couperait PayPal
   pour les vrais clients pendant la durée du test. **Arbitrage à rendre
   par Guillaume le moment venu**, pas une décision technique.

⚠️ **L'« ID client production » est tronqué à l'écran** par la largeur du
champ : la capture n'en montre que le début. Il reste à relever en entier —
le plus fiable étant l'URL `paypal.com/sdk/js` côté navigateur, qui le porte
tel que le front l'utilise vraiment.

⚠️ **Ne jamais copier la « Clé secrète production »**, ni capturer cette page
lorsqu'elle est révélée. WordPress la masque par défaut ; elle doit rester
côté serveur. Elle n'est d'aucune utilité au front Astro.

### ✅ Le SDK PayPal — URL relevée le 22/09/2026

Relevée dans l'onglet Réseau du checkout WordPress :

```
https://www.paypal.com/sdk/js
  ?client-id=AeaxgVz2Vfk81PcRSvufUnHeDT-XdqMktlP8KhnLARufYhUrQu4FK-L2p9C1PtJoOB1Q1kpgNS9cr5MI
  &intent=capture
  &commit=true
  &components=buttons,messages,card-fields,googlepay,applepay
  &currency=EUR
  &enable-funding=paylater
```

C'est la valeur à poser dans `PUBLIC_PAYPAL_CLIENT_ID`. **Clé publique** :
elle est servie à tout visiteur du site dans le code de la page, au même
titre que la clé publique Stripe déjà documentée dans `CLAUDE.md`.

Ce que chaque paramètre nous apprend :

| Paramètre | Valeur | Conséquence |
|---|---|---|
| `intent` | `capture` | le paiement est **encaissé immédiatement**, pas seulement autorisé. Cohérent avec les commandes observées (payées 3 s après création). |
| `commit` | `true` | le bouton PayPal affiche « Payer maintenant » : le client valide définitivement **chez PayPal**, pas au retour sur le site. |
| `currency` | `EUR` | pas de multi-devise à gérer. |
| `components` | `buttons,messages,card-fields,googlepay,applepay` | le SDK charge plus que le bouton, mais seules les passerelles **activées** comptent, et `ppcp` est la seule. |
| `enable-funding` | `paylater` | 💡 **PayPal Pay Later (paiement en plusieurs fois) est activé.** Le reproduire côté Astro, sinon la bascule retire une facilité de paiement offerte aujourd'hui. |

⚠️ **Aucun `merchant-id`** dans l'URL : c'est un compte marchand direct, pas
une intégration de plateforme. Ça simplifie le front Astro — rien d'autre à
transmettre que le `client-id`.

### 🎯 `cart/order` disséqué — relevé le 22/09/2026

Le relevé réseau du checkout WordPress donne la requête complète.

**L'appel ne vise PAS `/wp-json/` directement.** Il passe par le tunnel AJAX
de WooCommerce :

```
POST /?wc-ajax=wc_ppcp_frontend_request
     &path=%2Fwc-ppcp%2Fv1%2Fcart%2Forder
     &_locale=user
```

`path` décodé vaut `/wc-ppcp/v1/cart/order`. L'initiateur est
`api-fetch.min.js` : le plugin utilise `@wordpress/api-fetch` avec un
middleware qui réécrit les chemins REST en `?wc-ajax=…`. **Raison d'être du
tunnel** : `wc-ajax` démarre la session WooCommerce (le cookie qui dit quel
panier appartient au visiteur) avant de traiter la requête.

**Corps de la requête** — c'est le formulaire de commande WooCommerce
classique, à plat :

```
payment_method:            "ppcp"
context:                   "checkout"
ppcp_paypal_order_id:      ""      ← 🔑 vide à la création
ppcp_billing_token:        ""
ppcp_payment_token:        ""
ppcp_payment_token_nonce:  ""
billing_first_name/last_name/company/address_1/address_2/
  city/postcode/state/country/email/phone   (vides ici)
shipping_* (mêmes champs)
ship_to_different_address: "1"
shipping_method[0]:        "flat_rate:4"
order_comments:            ""
woocommerce-process-checkout-nonce: "53f4acf6ce"   ← ⚠️
wc_order_attribution_*     (une vingtaine de champs de traçage)
_wp_http_referer:          "/?wc-ajax=update_order_review"
```

**Réponse** (HTTP 200, 0,9 ko) — une simple chaîne JSON :

```json
"3Y617367DX331090K"
```

C'est l'ID de commande PayPal, au même format que le `_ppcp_paypal_order_id`
des commandes réelles. **Rien d'autre.**

#### Quatre enseignements

1. 🔑 **Le nom de la clé est `ppcp_paypal_order_id`.** Il apparaît en clair
   dans le formulaire, vide à la création : c'est donc lui qui portera l'ID
   approuvé à la finalisation. C'était la dernière inconnue de fond.
2. **Les champs sont au format checkout classique** (`billing_first_name`…),
   pas au format Store API (`billing_address: {…}`). Deux conventions
   différentes à réconcilier côté Astro.
3. ⚠️ **Un `woocommerce-process-checkout-nonce` est transmis.** C'est le nonce
   du formulaire de commande classique, généré au rendu de la page WordPress.
   **Le front Astro n'a aucun moyen évident de l'obtenir** — c'est le nouvel
   obstacle, et il remplace celui qu'on vient de lever.
4. **La création réussit avec un formulaire vide.** Tous les champs d'adresse
   étaient vides et la route a quand même renvoyé un ID : la validation
   stricte se fait ailleurs (probablement `checkout-validation`), pas ici.

#### Ce que ça implique pour Astro

Le tunnel `wc-ajax` s'appuie sur le **cookie de session WooCommerce**. Le
front Astro, lui, identifie son panier avec un **`Cart-Token`** en en-tête.
Passer par ce tunnel depuis Astro ferait voir au plugin un panier vide — ou,
pire, celui d'un autre visiteur.

D'où **la question qui décide de tout**, et qui se teste en une ligne de
console (cf. « Test décisif » plus bas) : **la route REST
`/wp-json/wc-ppcp/v1/cart/order` accepte-t-elle un `Cart-Token`, et
exige-t-elle vraiment le nonce ?**

Un indice sérieux plaide pour oui sur le premier point :
`cart/order-update-callback` prend explicitement un `cart_token` en
paramètre. Le plugin sait donc raisonner en jetons de panier Store API, pas
seulement en cookies.

Trois issues possibles, de la meilleure à la pire :

| Issue | Conséquence |
|---|---|
| **A** — la route accepte `Cart-Token` et ignore le nonce | 🟢 intégration directe, rien à installer côté WordPress |
| **B** — elle accepte `Cart-Token` mais exige le nonce | 🟡 il faut exposer le nonce ; notre plugin `astro-cors` existe déjà et peut le faire en quelques lignes |
| **C** — elle n'accepte que le cookie de session | 🟠 il faut un petit relais côté WordPress, toujours dans `astro-cors` |

**Aucune de ces issues n'est bloquante** — c'est la vraie nouvelle. Le pire
scénario demande une dizaine de lignes dans une extension qu'on maintient
déjà.

---

## 🧪 Test décisif — à lancer dans la console (aucun paiement)

À exécuter sur **`https://test.labrasseriedesplantes.fr`**, avec au moins un
article dans le panier Astro, dans la console du navigateur (F12 →
**Console**) :

```js
const token = localStorage.getItem('lbdp_cart_token');
const r = await fetch(
  'https://www.labrasseriedesplantes.fr/wp-json/wc-ppcp/v1/cart/order',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cart-Token': token },
    body: JSON.stringify({ payment_method: 'ppcp', context: 'checkout' }),
  },
);
console.log(r.status, await r.text());
```

**C'est sans risque** : créer une commande PayPal ne débite rien et n'engage
personne. Une commande non approuvée expire d'elle-même. Aucune commande
WooCommerce n'est créée à cette étape.

### ✅ Résultat — exécuté le 22/09/2026

```
Jeton : eyJhbGciOiJIUzI1NiIs…
Store API → 200 | articles : 1 | total : 5500
PPCP      → 200 | application/json; charset=UTF-8 | corps : ""
```

**Verdict : issue C.** Le même `Cart-Token` renvoie un panier complet sur la
Store API et **rien** sur la route PayPal. Pas de 403, pas d'erreur CORS, pas
de plainte sur le nonce : un 200 avec un corps vide.

Le plugin **ignore le `Cart-Token`** : il cherche la session WooCommerce dans
un cookie, n'en trouve pas (le front Astro est sur un autre domaine, les
cookies ne le suivent pas), et abandonne silencieusement.

ℹ️ Le nonce n'est donc **pas** l'obstacle immédiat — le plugin sort avant
d'en arriver là. Il pourra le redevenir une fois la session résolue.

---

## 🌉 Le pont de session — `astro-cors` 1.3.0

WooCommerce **sait** lire le `Cart-Token` : il installe pour ça un
gestionnaire de session dédié… mais uniquement sur ses propres routes
`/wc/store/*`. Les routes `wc-ppcp` n'en bénéficient pas.

La correction tient en deux hooks, ajoutés à
`wordpress-plugin/astro-cors/astro-cors.php` :

1. `woocommerce_session_handler` → installe le gestionnaire Store API
   (`Automattic\WooCommerce\StoreApi\SessionHandler`) sur les routes
   `wc-ppcp` ;
2. `rest_api_init` → charge le panier (`wc_load_cart()`), ce que le tunnel
   `wc-ajax` faisait tout seul mais que le REST direct ne fait pas.

### Pourquoi c'est sans danger pour le WordPress actuel

**Tout est conditionné à la présence de l'en-tête `Cart-Token`.** Un
visiteur normal du site WordPress n'en envoie jamais — seul le front Astro
le fait. Les deux hooks sortent immédiatement pour tout le reste : le tunnel
de commande WordPress n'est pas modifié d'un iota.

Le nom de classe est protégé par un `class_exists()` : si WooCommerce le
renomme un jour, on retombe sur le gestionnaire par défaut. PayPal cesserait
de fonctionner côté Astro — visible et réparable — plutôt que de provoquer
une erreur fatale sur tout le site.

⚠️ **Écrit sans pouvoir être testé** (l'environnement de dev ne joint pas le
WordPress). La syntaxe est vérifiée (`php -l` passe), donc pas de risque
d'erreur fatale au téléversement, mais le comportement reste à confirmer.

### ✅ VÉRIFIÉ EN PRODUCTION — 22/09/2026

`astro-cors` 1.3.0 installé sur le WordPress live, test console rejoué depuis
`test.labrasseriedesplantes.fr` :

```
PPCP → 200 | corps : "36L47978HU4613710"
```

**Le pont fonctionne.** Une vraie commande PayPal est créée depuis le front
Astro avec le seul `Cart-Token` — sans cookie de session, et **sans
`woocommerce-process-checkout-nonce`**.

Trois conclusions :

1. L'approche headless est **validée sur le terrain**, plus seulement en
   théorie.
2. Le nonce n'est **pas** exigé sur `cart/order`. Il pourrait encore l'être à
   la finalisation — à vérifier le moment venu.
3. Un corps minimal suffit : `{ payment_method: "ppcp", context: "checkout" }`.
   Les dizaines de champs du formulaire classique (`billing_*`, `shipping_*`,
   attribution…) ne sont **pas** nécessaires à cette étape.

En cas de souci : désactiver l'extension suffit à tout remettre en état, le
site WordPress n'en dépend pas.

---

## 🧪 Sonde A/B — trancher la finalisation sans payer

**Le principe** : créer une commande PayPal (donc **non approuvée**, le client
n'est jamais passé chez PayPal), puis tenter de finaliser avec elle via la
Store API. PayPal **refusera forcément** la capture d'une commande non
approuvée — mais la façon dont il refuse nous dit si le chemin est le bon.

**Pourquoi c'est sans risque** : une commande PayPal au statut `CREATED` est
**techniquement incapturable**. Aucun argent ne peut bouger. Au pire,
WooCommerce laisse une commande en brouillon ou en échec, qu'il suffit de
supprimer.

```js
const token = localStorage.getItem('lbdp_cart_token');
const nonce = localStorage.getItem('lbdp_wc_nonce');
const H = { 'Content-Type': 'application/json', 'Cart-Token': token };
if (nonce) H['Nonce'] = nonce;

// 1) Commande PayPal, non approuvée
const o = await fetch('https://www.labrasseriedesplantes.fr/wp-json/wc-ppcp/v1/cart/order', {
  method: 'POST', headers: H,
  body: JSON.stringify({ payment_method: 'ppcp', context: 'checkout' }),
});
const paypalOrderId = JSON.parse(await o.text());
console.log('Commande PayPal :', paypalOrderId);

// 2) Tentative de finalisation — chemin B (Store API)
const addr = {
  first_name: 'Test', last_name: 'Sonde', company: '',
  address_1: '1 rue de la Brasserie', address_2: '',
  city: 'Saint-Didier-en-Velay', state: '', postcode: '43140',
  country: 'FR', email: 'REMPLACE@PAR-TON-EMAIL.fr', phone: '0600000000',
};
const c = await fetch('https://www.labrasseriedesplantes.fr/wp-json/wc/store/v1/checkout', {
  method: 'POST', headers: H,
  body: JSON.stringify({
    billing_address: addr,
    shipping_address: addr,
    payment_method: 'ppcp',
    payment_data: [
      { key: 'payment_method', value: 'ppcp' },
      { key: 'ppcp_paypal_order_id', value: paypalOrderId },
    ],
  }),
});
console.log('Store API checkout →', c.status, await c.text());
```

### Comment lire le refus

| Réponse | Lecture |
|---|---|
| Erreur mentionnant **PayPal / capture / `ORDER_NOT_APPROVED`** | 🟢 **Chemin B validé.** La clé est lue, la passerelle est appelée — il ne manquait que l'approbation du client. C'est exactement le comportement attendu |
| **« Passerelle de paiement non valide »** ou équivalent | 🔴 La Store API ne connaît pas `ppcp` → il faut passer par le chemin **A** (`/wc-ppcp/v1/cart/checkout`) |
| Erreur de **nonce** | Le nonce est exigé à la finalisation (pas à la création) — à traiter, mais le chemin reste bon |
| Erreur de **validation de champ** | Un champ obligatoire manque — le message le nomme, il suffit de l'ajouter |
| **200 avec une commande payée** 😱 | Impossible en théorie. Si ça arrivait : rembourser immédiatement depuis l'admin |

---

## ❗ Ce qui reste inconnu

Les inconnues de fond sont levées : route REST, `client_id`, nom de la clé
(`ppcp_paypal_order_id`), forme de la requête et de la réponse de
`cart/order`. **Il ne reste que des questions de plomberie**, toutes
tranchables sans écrire une ligne de production :

1. **Le `Cart-Token` suffit-il** à identifier le panier sur la route REST, et
   le nonce est-il exigé ? → le « Test décisif » ci-dessus y répond.
2. **Comment se fait la finalisation** après approbation PayPal : par
   `/wc-ppcp/v1/cart/checkout`, ou par `/wc/store/v1/checkout` avec
   `ppcp_paypal_order_id` dans `payment_data` ? Le site WordPress utilisant
   le checkout **classique**, le relevé ne montre que son chemin à lui ; le
   chemin Blocks, celui que le front Astro imite, reste à confirmer.

   ⚠️ Le second est le plus probable pour Astro et coûte peu à tenter : on
   connaît désormais le nom de la clé, donc le `payment_data` s'écrit sans
   deviner.

### Pistes épuisées le 22/09/2026

| Piste | Résultat |
|---|---|
| `labrasseriedesplantes.fr` en direct | bloqué par le proxy réseau (apex et `www.`) |
| Source du plugin sur `downloads.wordpress.org` | `CONNECT tunnel failed, 403` |
| `plugins.svn.wordpress.org`, `wordpress.org` | injoignables |
| Miroir GitHub via `add_repo` | refusé : *cross-tier adds are not supported* |
| Miroirs CDN (`cdn.jsdelivr.net`, `unpkg.com`) | injoignables |
| MCP WordPress — lecture d'options / routes REST | aucun outil ne l'expose |
| MCP WordPress — `wp_wc_list_payment_gateways` | le bloc `settings` (qui contiendrait le `client_id`) est **volontairement retiré** par l'outil |

**Le MCP donne les données WooCommerce, pas la configuration du plugin ni son
code.** C'est une limite de l'outil, pas un réglage à changer.

⚠️ Rappel : **rien ne peut être testé d'ici**, et `PUBLIC_WC_BASE_URL` pointe
sur le **WordPress live** dans tous les environnements Vercel — y compris
`test.`. Un essai depuis `test.` crée donc une vraie commande sur la vraie
boutique. Écrire un tunnel de paiement à l'aveugle dans ces conditions n'est
pas acceptable.

---

## ▶️ Ce qu'il me faut — relevés à faire dans le navigateur

### ✅ Relevé 1 — namespace et routes REST *(fait le 22/09/2026)*

`/wp-json/` puis `/wp-json/wc-ppcp/v1`. Résultat consigné plus haut.

### Relevé 2 — le SDK PayPal et la création de commande *(sans payer)*

⚠️ **Ne demande aucun paiement** : on va jusqu'à la fenêtre PayPal puis on
annule. Le plugin aura déjà joué ses appels côté serveur.

1. Sur un ordinateur, mettre un article au panier sur `labrasseriedesplantes.fr`
   et aller sur `/checkout/`.
2. F12 → onglet **Réseau**, cocher **« Conserver le journal » / « Preserve
   log »** (sans ça, la redirection PayPal efface tout).
3. Recharger la page.
4. Filtrer sur **`sdk/js`** → copier l'**URL complète** de la requête vers
   `paypal.com/sdk/js` (elle porte `client-id=`, `merchant-id=`, `currency=`,
   `intent=`).
5. Vider le filtre, taper **`ppcp`**, puis **cliquer sur le bouton PayPal**.
6. Quand la fenêtre PayPal s'ouvre, **la fermer sans payer**.
7. Copier, pour chaque requête `wc-ppcp/v1/…` apparue : l'**URL**, la
   **charge utile** et la **réponse**. Celle vers `cart/order` est la clé —
   sa réponse contient l'ID de commande PayPal.

⚠️ Le `client-id` est une **clé publique**, visible par n'importe quel
visiteur dans le code de la page : aucun risque à le transmettre. Le *secret*
PayPal, lui, ne quitte jamais le serveur — ne jamais le copier, et ne pas
capturer d'écran de la page de réglages du plugin, qui l'affiche.

### Relevé 3 — la finalisation *(nécessite une vraie commande)*

À ne faire qu'après le relevé 2, qui aura peut-être déjà tout donné.

Même préparation (Réseau + « Conserver le journal »), mais cette fois aller
**au bout du paiement**, avec l'article le moins cher, puis rembourser depuis
l'admin WooCommerce.

Ce que je cherche : la requête envoyée **juste après le retour de PayPal**.
Copier son URL et sa charge utile. Deux cas possibles :

- `POST /wp-json/wc-ppcp/v1/cart/checkout` → **architecture A**, le tunnel
  reste dans le namespace du plugin ;
- `POST /wp-json/wc/store/v1/checkout` → **architecture B**, et sa charge
  utile donne enfin le nom de la clé :

```json
{
  "payment_method": "ppcp",
  "payment_data": [ { "key": "???", "value": "26D99705JH087882R" } ]
}
```

Dans les deux cas, l'intégration s'écrit ensuite sans rien deviner.

---

## Ce qui est déjà fait côté Astro (22/09/2026)

Le travail qui ne dépendait d'aucune des trois inconnues a été livré :

- **`src/lib/payment-methods.ts`** (nouveau) — seul endroit qui décide des
  moyens de paiement proposés. Il croise ce que WooCommerce déclare
  (`cart.payment_methods`) avec ce que le front sait faire. Contient le
  constructeur de `payment_data` PayPal et toutes les hypothèses, regroupées
  et annotées.
- **`src/lib/woocommerce.ts`** — les types Store API portent désormais
  `extensions.wc_ppcp` et documentent `payment_methods`.
- **`src/components/cart/CheckoutPage.tsx`** — sélecteur de moyen de paiement
  (cartes radio), affiché **seulement s'il y a un vrai choix**. La soumission
  est routée par passerelle. **Le tunnel carte est inchangé** : avec une seule
  passerelle disponible, l'écran est identique à avant.
- **`.env.example`** — `PUBLIC_PPCP_ENABLED` et `PUBLIC_PAYPAL_CLIENT_ID`
  déclarées à l'avance.

### 🔴 Le verrou

`PPCP_FLOW_IMPLEMENTED = false` dans `src/lib/payment-methods.ts`.

Tant qu'il vaut `false`, PayPal **n'est jamais proposé**, même si WooCommerce
le déclare et même si les variables d'environnement sont posées. C'est
délibéré : une variable activée par erreur sur Vercel afficherait sinon un
bouton PayPal inopérant sur une boutique qui encaisse réellement.

À passer à `true` **dans le même commit** que l'implémentation du tunnel.

---

## Part réelle de PayPal — mesure partielle

Sur les **8 commandes les plus récentes** échantillonnées le 22/09/2026,
**2 sont en PayPal** (#26042 et #25926), 6 en carte.

⚠️ C'est un échantillon, pas une statistique : les outils MCP ne permettent pas
de filtrer les commandes par passerelle (`wp_wc_list_orders` ne renvoie pas
`payment_method`, et `wp_ability_woocommerce_orders_query` est cassé — son
format de date ne valide pas contre son propre schéma). Compter les 511
commandes exigerait de les tirer une par une.

L'ordre de grandeur — **un quart environ, peut-être plus** — confirme le
constat de Guillaume. Il ne change pas la décision : PayPal reste bloquant.

---

## Statut

- [x] Lire une commande PayPal existante et en déduire la forme du tunnel
- [x] Confirmer qu'une seule passerelle PayPal est active (`ppcp`)
- [x] Écarter le risque Checkout Field Editor
- [x] Sélecteur de moyen de paiement dans `CheckoutPage.tsx`
- [x] **Relevé 1** — namespace `wc-ppcp/v1` et ses 13 routes
- [x] **Relevé 2a** — URL du SDK PayPal (`client-id`, `intent`, `commit`, `enable-funding`)
- [x] **Relevé 2b** — requête + réponse de `cart/order` → clé `ppcp_paypal_order_id`
- [x] **Test décisif** — le plugin ignore le `Cart-Token` (issue C)
- [x] **Pont de session** écrit dans `astro-cors` 1.3.0
- [x] **`astro-cors` 1.3.0 installé** sur le WordPress live
- [x] **Pont vérifié** — `cart/order` renvoie un ID depuis Astro, sans cookie ni nonce
- [ ] **Trancher A ou B** — quelle route finalise après approbation *(sonde gratuite, cf. ci-dessous)*
- [ ] Reproduire **PayPal Pay Later** côté Astro (`enable-funding=paylater`)
- [ ] Flux de création / approbation PayPal
- [ ] Gestion des annulations et des échecs
- [ ] Passer `PPCP_FLOW_IMPLEMENTED` à `true`
- [ ] Test réel 1-2 € en PayPal + remboursement
