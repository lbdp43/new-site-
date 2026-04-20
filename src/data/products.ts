// Catalogue produits — 18 références, données alignées sur le guide commercial
// officiel (https://labrasseriedesplantes.fr/wp-content/utile/guidecommerciale.html).

export type ProductRange = "brasserie" | "aperitif" | "lumiere-obscure" | "edition-limitee" | "accessoire";

export interface Product {
  slug: string;
  name: string;
  range: ProductRange;
  priceMin: number;
  priceMax: number;
  image: string;
  /** Photo secondaire révélée au survol de la carte produit. */
  image2?: string;
  /** Degré d'alcool (% vol.) — clé commerciale. */
  alcohol: number;
  /** Plantes et ingrédients principaux. */
  composition: string[];
  /** Type d'usage : digestif, apéritif, cocktail, etc. */
  usage: string;
  /** Courte accroche affichée sur la carte. */
  tagline?: string;
  /** Badge sur la carte (ex: Meilleur Digestif du Monde 2025). */
  highlight?: string;
  /** Description longue pour la page produit. */
  description?: string;
  /** Profil sensoriel. */
  tasting?: {
    nose?: string;
    palate?: string;
    finish?: string;
  };
  /** Distinctions reçues. */
  awards?: string[];
  /** Conseil de service. */
  serving?: string;
  /** Contenances disponibles. */
  sizes?: string[];
  /** Map taille (cl) → chemin image. Permet de switcher la photo selon le
   *  format sélectionné sur la page produit, comme sur le site officiel. */
  sizeImages?: Record<number, string>;
  /** ID numérique du produit côté WooCommerce (renvoyé par la Store API).
   *  Requis pour l'ajout au panier. Laissé vide = bouton désactivé avec
   *  message "bientôt disponible". */
  wcId?: number;
  /** Nom de l'attribut WooCommerce pour la contenance.
   *  Défaut : "pa_contenance" (convention WC pour attribut global).
   *  À ajuster selon ce que renvoie la Store API pour chaque produit. */
  wcSizeAttribute?: string;
}

export const ranges: Record<ProductRange, { name: string; baseline: string; description: string }> = {
  brasserie: {
    name: "Brasserie des Plantes",
    baseline: "Nos liqueurs signature — digestifs et apéritifs aux plantes oubliées d'Auvergne.",
    description:
      "Le cœur de notre savoir-faire. Des liqueurs de 18 à 50°, conçues autour d'assemblages complexes de plantes médicinales et aromatiques. Digestifs de prestige, liqueurs florales, fruits rouges — la gamme couvre toute une palette de moments.",
  },
  aperitif: {
    name: "Gamme Apéritif",
    baseline: "Des apéritifs amers ou gourmands, 15 à 17,5°, à servir givrés.",
    description:
      "Plus légers en alcool, plus vifs, conçus pour ouvrir les rassemblements. De l'alternative française à la Suze (Cerf'Gent) à la menthe en triple alliance (Menthor), en passant par la praline (Pralicoquine) et les agrumes (Zéleste).",
  },
  "lumiere-obscure": {
    name: "Lumière Obscure",
    baseline: "Liqueurs au CBD — chanvre sans THC, associé aux plantes.",
    description:
      "Une gamme à part, où le chanvre rencontre nos plantes signatures — menthe verte, verveine, absinthe. Sans effet psychoactif, une autre approche de la détente botanique.",
  },
  "edition-limitee": {
    name: "Éditions limitées & cuvées",
    baseline: "Vieillissements en fût, hommages, tirages confidentiels.",
    description:
      "Quelques bouteilles par an, numérotées. L'Herbe des Druides en finition fût de chêne, l'Alchimie Végétale Cuvée Michel — des produits rares, à offrir ou à garder.",
  },
  accessoire: {
    name: "Coffrets & accessoires",
    baseline: "Pour emporter la Brasserie avec soi.",
    description:
      "Coffret d'initiation, flasque 20cl + entonnoir — nos indispensables pour découvrir ou offrir.",
  },
};

// Helper pour les contenances standards — la Flasque 5cl n'existe qu'en coffret,
// pas en vente individuelle.
const CONTENANCES = ["Empilable 20cl", "50cl", "70cl", "Magnum 150cl"];

