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

**L'extension est `pymntpl-paypal-woocommerce`** (PayPal for WooCommerce, par
Payment Plugins) — identifiée via l'URL d'icône dans la réponse.

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

**Côté Astro**, rien : `grep -ri "ppcp\|paypal" src/` ne renvoie aucune ligne.
`CheckoutPage.tsx` envoie `payment_method: "woocommerce_payments"` en dur et
filtre Stripe à `paymentMethodTypes: ["card"]`.

---

## Ce que ça représente comme travail

**Ce n'est pas un champ à ajouter.** Aujourd'hui le checkout n'a qu'un seul
moyen de paiement, donc aucune notion de choix. Il faut :

1. **Un sélecteur de moyen de paiement** dans `CheckoutPage.tsx` — carte ou
   PayPal. Ça touche l'état du composant, la validation et le bouton de
   soumission, pas seulement l'affichage.
2. **Le flux PayPal lui-même** : créer une commande PayPal depuis le panier,
   envoyer le client approuver chez PayPal (redirection ou fenêtre), récupérer
   le retour, puis appeler `/wc/store/v1/checkout` avec
   `payment_method: "ppcp"` et le jeton d'approbation dans `payment_data`.
3. **Les cas d'échec** : client qui ferme la fenêtre PayPal, qui annule, qui
   revient en arrière, session expirée. Sur un paiement, chacun de ces cas doit
   laisser le panier intact et un message clair — pas une commande fantôme.
4. **Un test réel** (WooPayments est en mode LIVE) : une vraie commande de
   1-2 € payée en PayPal, puis remboursée.

⚠️ **Le piège probable, par analogie avec WooPayments** : la façon exacte dont
`payment_data` doit être formé n'est pas devinable depuis la documentation.
Pour WooPayments, il a fallu deux journées de diagnostic pour découvrir qu'il
fallait **dupliquer `payment_method`** (cf. `CLAUDE.md`), à cause d'un
`$_POST = $payment_data` dans le code de WooCommerce. Il faut s'attendre à une
surprise du même ordre côté PPCP.

---

## 🔓 DÉBLOQUÉ — l'accès WooCommerce existe maintenant

**22/09/2026.** Guillaume a activé les **46 outils WooCommerce** du MCP
`mcp_wordpress` (extension Easy MCP AI → onglet Plugins → WooCommerce →
`46 / 46 tools enabled`). Ils exposent la **REST API WooCommerce v3** :
produits, **commandes**, clients, coupons, rapports, webhooks, réglages.

Outils utiles, préfixe `wp_wc_` : `wp_wc_list_orders`, `wp_wc_get_order`,
`wp_wc_list_products`, `wp_wc_get_product`, et leurs équivalents en écriture
(à n'utiliser qu'avec l'accord explicite de Guillaume).

⚠️ **Les outils n'apparaissent QUE dans une conversation ouverte APRÈS leur
activation** — la liste est figée à l'ouverture de chaque conversation. Le
bandeau de l'extension le dit : *« refresh its tools or start a new
conversation »*. Reconnecter le serveur en cours de conversation ne suffit
pas. Vérifié à nos dépens sur trois tentatives.

### ▶️ Par quoi commencer, dans la prochaine session

1. **`wp_wc_list_orders`** — filtrer les commandes récentes et regarder le
   `payment_method` de chacune. Ça donne enfin la part réelle de PayPal, que
   les indicateurs EasyBeer ne savent pas isoler (ils couvrent toute
   l'activité, B2B compris).
2. **`wp_wc_get_order`** sur une commande PayPal existante — c'est la pièce
   maîtresse : elle montre **exactement** quelles métadonnées le plugin
   enregistre (identifiant de commande PayPal, jeton, statut). On saura quoi
   envoyer dans `payment_data` sans le deviner.
3. **Les champs du checkout** — vérifier si l'extension Checkout Field Editor
   a ajouté des champs obligatoires que `CheckoutPage.tsx` n'envoie pas.

⚠️ **Contrainte qui demeure** : l'environnement de développement ne peut PAS
joindre `labrasseriedesplantes.fr` (proxy réseau), ni lire le code du plugin
(`plugins.trac.wordpress.org` est bloqué aussi). Le MCP est donc le seul
canal vers le WordPress. Et **rien ne peut être testé d'ici** : c'est
Guillaume qui teste dans son navigateur. Écrire un tunnel de paiement à
l'aveugle sur une boutique qui encaisse réellement n'est pas acceptable —
d'où l'importance de lire les commandes existantes avant d'écrire une ligne.

## ❗ Ce qu'il me faut pour avancer (obsolète depuis l'accès WooCommerce)

L'environnement de développement **ne peut pas joindre le WordPress** (domaine
bloqué par le proxy réseau, en `www.` comme en apex), et le MCP WordPress est
verrouillé faute de plan Jetpack. Je ne peux donc pas inspecter les routes REST
du plugin moi-même.

**Étape 1 — la liste des espaces de noms REST.** Ouvrir dans le navigateur :

```
https://labrasseriedesplantes.fr/wp-json/
```

C'est une grosse réponse JSON. Je n'ai besoin que du tout **début**, qui
contient un tableau `"namespaces": [ ... ]`. Y figurera quelque chose comme
`wc-ppcp/v1` ou `pymntpl-paypal/v1` — c'est ce nom qu'il me faut.

**Étape 2** — une fois le nom connu, je demanderai la liste des routes de cet
espace (`/wp-json/<namespace>`), qui dira précisément quels appels le plugin
expose pour créer et approuver une commande PayPal.

Avec ces deux informations, je peux écrire l'intégration sans deviner.

---

## Statut

- [ ] Étape 1 — relever les espaces de noms REST *(Guillaume)*
- [ ] Étape 2 — relever les routes du namespace PPCP *(Guillaume)*
- [ ] Sélecteur de moyen de paiement dans `CheckoutPage.tsx`
- [ ] Flux de création / approbation PayPal
- [ ] Gestion des annulations et des échecs
- [ ] Test réel 1-2 € en PayPal + remboursement
