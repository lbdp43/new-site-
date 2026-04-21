// Source de vérité unique — NAP, infos entreprise, SEO par défaut.
// Cohérence NAP = correction critique identifiée dans l'audit SEO (score 45/100 en local).

export const site = {
  name: "La Brasserie des Plantes",
  shortName: "LBDP",
  tagline: "Liqueurs artisanales de plantes — Haute-Loire",
  baseline: "Artisans liquoristes depuis 2021, à Saint-Didier-en-Velay.",
  url: "https://labrasseriedesplantes.fr",
  locale: "fr_FR",

  // NAP unifié (choix utilisateur)
  phone: "+33974974101",
  phoneDisplay: "09 74 97 41 01",
  email: "labrasseriedesplantes@gmail.com",

  address: {
    street: "18 Grand Place",
    postalCode: "43140",
    city: "Saint-Didier-en-Velay",
    region: "Haute-Loire",
    country: "FR",
  },

  // Horaires officiels — mercredi, vendredi, samedi de 9h à 18h30
  // Format schema.org (LocalBusiness.openingHours) = liste de plages
  hours: ["We 09:00-18:30", "Fr 09:00-18:30", "Sa 09:00-18:30"],
  hoursDisplay: "Mercredi, vendredi et samedi — 9h à 18h30",

  // Géocoordonnées approximatives pour Saint-Didier-en-Velay (à vérifier/ajuster)
  geo: {
    latitude: 45.3019,
    longitude: 4.2967,
  },

  siret: "89920152900018",

  // Identité
  founded: "2021",
  founders: ["Etienne", "Guillaume"],

  // Distinction
  award: {
    title: "Meilleur Digestif du Monde",
    year: 2025,
    issuer: "World Drinks Awards",
    product: "L'Alchimie Végétale",
  },

  // Réseaux (à compléter)
  social: {
    instagram: "https://www.instagram.com/labrasseriedesplantes",
    facebook: "https://www.facebook.com/brasseriedesplantes",
  },

  // Google Business Profile (GBP) — lien canonique vers la fiche Google
  // Remplace la valeur `placeId` une fois connue via le PlaceID Finder :
  // https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
  googleBusiness: {
    /** URL canonique de la fiche Google Maps (basée sur Place ID, best signal). */
    url: "https://www.google.com/maps/place/?q=place_id:ChIJw0TH0B-79UcR3ZhzNesMBUQ",
    /** Place ID officiel de la fiche GBP (format ChIJ...). */
    placeId: "ChIJw0TH0B-79UcR3ZhzNesMBUQ",
    /** URL directe "Laisser un avis" (plus propre que ?hl=fr sur l'URL Maps). */
    writeReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJw0TH0B-79UcR3ZhzNesMBUQ",
    /** ID du widget Featurable — affiche les vrais avis Google en live, sans clé API Google. */
    featurableWidgetId: "72bbcee7-7505-40ea-add0-e4071e80db1b",
  },

  // SEO defaults
  defaultDescription:
    "Liqueurs et infusions artisanales de plantes d'Auvergne. Producteur indépendant en Haute-Loire. L'Alchimie Végétale, Meilleur Digestif du Monde 2025 aux World Drinks Awards.",
  defaultOgImage: "/og-default.jpg",
} as const;

export const nav = [
  { label: "Notre histoire", href: "/notre-histoire" },
  { label: "Boutique", href: "/boutique" },
  { label: "Lumière Obscure", href: "/lumiere-obscure" },
  { label: "Nos plantes", href: "/nos-plantes" },
  { label: "Cocktails", href: "/cocktails" },
  { label: "Ateliers", href: "/ateliers" },
  { label: "Journal", href: "/blog" },
  { label: "Pros", href: "/professionnels" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerSecondary = [
  { label: "FAQ", href: "/faq" },
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "CGV", href: "/cgv" },
  { label: "Cookies", href: "/politique-cookies" },
] as const;
