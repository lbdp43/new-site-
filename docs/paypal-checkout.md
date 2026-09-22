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

## ❗ Les trois inconnues qui restent — et pourquoi je ne peux pas les lever

Il manque exactement trois informations. Aucune n'est devinable, et **aucune
n'est accessible depuis l'environnement de développement** :

1. **Le nom exact de la clé** qui porte l'ID de commande PayPal dans
   `payment_data`. La métadonnée s'appelle `_ppcp_paypal_order_id`, mais la
   clé POST attendue par `process_payment()` peut s'appeler autrement
   (`paypal_order_id`, `ppcp_order_id`, `wc-ppcp-order-id`…).
2. **La route REST du plugin** qui crée la commande PayPal côté serveur.
3. **Le `client_id` PayPal** à passer au SDK JS pour afficher le bouton.

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

## ▶️ Ce qu'il me faut — relevé à faire dans le navigateur

Trois relevés, tous en lecture seule, tous depuis un navigateur connecté au
site. Aucun ne modifie quoi que ce soit.

### Relevé 1 — la route REST du plugin

Ouvrir :

```
https://labrasseriedesplantes.fr/wp-json/
```

Grosse réponse JSON. Chercher (Ctrl+F) **`ppcp`** dans le tableau
`"namespaces"` au tout début. Copier la ligne trouvée — quelque chose comme
`wc-ppcp/v1` ou `pymntpl-paypal/v1`.

Puis ouvrir ce namespace pour voir ses routes, par exemple :

```
https://labrasseriedesplantes.fr/wp-json/wc-ppcp/v1
```

et copier la **liste des routes** (les clés de l'objet `"routes"`).

### Relevé 2 — le `client_id` PayPal et les clés de `payment_data`

C'est le relevé le plus important : il donne les points 1 et 3 d'un coup.

1. Ouvrir la **page de commande du site WordPress** avec un article au panier :
   `https://labrasseriedesplantes.fr/checkout/`
2. Ouvrir les outils de développement (F12) → onglet **Réseau**.
3. Recharger la page.
4. Chercher une requête vers **`paypal.com/sdk/js`**. Copier son **URL
   complète** — elle contient `client-id=...`, `merchant-id=...`,
   `currency=...`, `intent=...`. C'est tout ce qu'il faut pour le point 3.

⚠️ Ce `client_id` est une **clé publique**, conçue pour être visible dans le
code de la page — il n'y a aucun risque à me la transmettre. Ne me transmettez
en revanche **jamais** le *secret* PayPal, qui vit uniquement côté serveur.

### Relevé 3 — la requête de commande réelle (le plus décisif)

Toujours dans l'onglet **Réseau**, **filtrer sur `checkout`**, puis aller au
bout d'une vraie commande PayPal (une petite, qu'on remboursera ensuite).

Repérer la requête `POST` vers **`/wp-json/wc/store/v1/checkout`** →
onglet **Charge utile / Payload** → copier le JSON envoyé.

On y verra la vraie forme :

```json
{
  "payment_method": "ppcp",
  "payment_data": [
    { "key": "???", "value": "26D99705JH087882R" },
    ...
  ]
}
```

**Ce JSON répond au point 1 et confirme le point 2.** Avec lui, l'intégration
s'écrit sans deviner.

💡 Si le checkout WordPress est en blocks et que la requête part vers
`/wc/store/v1/checkout`, on est dans le cas idéal : c'est **exactement**
l'endpoint que le site Astro utilise déjà.

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
- [ ] **Relevé 1** — routes REST du namespace PPCP *(Guillaume)*
- [ ] **Relevé 2** — URL du SDK PayPal (`client-id`) *(Guillaume)*
- [ ] **Relevé 3** — payload réel du `POST /wc/store/v1/checkout` *(Guillaume)*
- [ ] Flux de création / approbation PayPal
- [ ] Gestion des annulations et des échecs
- [ ] Passer `PPCP_FLOW_IMPLEMENTED` à `true`
- [ ] Test réel 1-2 € en PayPal + remboursement
