// English translations for the 5 signature cocktails.
// Keyed by slug (from cocktails.ts).
//
// Names are kept in French (our brand identity) — but we add an English
// subtitle for clarity on the EN page.

export const toneLabelsEn: Record<string, string> = {
  frais: 'Fresh',
  fruité: 'Fruity',
  amer: 'Bitter',
  épicé: 'Spiced',
};

export interface CocktailEn {
  /** English subtitle / translation hint, shown below the FR name */
  subtitle: string;
  description: string;
  ingredients: { item: string; amount?: string }[];
  steps: string[];
  glass: string;
}

export const cocktailsEn: Record<string, CocktailEn> = {
  'spritz-efflorescent': {
    subtitle: 'Floral spritz',
    description:
      "A sun-kissed floral spritz, all roundness. Le Nectar d'Ostara gives the structure, Mandarine Napoléon the warmth, Prosecco the celebration.",
    ingredients: [
      { item: 'Prosecco', amount: '9 cl' },
      { item: "Le Nectar d'Ostara", amount: '3 cl' },
      { item: 'Mandarine Napoléon', amount: '2 cl' },
      { item: 'Sparkling water', amount: '3 cl' },
      { item: 'Orange', amount: '1 slice' },
      { item: 'Ice cubes' },
    ],
    steps: [
      'Fill a large wine glass with ice cubes.',
      "Pour the Prosecco, then Le Nectar d'Ostara and Mandarine Napoléon.",
      'Top up with sparkling water and stir gently.',
      'Garnish with a slice of orange.',
    ],
    glass: 'Wine glass',
  },

  'verveine-printaniere': {
    subtitle: 'Verbena spring long drink',
    description:
      "A herbaceous, lively long drink, brightened by strawberry and lime. L'Herbe des Druides reveals its mentholated accents.",
    ingredients: [
      { item: "L'Herbe des Druides", amount: '4 cl' },
      { item: 'Fresh strawberries', amount: '3' },
      { item: 'Lime juice', amount: '2 cl' },
      { item: 'Cane sugar syrup', amount: '1 cl' },
      { item: 'Sparkling water', amount: '8 cl' },
      { item: 'Fresh verbena leaves', amount: 'a few' },
      { item: 'Ice cubes' },
    ],
    steps: [
      'Muddle the strawberries at the bottom of the shaker with the syrup.',
      'Add the lime, the liqueur, the verbena and a few ice cubes.',
      'Shake vigorously for 10 seconds.',
      'Pour into a tall glass, top up with sparkling water and garnish with a verbena leaf.',
    ],
    glass: 'Long drink',
  },

  'philtre-eros': {
    subtitle: "Cupid's love potion",
    description:
      "Strawberry, raspberry, mint, bubbles — a romantic cocktail that showcases the spicy notes of La Flèche Ardente.",
    ingredients: [
      { item: 'La Flèche Ardente', amount: '4 cl' },
      { item: 'Fresh strawberry juice', amount: '4 cl' },
      { item: 'Lime juice', amount: '1.5 cl' },
      { item: 'Mint leaves', amount: '6' },
      { item: 'Sparkling water', amount: '6 cl' },
      { item: 'Raspberry', amount: '1 for garnish' },
      { item: 'Ice cubes' },
    ],
    steps: [
      'Shake the liqueur, strawberry juice, lime, mint and ice cubes in a shaker.',
      'Strain into a long drink glass filled with ice.',
      'Top up with sparkling water.',
      'Place a raspberry on top.',
    ],
    glass: 'Long drink',
  },

  'black-mule': {
    subtitle: 'Moscow Mule, bitter twist',
    description:
      "A re-reading of the Moscow Mule with our Gorgeon des Machurés — the gentian brings a dark bitterness that works wonderfully with ginger.",
    ingredients: [
      { item: 'Gin', amount: '3 cl' },
      { item: 'Le Gorgeon des Machurés', amount: '2 cl' },
      { item: 'Lime juice', amount: '1.5 cl' },
      { item: 'Ginger beer', amount: '10 cl' },
      { item: 'Crushed ice' },
      { item: 'Lemon zest' },
    ],
    steps: [
      'Shake the gin, the Gorgeon and the lime juice with a few ice cubes.',
      'Strain into a copper mug filled with crushed ice.',
      'Top up with ginger beer.',
      'Express the lemon zest over the glass and drop it in.',
    ],
    glass: 'Copper mug',
  },

  'bonbon-citron': {
    subtitle: 'Lemon drop Martini',
    description:
      "A twisted classic. La Lime des Prés — lemon thyme and meadows — lifts the vodka and lemon into a fresh, rounded Martini.",
    ingredients: [
      { item: 'Vodka', amount: '4 cl' },
      { item: 'La Lime des Prés', amount: '2 cl' },
      { item: 'Fresh lemon juice', amount: '2 cl' },
      { item: 'Sugar syrup', amount: '1 cl' },
      { item: 'Sugar', amount: 'to rim' },
      { item: 'Ice cubes' },
    ],
    steps: [
      'Rim the edge of a Martini glass with lemon and sugar.',
      'Shake all ingredients in a shaker with ice cubes.',
      'Strain into the chilled glass.',
      'Serve immediately.',
    ],
    glass: 'Martini glass',
  },
};
