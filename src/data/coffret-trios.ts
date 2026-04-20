// Trios curés — sélections de 3 bouteilles assemblées par la Maison pour
// aider le visiteur qui ne sait pas quoi choisir. Chaque trio a un angle
// (découverte, fêtes, cadeau homme/femme, sans alcool fort, etc.) et propose
// une cohérence d'accord (des plantes qui se complètent).
//
// Utilisé dans le CoffretBuilder pour afficher des "suggestions rapides"
// — cliquer remplit les 3 slots d'un coup.

export interface CoffretTrio {
  id: string;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  /** Slugs des 3 bouteilles (doivent exister dans products.ts). */
  slugs: [string, string, string];
  /** Badge facultatif (ex: "Bestseller", "Édition fêtes"). */
  badge?: { fr: string; en: string };
}

export const coffretTrios: CoffretTrio[] = [
  {
    id: 'decouverte',
    title: {
      fr: 'La Découverte',
      en: 'The Discovery',
    },
    description: {
      fr: "Le meilleur tour de la maison. La primée, la florale printanière et l'amertume auvergnate — pour goûter les trois caractères.",
      en: "The best tour of the house. The award winner, the spring floral and the Auvergne bitterness — to taste all three characters.",
    },
    slugs: ['alchimie-vegetale', 'nectar-ostara', 'cerf-gent'],
    badge: { fr: 'Suggéré', en: 'Featured' },
  },
  {
    id: 'bestsellers',
    title: {
      fr: 'Les Trois Médaillées',
      en: 'The Three Medallists',
    },
    description: {
      fr: "Nos trois liqueurs les plus primées. Verveine, digestif de prestige, apéritif amer — du trophée dans chaque gamme.",
      en: "Our three most awarded liqueurs. Verbena, prestige digestif, bitter aperitif — one trophy from each range.",
    },
    slugs: ['herbe-des-druides', 'alchimie-vegetale', 'cerf-gent'],
  },
  {
    id: 'aperitif',
    title: {
      fr: 'Soirée Apéritif',
      en: 'Aperitif Evening',
    },
    description: {
      fr: "Pour les soirs de printemps. Trois apéritifs légers et frais — floral, amer et menthe — à boire sur glace.",
      en: "For spring evenings. Three light, fresh aperitifs — floral, bitter and mint — to serve over ice.",
    },
    slugs: ['nectar-ostara', 'cerf-gent', 'menthor'],
  },
  {
    id: 'gourmand',
    title: {
      fr: 'La Trilogie Gourmande',
      en: 'The Sweet Trilogy',
    },
    description: {
      fr: "Pour les becs sucrés. Fruits rouges, praliné et agrumes — un coffret fête, à partager au dessert.",
      en: "For the sweet tooth. Red fruits, praline and citrus — a festive box, to share with dessert.",
    },
    slugs: ['fleche-ardente', 'pralicoquine', 'zeleste'],
  },
  {
    id: 'cbd',
    title: {
      fr: 'Détente Lumière Obscure',
      en: 'Dark Light Relaxation',
    },
    description: {
      fr: "Les trois CBD en un coffret. Menthe, verveine et absinthe — la gamme chanvre complète, pour une soirée détente.",
      en: "All three CBD liqueurs in one box. Mint, verbena and absinthe — the full hemp range, for a relaxed evening.",
    },
    slugs: ['menthe-cbd-ortie', 'verveine-cbd-aurone', 'absinthe-cbd-citron'],
    badge: { fr: 'Gamme CBD', en: 'CBD range' },
  },
  {
    id: 'montagne',
    title: {
      fr: 'Esprit Montagne',
      en: 'Mountain Spirit',
    },
    description: {
      fr: "Le Velay dans un coffret. Génépi des Alpes, verveine des bois et liqueur noire des mineurs stéphanois — les racines du territoire.",
      en: "Velay in a gift box. Alpine genepi, wild verbena and the black liqueur of the Saint-Étienne miners — the roots of the terroir.",
    },
    slugs: ['essence-des-alpes', 'herbe-des-druides', 'gorgeon-des-machures'],
  },
];