// Map taille → image pour chaque produit (fichiers téléchargés depuis le site
// officiel WooCommerce dans /public/images/products/sizes/).
const SIZE_IMAGES: Record<string, Record<number, string>> = {
  "alchimie-vegetale": {
    20: "/images/products/sizes/alchimie-vegetale-20cl.webp",
    50: "/images/products/sizes/alchimie-vegetale-50cl.webp",
    70: "/images/products/sizes/alchimie-vegetale-70cl.webp",
    150: "/images/products/sizes/alchimie-vegetale-150cl.webp",
  },
  "herbe-des-druides": {
    20: "/images/products/sizes/herbe-des-druides-20cl.webp",
    50: "/images/products/sizes/herbe-des-druides-50cl.webp",
    70: "/images/products/sizes/herbe-des-druides-70cl.webp",
    150: "/images/products/sizes/herbe-des-druides-150cl.webp",
  },
  "gorgeon-des-machures": {
    20: "/images/products/sizes/gorgeon-des-machures-20cl.webp",
    50: "/images/products/sizes/gorgeon-des-machures-50cl.webp",
    70: "/images/products/sizes/gorgeon-des-machures-70cl.webp",
    150: "/images/products/sizes/gorgeon-des-machures-150cl.webp",
  },
  "fleche-ardente": {
    20: "/images/products/sizes/fleche-ardente-20cl.webp",
    50: "/images/products/sizes/fleche-ardente-50cl.webp",
    70: "/images/products/sizes/fleche-ardente-70cl.webp",
  },
  "essence-des-alpes": {
    20: "/images/products/sizes/essence-des-alpes-20cl.webp",
    50: "/images/products/sizes/essence-des-alpes-50cl.webp",
    70: "/images/products/sizes/essence-des-alpes-70cl.webp",
  },
  "nectar-ostara": {
    20: "/images/products/sizes/nectar-ostara-20cl.webp",
    50: "/images/products/sizes/nectar-ostara-50cl.webp",
    70: "/images/products/sizes/nectar-ostara-70cl.webp",
  },
  "lime-des-pres": {
    20: "/images/products/sizes/lime-des-pres-20cl.webp",
    50: "/images/products/sizes/lime-des-pres-50cl.webp",
    70: "/images/products/sizes/lime-des-pres-70cl.webp",
  },
  "cerf-gent": {
    20: "/images/products/sizes/cerf-gent-20cl.webp",
    70: "/images/products/sizes/cerf-gent-70cl.webp",
  },
  "pralicoquine": {
    20: "/images/products/sizes/pralicoquine-20cl.webp",
    70: "/images/products/sizes/pralicoquine-70cl.webp",
  },
  "menthor": {
    20: "/images/products/sizes/menthor-20cl.webp",
    70: "/images/products/sizes/menthor-70cl.webp",
  },
  "zeleste": {
    20: "/images/products/sizes/zeleste-20cl.webp",
    70: "/images/products/sizes/zeleste-70cl.webp",
  },
};

