// English translations for the plants used in our liqueurs.
// Keyed by the French name (from plants.ts).

export const familyLabelsEn: Record<string, string> = {
  aromatique: 'Aromatic herb',
  racine: 'Root',
  ecorce: 'Bark',
  epice: 'Spice',
  fleur: 'Flower',
  agrume: 'Citrus',
};

export interface PlantEn {
  description: string;
  usedIn: string;
  season?: string;
}

export const plantsEn: Record<string, PlantEn> = {
  'Verveine citronnelle': {
    description:
      "Native to South America, cultivated in France since the 18th century. Its fresh, lemony, soothing aroma makes it a queen of digestifs.",
    usedIn: "L'Herbe des Druides, Verveine CBD Aurone",
    season: 'June to September',
  },
  'Mélisse': {
    description:
      "\"Balm\" in Greek — lemon balm both calms and refreshes. Soft notes of lemon and honey, very present in our spring compositions.",
    usedIn: "L'Alchimie Végétale, Le Nectar d'Ostara",
    season: 'May to October',
  },
  'Carvi': {
    description:
      "Also called meadow caraway. Its seeds, after long maceration, offer an aniseed warmth with a light mentholated edge. A staple of traditional liqueurs.",
    usedIn: "L'Alchimie Végétale, Zeleste",
    season: 'Harvested in July',
  },
  'Thym-citron': {
    description:
      "A rustic hybrid of common thyme and broad-leaf thyme. Lemony freshness and lightness — ideal to lengthen a spritz or a mojito.",
    usedIn: "La Lime des Prés, Le Philtre d'Éros",
    season: 'May to September',
  },
  'Hysope': {
    description:
      "A medieval plant from monastic gardens, lightly camphorated, a touch bitter. It brings depth and an \"alpine\" character.",
    usedIn: "L'Essence des Alpes",
    season: 'June to August',
  },
  'Aurone': {
    description:
      "A cousin of wormwood and mugwort. Less bitter, more subtle, both candy-fruit and lemon. Long used as a strengthening herbal tea.",
    usedIn: "Verveine CBD Aurone",
    season: 'July to September',
  },
  'Absinthe': {
    description:
      "The great bitter. We work with it in measured doses, paired with lemon and CBD, for a long and mentholated freshness.",
    usedIn: "Absinthe CBD Citron",
    season: 'July to September',
  },
  'Menthe poivrée': {
    description:
      "Two hundred and fifty varieties of mint exist; we choose peppermint for its power and brightness. Ideal in a refreshing long drink.",
    usedIn: "Le Menthor, Menthe CBD Ortie",
    season: 'June to September',
  },
  'Ortie': {
    description:
      "A much-disliked weed, yet rich in minerals and a unique green flavour. Cooked or macerated, it loses its sting and reveals a green-tea taste.",
    usedIn: "Menthe CBD Ortie",
    season: 'April to July',
  },
  'Mandarine': {
    description:
      "Brought by the zest, for its sweet warmth. It rounds out and perfumes our spring aperitifs.",
    usedIn: "Le Nectar d'Ostara, Le Spritz Efflorescent",
    season: 'December to February',
  },
  'Gentiane': {
    description:
      "The great root of the Auvergne mountains. A frank, deep bitterness — the backbone of some of our digestifs.",
    usedIn: "Le Gorgeon des Machurés",
    season: 'Harvested September to November',
  },
  'Réglisse': {
    description:
      "For sweetness and roundness. Used in measured quantity, it wraps the bitter notes and rounds off the citrus.",
    usedIn: "Cerf'Gent",
    season: 'Harvested in autumn',
  },
};
