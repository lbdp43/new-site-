// Les plantes emblématiques de la Brasserie — pour la page éducative /nos-plantes
// (fort levier SEO identifié dans l'audit : contenu expert, rich content, backlinks potentiels).

export interface Plant {
  name: string;
  latin?: string;
  family: 'aromatique' | 'racine' | 'ecorce' | 'epice' | 'fleur' | 'agrume';
  description: string;
  usedIn: string;
  season?: string;
}

export const plants: Plant[] = [
  {
    name: 'Verveine citronnelle',
    latin: 'Aloysia citrodora',
    family: 'aromatique',
    description:
      "Originaire d'Amérique du Sud, cultivée en France depuis le XVIIIᵉ siècle. Son parfum frais, citronné, apaisant, en fait une plante reine des digestifs.",
    usedIn: "L'Herbe des Druides, Verveine CBD Aurone",
    season: 'Juin à septembre',
  },
  {
    name: 'Mélisse',
    latin: 'Melissa officinalis',
    family: 'aromatique',
    description:
      "« Baume » en grec — la mélisse calme et désaltère. Notes douces de citron et de miel, très présentes dans nos accords printaniers.",
    usedIn: "L'Alchimie Végétale, Le Nectar d'Ostara",
    season: 'Mai à octobre',
  },
  {
    name: 'Carvi',
    latin: 'Carum carvi',
    family: 'epice',
    description:
      "Aussi appelé anis des prés. Ses graines, longuement macérées, offrent une chaleur anisée et légèrement mentholée. Un incontournable des liqueurs de tradition.",
    usedIn: "L'Alchimie Végétale, Zeleste",
    season: 'Récolte en juillet',
  },
  {
    name: 'Thym-citron',
    latin: 'Thymus × citriodorus',
    family: 'aromatique',
    description:
      "Hybride rustique du thym commun et du thym à larges feuilles. Fraîcheur citronnée, légèreté — idéal pour allonger un spritz ou un mojito.",
    usedIn: "La Lime des Prés, Le Philtre d'Éros",
    season: 'Mai à septembre',
  },
  {
    name: 'Hysope',
    latin: 'Hyssopus officinalis',
    family: 'aromatique',
    description:
      "Plante médiévale des jardins monastiques, légèrement camphrée, un peu amère. Elle apporte de la profondeur et un caractère « alpin ».",
    usedIn: "L'Essence des Alpes",
    season: 'Juin à août',
  },
  {
    name: 'Aurone',
    latin: 'Artemisia abrotanum',
    family: 'aromatique',
    description:
      "Cousine de l'absinthe et de l'armoise. Moins amère, plus subtile, fruit-bonbon et citron à la fois. Longtemps utilisée en tisane fortifiante.",
    usedIn: "Verveine CBD Aurone",
    season: 'Juillet à septembre',
  },
  {
    name: 'Absinthe',
    latin: 'Artemisia absinthium',
    family: 'aromatique',
    description:
      "La grande amère. Nous la travaillons avec mesure, en accord avec le citron et le CBD, pour une fraîcheur longue et mentholée.",
    usedIn: "Absinthe CBD Citron",
    season: 'Juillet à septembre',
  },
  {
    name: 'Menthe poivrée',
    latin: 'Mentha × piperita',
    family: 'aromatique',
    description:
      "Deux cent cinquante variétés de menthes existent ; nous retenons la poivrée pour sa puissance et son éclat. Idéale en long drink frais.",
    usedIn: "Le Menthor, Menthe CBD Ortie",
    season: 'Juin à septembre',
  },
  {
    name: 'Ortie',
    latin: 'Urtica dioica',
    family: 'aromatique',
    description:
      "Mauvaise herbe mal-aimée, mais chargée de minéraux et d'une saveur verte inimitable. Cuite ou macérée, elle perd son piquant et révèle un goût de thé vert.",
    usedIn: "Menthe CBD Ortie",
    season: 'Avril à juillet',
  },
  {
    name: 'Mandarine',
    latin: 'Citrus reticulata',
    family: 'agrume',
    description:
      "Apportée par les écorces, pour leur chaleur sucrée. Elle arrondit et parfume nos apéritifs de printemps.",
    usedIn: "Le Nectar d'Ostara, Le Spritz Efflorescent",
    season: 'Décembre à février',
  },
  {
    name: 'Gentiane',
    latin: 'Gentiana lutea',
    family: 'racine',
    description:
      "La grande racine des montagnes d'Auvergne. Amère franche, profonde — c'est elle qui donne à certains de nos digestifs leur colonne vertébrale.",
    usedIn: "Le Gorgeon des Machurés",
    season: 'Récolte de septembre à novembre',
  },
  {
    name: 'Réglisse',
    latin: 'Glycyrrhiza glabra',
    family: 'racine',
    description:
      "Pour la douceur et la rondeur. Utilisée en quantité mesurée, elle enveloppe les amers et arrondit les agrumes.",
    usedIn: "Cerf'Gent",
    season: 'Récolte en automne',
  },
];