export const products: Product[] = [
  // === GAMME BRASSERIE DES PLANTES ===
  {
    slug: "alchimie-vegetale",
    wcId: 348,
    name: "L'Alchimie Végétale",
    range: "brasserie",
    priceMin: 22,
    priceMax: 115,
    image: "/images/products/alchimie-vegetale.png",
    image2: "/images/products/alchimie-vegetale-2.webp",
    alcohol: 50,
    composition: [
      "27 plantes, racines, écorces, fleurs et épices sélectionnées",
    ],
    usage: "Digestif de prestige",
    tagline: "27 plantes, racines, écorces et épices — un hommage à la Haute-Loire.",
    highlight: "Meilleur Digestif du Monde 2025",
    awards: ["Meilleur Digestif du Monde 2025 — World Drinks Awards"],
    description:
      "Notre liqueur de prestige. Macérat complexe inspiré des grandes liqueurs monastiques, L'Alchimie Végétale assemble 27 plantes, racines, écorces et épices choisies une à une pour leur équilibre. Trois ans de formulation, un hommage aux savoir-faire de la Haute-Loire — et une reconnaissance mondiale en 2025.",
    tasting: {
      nose: "Frais, herbacé, mentholé.",
      palate: "Notes citronnées en attaque, épicées en structure, avec une rondeur poivrée.",
      finish: "Longue, complexe, mentholée. Richesse aromatique persistante.",
    },
    serving: "À 3°C en digestif, après le repas. Ou un trait dans un café long.",
    sizes: CONTENANCES,
  },
  {
    slug: "herbe-des-druides",
    wcId: 70,
    name: "L'Herbe des Druides",
    range: "brasserie",
    priceMin: 16,
    priceMax: 75,
    image: "/images/products/herbe-des-druides.png",
    image2: "/images/products/herbe-des-druides-2.webp",
    alcohol: 28,
    composition: ["Verveine", "Serpolet (thym sauvage)", "Carvi (cumin des prés)"],
    usage: "Apéritif ou digestif",
    tagline: "La verveine dans sa version la plus noble — florale, sauvage, épicée.",
    highlight: "Multi-médaillée Lyon, Paris, Londres",
    awards: [
      "Médaille d'Or 2023 — Concours de Lyon",
      "Médaille d'Or 2024 — Concours de Lyon",
      "Médaille d'Or 2026 — Concours de Lyon",
      "Médaille d'Argent — Concours Général Agricole de Paris",
      "Médaille d'Argent 2025 — World Drinks Awards",
    ],
    description:
      "Notre best-seller. L'Herbe des Druides est une liqueur à la verveine, à 28°, adoucie par le serpolet (thym sauvage de nos pentes) et épicée par le carvi. Une expression florale, sauvage, où les notes épicées viennent tempérer l'alcool. À servir en apéritif avec un zeste, ou en digestif pur.",
    tasting: {
      nose: "Verveine citronnée, thym sauvage, touche anisée.",
      palate: "Florale et sauvage, les notes épicées adoucissent l'alcool.",
      finish: "Douce, mentholée, persistante.",
    },
    serving: "En apéritif givré, ou en digestif à température ambiante.",
    sizes: CONTENANCES,
  },
  {
    slug: "gorgeon-des-machures",
    wcId: 71,
    name: "Le Gorgeon des Machurés",
    range: "brasserie",
    priceMin: 17,
    priceMax: 77,
    image: "/images/products/gorgeon-des-machures.webp",
    image2: "/images/products/gorgeon-des-machures-2.webp",
    alcohol: 30,
    composition: ["Verveine", "Aurone", "Baraban", "Charbon végétal"],
    usage: "Digestif — verveine noire",
    tagline: "Hommage aux mineurs de Saint-Étienne — profond et mystérieux.",
    description:
      "Une verveine noire, colorée au charbon végétal, à boire en mémoire des Machurés — les mineurs de Saint-Étienne dont le visage était noir de poussière en fin de journée. Inspiration de trois recettes stéphanoises historiques, assemblage de verveine, aurone et baraban (pissenlit en patois auvergnat).",
    tasting: {
      nose: "Note d'Arquebuse en fond, racines, touche boisée.",
      palate: "Profonde et mystérieuse, légèrement poivrée, notes boisées de racine de pissenlit.",
      finish: "Longue, boisée, un rien fumée.",
    },
    serving: "Digestif à température ambiante.",
    sizes: CONTENANCES,
  },
  {
    slug: "fleche-ardente",
    wcId: 72,
    name: "La Flèche Ardente",
    range: "brasserie",
    priceMin: 16,
    priceMax: 34,
    image: "/images/products/fleche-ardente.png",
    image2: "/images/products/fleche-ardente-2.webp",
    alcohol: 27,
    composition: ["Cassis", "Framboises", "Myrtilles", "Fruits du dragon", "Vanille"],
    usage: "Digestif ou cocktail",
    tagline: "Bonbon aux fruits rouges, note vanillée en longueur.",
    description:
      "Une liqueur de fruits rouges qui évoque le bonbon d'enfance — cassis, framboise, myrtille et une pointe de fruit du dragon pour la surprise. La vanille tisse le fond et arrondit l'acidité des fruits. À 27°, elle se tient parfaitement en digestif mais fait merveille en cocktail (voir notre Philtre d'Éros).",
    tasting: {
      nose: "Fruits rouges mûrs, touche de vanille bourbon.",
      palate: "Bonbon, rond, gourmand.",
      finish: "Longue vanille, légèrement acidulée.",
    },
    serving: "Digestif ou long drink avec eau pétillante et menthe.",
    sizes: ["Empilable 20cl", "50cl", "70cl"],
  },
  {
    slug: "essence-des-alpes",
    wcId: 4042,
    name: "L'Essence des Alpes",
    range: "brasserie",
    priceMin: 17,
    priceMax: 36,
    image: "/images/products/essence-des-alpes.png",
    alcohol: 32,
    composition: [
      "Génépi bio (partenariat Barcelonnette)",
      "Liqueur d'épine de sapin",
      "Hysope",
    ],
    usage: "Digestif de montagne",
    tagline: "Un génépi dans la douceur — hysope, sapin, caractère montagnard.",
    description:
      "Un digestif de montagne. Génépi biologique en provenance d'un partenaire de Barcelonnette, marié à notre liqueur d'épine de sapin et à l'hysope — cette cousine de la lavande aux notes mentholées et camphrées. Douceur, fraîcheur, petite note résineuse de fond.",
    tasting: {
      nose: "Alpin, résineux, légèrement mentholé.",
      palate: "Génépi adouci, hysope fraîche, résine de sapin discrète.",
      finish: "Fraîche, camphrée, élégante.",
    },
    serving: "Digestif à température ambiante, ou très frais en été.",
    sizes: ["Empilable 20cl", "50cl", "70cl"],
  },
  {
    slug: "nectar-ostara",
    wcId: 65,
    name: "Le Nectar d'Ostara",
    range: "brasserie",
    priceMin: 16,
    priceMax: 34,
    image: "/images/products/nectar-ostara.png",
    image2: "/images/products/nectar-ostara-2.webp",
    alcohol: 24,
    composition: ["Fleur de sureau", "Bleuet", "Camomille"],
    usage: "Liqueur de fleurs — spritz, apéritif floral",
    tagline: "Très florale, très mielleuse, très ronde — pour les spritz de printemps.",
    description:
      "Notre liqueur la plus florale. Trois fleurs d'avril : sureau pour le pollen, bleuet pour la rondeur, camomille pour la tenue. Un Nectar d'Ostara très mielleux, très rond, à 24° — idéal en spritz ou en apéritif sans ajout.",
    tasting: {
      nose: "Pollen, miel d'acacia, touche d'amande.",
      palate: "Très florale, très ronde. Notes principales de pollen et de miel, secondaires d'agrumes, amandes et réglisse.",
      finish: "Douce, enveloppante.",
    },
    serving: "En spritz avec Prosecco et Mandarine Napoléon (cf. Spritz Efflorescent), ou pur à température ambiante.",
    sizes: ["Empilable 20cl", "50cl", "70cl"],
  },
  {
    slug: "lime-des-pres",
    wcId: 69,
    name: "La Lime des Prés",
    range: "brasserie",
    priceMin: 16,
    priceMax: 33,
    image: "/images/products/lime-des-pres.png",
    image2: "/images/products/lime-des-pres-2.webp",
    alcohol: 18,
    composition: ["Thym citron", "Mélisse", "Houblon"],
    usage: "Liqueur citronnée sans citron",
    tagline: "L'effet citron, sans le citron — thym citron, mélisse, houblon.",
    description:
      "Un tour de passe-passe botanique : une liqueur citronnée sans un gramme de citron réel. Le thym citron apporte l'attaque zestée, la mélisse la fraîcheur florale, le houblon l'amertume noble. Aucune acidité — juste une vague de prairie citronnée.",
    tasting: {
      nose: "Thym citron à l'attaque.",
      palate: "Vert, herbacé, sans acidité.",
      finish: "Longue, rafraîchissante, légèrement amère.",
    },
    serving: "À température ambiante avec glaçons, ou avec un trait de Porto blanc en apéritif.",
    sizes: ["Empilable 20cl", "50cl", "70cl"],
  },

  // === GAMME APÉRITIF ===
  {
    slug: "cerf-gent",
    wcId: 4030,
    name: "Le Cerf'Gent",
    range: "aperitif",
    priceMin: 16,
    priceMax: 27,
    image: "/images/products/cerf-gent.png",
    alcohol: 15,
    composition: [
      "Gentiane",
      "Quinquina",
      "Zestes de citron",
      "Noix de muscade",
      "Graines de coriandre",
      "Cannelle",
    ],
    usage: "Apéritif amer — alternative française à la Suze",
    tagline: "Notre alternative française à la Suze — gentiane, quinquina, épices.",
    highlight: "Médaille d'Or Paris 2025",
    awards: ["Médaille d'Or 2025 — Concours Général Agricole de Paris"],
    description:
      "Un apéritif amer pour amateurs. La gentiane donne la colonne, le quinquina la profondeur, les épices (muscade, coriandre, cannelle, zestes de citron) la complexité. Un caractère puissant, authentique, à la hauteur des grandes eaux-de-vie amères d'Auvergne.",
    tasting: {
      nose: "Gentiane, racines, zestes.",
      palate: "Amère franche, épicée, avec une touche d'orange amère.",
      finish: "Longue amertume noble.",
    },
    serving: "Très frais, en apéritif pur ou allongé d'un trait de tonic.",
    sizes: ["Empilable 20cl", "70cl"],
  },
  {
    slug: "pralicoquine",
    wcId: 2947,
    name: "La Pralicoquine",
    range: "aperitif",
    priceMin: 16,
    priceMax: 27,
    image: "/images/products/pralicoquine.png",
    alcohol: 15,
    composition: ["Pralines", "Amandes torréfiées macérées"],
    usage: "Apéritif gourmand ou digestif léger",
    tagline: "Onctueuse, gourmande — la praline et l'amande en liqueur.",
    description:
      "La liqueur plaisir. Pralines et amandes torréfiées macérées dans l'alcool — onctueuse, gourmande, très sympa à l'apéritif. Se prête aussi aux cocktails créatifs : kir pétillant, association gin, ou même une margherita avec un twist.",
    tasting: {
      nose: "Praline rose, amande grillée.",
      palate: "Onctueux, sucré, rond.",
      finish: "Amande grillée persistante.",
    },
    serving: "En apéritif pur, en cocktail, ou en digestif léger.",
    sizes: ["Empilable 20cl", "70cl"],
  },
  {
    slug: "menthor",
    wcId: 3617,
    name: "Le Menthor",
    range: "aperitif",
    priceMin: 16,
    priceMax: 27,
    image: "/images/products/menthor.png",
    alcohol: 17.5,
    composition: [
      "Menthe poivrée (fraîcheur dominante)",
      "Menthe coréenne (mentholée, épicée)",
      "Menthe verte (chlorophyllienne)",
    ],
    usage: "Mojitos, fin de repas",
    tagline: "Trois menthes en alliance — rafraîchissant et vivifiant.",
    description:
      "L'alternative artisanale à la menthe industrielle. Trois menthes s'associent : poivrée pour la fraîcheur dominante, coréenne pour la note épicée, verte pour l'assise chlorophyllienne. Tout en légèreté, tout en fraîcheur — parfait pour mojitos ou en fin de repas.",
    tasting: {
      nose: "Menthe poivrée éclatante.",
      palate: "Rafraîchissant, vivifiant, légèrement épicé.",
      finish: "Fraîche, longue.",
    },
    serving: "Frais en fin de repas, ou en base mojito maison.",
    sizes: ["Empilable 20cl", "70cl"],
  },
  {
    slug: "zeleste",
    wcId: 4037,
    name: "Le Zéleste",
    range: "aperitif",
    priceMin: 16,
    priceMax: 27,
    image: "/images/products/zeleste.png",
    alcohol: 17.5,
    composition: ["Citron jaune (zestes + jus)", "Orange", "Citron vert"],
    usage: "Apéritif frais — alternative au Limoncello",
    tagline: "Trio d'agrumes — change du Limoncello classique.",
    description:
      "Un trio d'agrumes : citron jaune, orange, citron vert — zestes et jus. Plus complexe qu'un Limoncello classique, avec une légère amertume en fond qui donne du caractère. L'originalité et la fraîcheur d'un apéritif distinct.",
    tasting: {
      nose: "Agrumes vifs, zestes frais.",
      palate: "Acidulé, légère amertume en fond.",
      finish: "Fraîche et nette.",
    },
    serving: "Très frais en apéritif, ou en long drink avec tonic.",
    sizes: ["Empilable 20cl", "70cl"],
  },

  // === LUMIÈRE OBSCURE (CBD) ===
  {
    slug: "menthe-cbd-ortie",
    wcId: 626,
    name: "Menthe CBD Ortie",
    range: "lumiere-obscure",
    priceMin: 16,
    priceMax: 34,
    image: "/images/products/menthe-cbd-ortie.png",
    alcohol: 21,
    composition: ["Menthe verte", "Chanvre (CBD, sans THC)", "Ortie"],
    usage: "Apéritif botanique au CBD",
    tagline: "Un thé à la menthe fermenté — menthe verte, chanvre, ortie.",
    description:
      "Le versant herbacé de notre gamme CBD. La menthe verte domine — on y retrouve la chlorophylle d'un thé à la menthe, adoucie par l'ortie et le chanvre. Exactement l'opposée du Menthor, qui mise lui sur la fraîcheur mentholée.",
    tasting: {
      nose: "Menthe verte, herbe fraîche.",
      palate: "Herbacé, thé à la menthe, assez doux.",
      finish: "Longue menthe verte.",
    },
    serving: "Apéritif, frais, en long drink ou pur.",
    sizes: ["Empilable 20cl", "50cl", "70cl"],
  },
  {
    slug: "verveine-cbd-aurone",
    wcId: 616,
    name: "Verveine CBD Aurone",
    range: "lumiere-obscure",
    priceMin: 17,
    priceMax: 34,
    image: "/images/products/verveine-cbd-aurone.png",
    alcohol: 30,
    composition: ["Verveine", "Aurone", "Chanvre (CBD, sans THC)"],
    usage: "Digestif botanique au CBD",
    tagline: "Verveine + aurone + chanvre — détente digestif.",
    description:
      "Un digestif au CBD. La verveine citronnée, l'aurone (cousine de l'absinthe, moins amère) et le chanvre s'associent pour une expérience en douceur. À 30°, c'est un vrai digestif, mais avec cette pointe de détente propre au CBD.",
    tasting: {
      nose: "Verveine citronnée, touche résineuse.",
      palate: "Verveine dominante, chanvre en fond.",
      finish: "Persistante, légèrement camphrée.",
    },
    serving: "Digestif, à température ambiante.",
    sizes: ["Empilable 20cl", "50cl", "70cl"],
  },
  {
    slug: "absinthe-cbd-citron",
    wcId: 629,
    name: "CBD Absinthe Citron",
    range: "lumiere-obscure",
    priceMin: 18,
    priceMax: 39,
    image: "/images/products/absinthe-cbd-citron.png",
    alcohol: 37,
    composition: [
      "Chanvre (CBD, dominant, sans THC)",
      "Absinthe",
      "Écorces de citron",
      "Graines de coriandre",
    ],
    usage: "Digestif botanique — pour amateurs de chanvre",
    tagline: "Chanvre dominant, absinthe en fond, agrumes — pour amateurs.",
    description:
      "Le plus marqué de la gamme Lumière Obscure. Le chanvre prend le dessus — on y perçoit nettement la note de foin vert, très particulière, pas pour tout le monde. L'absinthe apporte une structure mentholée et réglissée, les écorces de citron et la coriandre la fraîcheur nécessaire à l'équilibre.",
    tasting: {
      nose: "Chanvre, foin vert, citron.",
      palate: "Très verte, herbacée, avec l'absinthe en fond mentholé.",
      finish: "Chanvre persistant.",
    },
    serving: "Digestif, à température ambiante. Pour amateurs avertis.",
    sizes: ["Empilable 20cl", "50cl", "70cl"],
  },

  // === ÉDITIONS LIMITÉES ===
  {
    slug: "herbe-druides-fut-chene",
    wcId: 2553,
    name: "L'Herbe des Druides — Finition fût de chêne",
    range: "edition-limitee",
    priceMin: 50,
    priceMax: 50,
    image: "/images/products/herbe-druides-fut-chene.webp",
    alcohol: 28,
    composition: [
      "Verveine",
      "Serpolet",
      "Carvi",
      "Finition 6 mois en fût de chêne",
    ],
    usage: "Digestif — édition limitée",
    tagline: "Notre verveine, affinée six mois en fût de chêne.",
    description:
      "Une édition limitée qui passe six mois en fût de chêne français. Le bois arrondit les arômes de verveine, ajoute des notes de vanille et de caramel, transforme une liqueur vive en digestif suave. Quelques centaines de bouteilles par an, numérotées.",
    tasting: {
      nose: "Verveine intégrée, vanille, chêne grillé.",
      palate: "Rond, boisé, verveine adoucie.",
      finish: "Longue, chêne délicat, verveine persistante.",
    },
    serving: "Digestif, à température ambiante.",
    sizes: ["70cl"],
  },
  {
    slug: "alchimie-cuvee-michel",
    wcId: 2547,
    name: "L'Alchimie Végétale — Cuvée Michel",
    range: "edition-limitee",
    priceMin: 70,
    priceMax: 70,
    image: "/images/products/alchimie-cuvee-michel.webp",
    alcohol: 50,
    composition: ["27 plantes (assemblage Alchimie)", "Variation autour de la réglisse et de la gentiane"],
    usage: "Digestif de prestige — tirage confidentiel",
    tagline: "Hommage à un vieil ami — variation sur l'Alchimie, en tirage confidentiel.",
    description:
      "Notre cuvée hommage à Michel — vieil ami d'enfance disparu, qui aurait aimé ce prix du monde. Légère variation autour de la base de L'Alchimie Végétale, avec un surcroît de réglisse et de gentiane. Tirage confidentiel, quelques dizaines de bouteilles par an.",
    tasting: {
      nose: "Réglisse, plantes douces, mentholé.",
      palate: "Plus sombre que l'Alchimie classique, réglisse en milieu de bouche.",
      finish: "Gentiane longue, élégante.",
    },
    serving: "Digestif à 3°C, lentement.",
    sizes: ["70cl"],
  },

  // === ACCESSOIRES ===
  {
    slug: "coffret-initiation",
    wcId: 582,
    name: "Coffret Initiation",
    range: "accessoire",
    priceMin: 24,
    priceMax: 24,
    image: "/images/products/coffret-initiation.webp",
    alcohol: 0,
    composition: ["6 flacons de 4 cl — sélection Initiation"],
    usage: "Découverte ou cadeau",
    tagline: "Six flacons pour entrer dans l'univers de la Brasserie.",
    description:
      "Six de nos liqueurs signatures, en format 4 cl, présentées dans un écrin. Le meilleur moyen de découvrir la gamme ou de l'offrir.",
    serving: "À déguster en dégustation comparée.",
    sizes: ["6×4cl"],
  },
  {
    slug: "coffret-original",
    name: "Coffret Original",
    range: "accessoire",
    priceMin: 24,
    priceMax: 24,
    image: "/images/products/coffret-initiation.webp",
    alcohol: 0,
    composition: ["6 flacons de 4 cl — sélection Originale"],
    usage: "Découverte ou cadeau",
    tagline: "Une autre entrée dans la maison — six flacons d'originales.",
    description:
      "Notre second coffret de découverte, composé de six liqueurs de la maison en flacons de 4 cl. Un parcours différent de l'Initiation, pour compléter ou offrir.",
    serving: "À déguster en dégustation comparée.",
    sizes: ["6×4cl"],
  },
  {
    slug: "flasque-entonnoir",
    wcId: 402,
    wcSizeAttribute: "Gravure",
    name: "Flasque 20cl + Entonnoir",
    range: "accessoire",
    priceMin: 20,
    priceMax: 25,
    image: "/images/products/flasque-entonnoir.png",
    alcohol: 0,
    composition: [],
    usage: "Accessoire",
    tagline: "La flasque de poche, livrée avec son entonnoir.",
    description:
      "Flasque inox de 20cl avec son entonnoir, pour emporter votre liqueur préférée en randonnée, en bivouac, ou offrir l'élégance d'un objet utile.",
    sizes: ["20cl"],
  },
];

// Injection automatique des images par taille via la map SIZE_IMAGES
for (const p of products) {
  if (SIZE_IMAGES[p.slug]) {
    p.sizeImages = SIZE_IMAGES[p.slug];
  }
}

export const featuredProducts = [
  "alchimie-vegetale",
  "herbe-des-druides",
  "gorgeon-des-machures",
  "cerf-gent",
  "nectar-ostara",
  "fleche-ardente",
].map((slug) => products.find((p) => p.slug === slug)!);

export const productsBySlug = Object.fromEntries(
  products.map((p) => [p.slug, p])
);
