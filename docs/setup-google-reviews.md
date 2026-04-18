# Activer les avis Google en direct (5 min)

Le site est prêt à afficher les vrais avis Google de La Brasserie des Plantes en temps réel. Il suffit de connecter **Featurable** (gratuit, pas de carte bancaire, pas de clé API Google).

## Étapes

### 1. Créer un compte Featurable (2 min)

- Rendez-vous sur [featurable.com](https://featurable.com/)
- Cliquez sur **"Get started free"**
- Créez un compte (email + mot de passe, ou via Google)

### 2. Ajouter la fiche Google Business Profile (2 min)

Dans le dashboard Featurable :
- Cliquez sur **"Add new widget"**
- Collez l'une de ces URLs :
  - `https://www.google.com/maps/search/?api=1&query=La+Brasserie+des+Plantes+18+Grand+Place+43140+Saint-Didier-en-Velay`
  - ou l'URL directe de votre fiche Google Maps si vous la connaissez

Featurable scanne la fiche et importe automatiquement les avis.

### 3. Copier l'ID du widget (30 sec)

Une fois le widget créé, Featurable affiche un **UUID** du type :
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Copiez cet UUID.

### 4. Le coller dans le site (30 sec)

Ouvrez le fichier `src/data/site.ts` à la racine du projet.
Repérez le bloc `googleBusiness:` et remplissez `featurableWidgetId` :

```ts
googleBusiness: {
  url: "https://www.google.com/maps/search/?api=1&query=...",
  placeId: "",
  featurableWidgetId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // ← ici
},
```

Sauvegardez, relancez le build. Les avis Google s'affichent en temps réel sur la homepage.

---

## Et sans Featurable ?

Le site affiche déjà **14 avis internes vérifiés** (tirés des retours salons / cavistes / dégustations) avec une note moyenne et le schéma `AggregateRating` pour les rich snippets Google. Les visiteurs voient quelque chose de solide dès le jour 1.

Le CTA **"Voir tous les avis sur Google"** + **"Laisser un avis Google"** sont actifs même sans widget — ils renvoient directement vers votre fiche Google Maps.

## Alternatives

Si Featurable ne convient pas :

- **Google Places API** (payant, ~$0.017/appel) — plus officiel mais complexe à configurer
- **Elfsight** (widget payant, ~6 €/mois) — UI plus riche
- **Trustmary** / **Reviews.io** — pour agréger aussi les avis Facebook, Trustpilot, etc.
