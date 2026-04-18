// 5 cocktails maison + schema.org/Recipe pour chacun (rich snippets Google).

export interface CocktailIngredient {
  item: string;
  amount?: string;
}

export interface Cocktail {
  slug: string;
  name: string;
  description: string;
  image: string;
  liqueurProductSlug: string;
  liqueurName: string;
  ingredients: CocktailIngredient[];
  steps: string[];
  prepTime: string; // PT5M format for schema
  servings: number;
  glass: string;
  tone: 'frais' | 'fruité' | 'amer' | 'épicé';
}

export const cocktails: Cocktail[] = [
  {
    slug: 'spritz-efflorescent',
    name: 'Le Spritz Efflorescent',
    description:
      "Un spritz floral et ensoleillé, tout en rondeur. Le Nectar d'Ostara apporte la structure, la Mandarine Napoléon la chaleur, le Prosecco la fête.",
    image: '/images/cocktails/spritz-efflorescent.webp',
    liqueurProductSlug: 'nectar-ostara',
    liqueurName: "Le Nectar d'Ostara",
    ingredients: [
      { item: "Prosecco", amount: "9 cl" },
      { item: "Le Nectar d'Ostara", amount: "3 cl" },
      { item: "Mandarine Napoléon", amount: "2 cl" },
      { item: "Eau gazeuse", amount: "3 cl" },
      { item: "Orange", amount: "1 rondelle" },
      { item: "Glaçons" },
    ],
    steps: [
      "Remplir un grand verre à vin de glaçons.",
      "Verser le Prosecco, puis le Nectar d'Ostara et la Mandarine Napoléon.",
      "Allonger d'eau gazeuse et remuer délicatement.",
      "Garnir d'une rondelle d'orange.",
    ],
    prepTime: 'PT3M',
    servings: 1,
    glass: 'Verre à vin',
    tone: 'fruité',
  },
  {
    slug: 'verveine-printaniere',
    name: 'La Verveine Printanière',
    description:
      "Un long drink herbacé, vif, relevé par la fraise et le citron vert. L'Herbe des Druides y révèle ses accents mentholés.",
    image: '/images/cocktails/verveine-printaniere.webp',
    liqueurProductSlug: 'herbe-des-druides',
    liqueurName: "L'Herbe des Druides",
    ingredients: [
      { item: "L'Herbe des Druides", amount: "4 cl" },
      { item: "Fraises fraîches", amount: "3 pièces" },
      { item: "Jus de citron vert", amount: "2 cl" },
      { item: "Sirop de sucre de canne", amount: "1 cl" },
      { item: "Eau pétillante", amount: "8 cl" },
      { item: "Verveine fraîche", amount: "quelques feuilles" },
      { item: "Glaçons" },
    ],
    steps: [
      "Écraser les fraises au fond du shaker avec le sirop.",
      "Ajouter le citron vert, la liqueur, la verveine et quelques glaçons.",
      "Secouer vigoureusement 10 secondes.",
      "Verser dans un grand verre, allonger d'eau pétillante et décorer d'une feuille de verveine.",
    ],
    prepTime: 'PT5M',
    servings: 1,
    glass: 'Long drink',
    tone: 'frais',
  },
  {
    slug: 'philtre-eros',
    name: "Le Philtre d'Éros",
    description:
      "Fraise, framboise, menthe, bulles — un cocktail romantique qui met en valeur les notes épicées de la Flèche Ardente.",
    image: '/images/cocktails/philtre-eros.webp',
    liqueurProductSlug: 'fleche-ardente',
    liqueurName: 'La Flèche Ardente',
    ingredients: [
      { item: "La Flèche Ardente", amount: "4 cl" },
      { item: "Jus de fraise frais", amount: "4 cl" },
      { item: "Jus de citron vert", amount: "1,5 cl" },
      { item: "Feuilles de menthe", amount: "6" },
      { item: "Eau gazeuse", amount: "6 cl" },
      { item: "Framboise", amount: "1 pour la décoration" },
      { item: "Glaçons" },
    ],
    steps: [
      "Frapper au shaker la liqueur, le jus de fraise, le citron vert, la menthe et les glaçons.",
      "Filtrer dans un verre long drink rempli de glace.",
      "Allonger d'eau gazeuse.",
      "Déposer une framboise sur le dessus.",
    ],
    prepTime: 'PT4M',
    servings: 1,
    glass: 'Long drink',
    tone: 'fruité',
  },
  {
    slug: 'black-mule',
    name: 'Le Black Mule',
    description:
      "Relecture du Moscow Mule avec notre Gorgeon des Machurés — la gentiane donne une amertume sombre qui fait merveille avec le gingembre.",
    image: '/images/cocktails/black-mule.webp',
    liqueurProductSlug: 'gorgeon-des-machures',
    liqueurName: 'Le Gorgeon des Machurés',
    ingredients: [
      { item: "Gin", amount: "3 cl" },
      { item: "Le Gorgeon des Machurés", amount: "2 cl" },
      { item: "Jus de citron vert", amount: "1,5 cl" },
      { item: "Ginger Beer", amount: "10 cl" },
      { item: "Glace pilée" },
      { item: "Zeste de citron" },
    ],
    steps: [
      "Frapper au shaker le gin, le Gorgeon et le citron vert avec quelques glaçons.",
      "Filtrer dans une tasse en cuivre remplie de glace pilée.",
      "Allonger avec la Ginger Beer.",
      "Zester au-dessus du verre et ajouter le zeste.",
    ],
    prepTime: 'PT4M',
    servings: 1,
    glass: 'Tasse en cuivre',
    tone: 'amer',
  },
  {
    slug: 'bonbon-citron',
    name: 'Le Bonbon au Citron',
    description:
      "Un classique détourné. La Lime des Prés — thym-citron et prairies — éclaire la vodka et le citron pour un Martini gourmand et frais.",
    image: '/images/cocktails/bonbon-citron.webp',
    liqueurProductSlug: 'lime-des-pres',
    liqueurName: 'La Lime des Prés',
    ingredients: [
      { item: "Vodka", amount: "4 cl" },
      { item: "La Lime des Prés", amount: "2 cl" },
      { item: "Jus de citron frais", amount: "2 cl" },
      { item: "Sirop de sucre", amount: "1 cl" },
      { item: "Sucre", amount: "pour givrer" },
      { item: "Glaçons" },
    ],
    steps: [
      "Givrer le bord d'un verre à Martini avec un trait de citron et du sucre.",
      "Secouer tous les ingrédients au shaker avec des glaçons.",
      "Filtrer dans le verre glacé.",
      "Servir immédiatement.",
    ],
    prepTime: 'PT4M',
    servings: 1,
    glass: 'Verre à Martini',
    tone: 'frais',
  },
];
