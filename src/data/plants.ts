// Inventaire (non exhaustif) des plantes et ingrédients botaniques utilisés
// dans la gamme La Brasserie des Plantes.
// Source : `src/content/products/*.md` (composition frontmatter) + catalogue pro.
//
// ⚠️ Ce fichier est la source de vérité pour /nos-plantes. Quand un produit
// ajoute / enlève un ingrédient, mettre à jour `usedIn` ici.
//
// Convention : certaines recettes reposent sur des ingrédients que nous
// préférons garder pour nous (secrets d'assemblage). Ce fichier en liste
// une bonne partie, pas la totalité.

export interface Plant {
  name: string;
  latin?: string;
  family: 'aromatique' | 'racine' | 'ecorce' | 'epice' | 'fleur' | 'agrume' | 'fruit' | 'autre';
  /** Rôle / profil dans l'assemblage — ce qu'elle apporte au nez ou en bouche. */
  role?: string;
  description: string;
  /** Produits qui utilisent cette plante. Libellés commerciaux exacts. */
  usedIn: string;
  season?: string;
  /** Signature = plante qui n'apparaît que dans une seule liqueur. */
  signature?: boolean;
}

export const plants: Plant[] = [
  // ═══ HERBES AROMATIQUES ═══════════════════════════════════════════════════
  {
    name: 'Verveine citronnelle',
    latin: 'Aloysia citrodora',
    family: 'aromatique',
    role: 'Fraîcheur citronnée · digestive',
    description:
      "Originaire d'Amérique du Sud, cultivée en France depuis le XVIIIᵉ siècle. Son parfum frais, citronné, apaisant, en fait la plante reine des digestifs. C'est notre plante la plus utilisée — elle est dans quatre de nos liqueurs.",
    usedIn: "L'Herbe des Druides, Herbe des Druides Fût de Chêne, Le Gorgeon des Machurés, Verveine CBD Aurone",
    season: 'Juin à septembre',
  },
  {
    name: 'Serpolet',
    latin: 'Thymus serpyllum',
    family: 'aromatique',
    role: 'Thym sauvage · profondeur épicée',
    description:
      "Cousin sauvage du thym commun, plus fin et plus floral. Il pousse à ras du sol sur les pelouses sèches de moyenne montagne. Présent dans notre trio signature avec la verveine et le carvi.",
    usedIn: "L'Herbe des Druides, Herbe des Druides Fût de Chêne, Le Gorgeon des Machurés",
    season: 'Juillet à août',
  },
  {
    name: 'Thym-citron',
    latin: 'Thymus × citriodorus',
    family: 'aromatique',
    role: 'Fraîcheur citronnée · léger',
    description:
      "Hybride rustique du thym commun et du thym à larges feuilles. Fraîcheur citronnée, légèreté — idéal pour allonger un spritz, pour un mojito revisité ou en accord estival.",
    usedIn: "La Lime des Prés",
    season: 'Mai à septembre',
    signature: true,
  },
  {
    name: 'Mélisse',
    latin: 'Melissa officinalis',
    family: 'aromatique',
    role: 'Douceur citronnée · miellée',
    description:
      "« Baume » en grec — la mélisse calme et désaltère. Notes douces de citron et de miel, apaisantes, très présentes dans les accords printaniers.",
    usedIn: "La Lime des Prés",
    season: 'Mai à octobre',
  },
  {
    name: 'Hysope',
    latin: 'Hyssopus officinalis',
    family: 'aromatique',
    role: 'Camphrée · alpine',
    description:
      "Plante médiévale des jardins monastiques, légèrement camphrée, un peu amère. Elle apporte de la profondeur et un caractère « alpin » aux assemblages de montagne.",
    usedIn: "L'Essence des Alpes",
    season: 'Juin à août',
    signature: true,
  },
  {
    name: 'Aurone',
    latin: 'Artemisia abrotanum',
    family: 'aromatique',
    role: 'Amer fin · fruit-bonbon',
    description:
      "Cousine de l'absinthe et de l'armoise. Moins amère, plus subtile — fruit-bonbon et citron à la fois. Longtemps utilisée en tisane fortifiante dans les campagnes auvergnates.",
    usedIn: "Le Gorgeon des Machurés, Verveine CBD Aurone",
    season: 'Juillet à septembre',
  },
  {
    name: 'Absinthe',
    latin: 'Artemisia absinthium',
    family: 'aromatique',
    role: 'Grande amère · profondeur',
    description:
      "La grande amère. Nous la travaillons avec mesure, en accord avec le citron et le CBD, pour une fraîcheur longue et mentholée qui n'étouffe rien.",
    usedIn: "CBD Absinthe Citron",
    season: 'Juillet à septembre',
    signature: true,
  },
  {
    name: 'Menthe poivrée',
    latin: 'Mentha × piperita',
    family: 'aromatique',
    role: 'Fraîcheur dominante · puissance',
    description:
      "Deux cent cinquante variétés de menthes existent ; nous retenons la poivrée pour sa puissance et son éclat. Dominante de notre triple-menthe.",
    usedIn: "Le Menthor",
    season: 'Juin à septembre',
    signature: true,
  },
  {
    name: 'Menthe coréenne',
    latin: 'Agastache rugosa',
    family: 'aromatique',
    role: 'Mentholée · légèrement anisée',
    description:
      "Plus rare, plus épicée — la menthe coréenne complète la poivrée avec un léger goût anisé, presque réglissé. L'accord fait toute la richesse du Menthor.",
    usedIn: "Le Menthor",
    season: 'Juillet à septembre',
    signature: true,
  },
  {
    name: 'Menthe verte',
    latin: 'Mentha spicata',
    family: 'aromatique',
    role: 'Chlorophyllienne · fraîche',
    description:
      "La plus douce des menthes. Chlorophyllienne, désaltérante, fraîche sans piquer. Elle signe l'équilibre de deux de nos liqueurs — dont une CBD.",
    usedIn: "Le Menthor, Menthe CBD Ortie",
    season: 'Juin à septembre',
  },
  {
    name: 'Ortie',
    latin: 'Urtica dioica',
    family: 'aromatique',
    role: 'Verte · minérale',
    description:
      "Mauvaise herbe mal-aimée, mais chargée de minéraux et d'une saveur verte inimitable. Cuite ou macérée, elle perd son piquant et révèle un goût subtil de thé vert, presque iodé.",
    usedIn: "Menthe CBD Ortie",
    season: 'Avril à juillet',
    signature: true,
  },
  {
    name: 'Baraban',
    latin: 'Taraxacum officinale',
    family: 'aromatique',
    role: 'Amer · terreux',
    description:
      "Un des noms vernaculaires du pissenlit. On travaille surtout ses feuilles, amères et terreuses — une amertume de sous-bois, de terre humide de printemps.",
    usedIn: "Le Gorgeon des Machurés",
    season: 'Mars à mai',
    signature: true,
  },
  {
    name: 'Génépi',
    latin: 'Artemisia genipi',
    family: 'aromatique',
    role: 'Montagnard · amer fin',
    description:
      "Plante reine des Alpes. Nous le travaillons en partenariat avec un cueilleur de Barcelonnette. Amertume noble, caractère minéral, profil très recherché en digestif de montagne.",
    usedIn: "L'Essence des Alpes",
    season: 'Juillet à août',
    signature: true,
  },
  {
    name: 'Épine de sapin',
    latin: 'Abies alba',
    family: 'aromatique',
    role: 'Résineux · boisé',
    description:
      "Les jeunes pousses d'épicéa, cueillies au printemps quand elles sont encore tendres. Elles apportent un boisé résineux, presque balsamique, qui ancre les accords alpins.",
    usedIn: "L'Essence des Alpes",
    season: 'Avril à juin',
    signature: true,
  },

  // ═══ FLEURS ══════════════════════════════════════════════════════════════
  {
    name: 'Fleur de sureau',
    latin: 'Sambucus nigra',
    family: 'fleur',
    role: 'Floral · miellé',
    description:
      "Petits ombelles blanches qui fleurissent début juin. Arôme floral, miellé, presque muscaté. Cueillies au plus près de l'atelier, elles signent notre liqueur d'Ostara.",
    usedIn: "Le Nectar d'Ostara",
    season: 'Fin mai à juin',
    signature: true,
  },
  {
    name: 'Bleuet',
    latin: 'Centaurea cyanus',
    family: 'fleur',
    role: 'Floral · herbacé',
    description:
      "La fleur bleue des moissons, presque disparue des blés conventionnels, que les producteurs bio remettent à l'honneur. Profil floral discret, légèrement herbacé — une caresse visuelle et aromatique.",
    usedIn: "Le Nectar d'Ostara",
    season: 'Juin à août',
    signature: true,
  },
  {
    name: 'Camomille',
    latin: 'Matricaria chamomilla',
    family: 'fleur',
    role: 'Douce · pomme',
    description:
      "La camomille matricaire, à l'arôme rappelant la pomme mûre. Douce, apaisante, elle vient arrondir l'accord floral du Nectar d'Ostara.",
    usedIn: "Le Nectar d'Ostara",
    season: 'Mai à septembre',
    signature: true,
  },

  // ═══ RACINES & AMERS ═════════════════════════════════════════════════════
  {
    name: 'Gentiane jaune',
    latin: 'Gentiana lutea',
    family: 'racine',
    role: 'Amer franc · colonne vertébrale',
    description:
      "La grande racine des hauts pâturages (Cantal, Jura, Alpes). Amertume franche, profonde, presque végétale — c'est elle qui donne à notre apéritif sa colonne vertébrale, en accord avec le quinquina.",
    usedIn: "Le Cerf'Gent",
    season: 'Récolte de septembre à novembre',
    signature: true,
  },
  {
    name: 'Quinquina',
    latin: 'Cinchona officinalis',
    family: 'ecorce',
    role: 'Amer tonique',
    description:
      "L'écorce emblématique des apéritifs amers classiques (Dubonnet, Lillet…). Nous la marions à la gentiane pour un profil apéritif à boire givré ou en tonic — profondeur amère, finale tonique.",
    usedIn: "Le Cerf'Gent",
    season: "Importée d'Amérique du Sud",
    signature: true,
  },
  {
    name: 'Réglisse',
    latin: 'Glycyrrhiza glabra',
    family: 'racine',
    role: 'Douceur · rondeur',
    description:
      "Pour la douceur et la rondeur. Utilisée en quantité mesurée, elle enveloppe les amers et arrondit les agrumes. Au cœur de la variation Cuvée Michel — hommage numéroté à l'Alchimie Végétale.",
    usedIn: "L'Alchimie Cuvée Michel",
    season: 'Récolte en automne',
    signature: true,
  },
  {
    name: 'Houblon',
    latin: 'Humulus lupulus',
    family: 'autre',
    role: 'Amertume noble · herbacée',
    description:
      "La plante des brasseurs. Cônes femelles, séchés, qui apportent une amertume noble, herbacée, légèrement résineuse. Dans notre Lime des Prés, il joue le rôle que la peau du citron joue dans d'autres recettes.",
    usedIn: "La Lime des Prés",
    season: 'Récolte en août-septembre',
    signature: true,
  },

  // ═══ AGRUMES ═════════════════════════════════════════════════════════════
  {
    name: 'Citron jaune',
    latin: 'Citrus limon',
    family: 'agrume',
    role: 'Zestes · jus · acidulé',
    description:
      "Zestes pour la richesse aromatique, jus pour l'acidité. Utilisé dans notre trio d'agrumes (Zéleste), dans le Cerf'Gent pour équilibrer l'amer, et en écorces dans notre liqueur CBD citron.",
    usedIn: "Le Zéleste, Le Cerf'Gent, CBD Absinthe Citron",
    season: "Toute l'année",
  },
  {
    name: 'Orange',
    latin: 'Citrus sinensis',
    family: 'agrume',
    role: 'Zestes · chaleur sucrée',
    description:
      "Des écorces plutôt que du jus, pour leur chaleur sucrée et leurs huiles essentielles. Elles arrondissent l'accord agrumes du Zéleste.",
    usedIn: "Le Zéleste",
    season: "Toute l'année",
    signature: true,
  },
  {
    name: 'Citron vert',
    latin: 'Citrus aurantiifolia',
    family: 'agrume',
    role: 'Vivacité · acidité',
    description:
      "Plus acide que le citron jaune, plus floral aussi. Le troisième pilier du trio d'agrumes — c'est lui qui apporte la vivacité finale au Zéleste.",
    usedIn: "Le Zéleste",
    season: "Toute l'année",
    signature: true,
  },

  // ═══ ÉPICES ══════════════════════════════════════════════════════════════
  {
    name: 'Carvi',
    latin: 'Carum carvi',
    family: 'epice',
    role: 'Anisé · chaleur',
    description:
      "Aussi appelé cumin des prés, ou anis des prés. Ses graines, longuement macérées, offrent une chaleur anisée et légèrement mentholée. Un incontournable des liqueurs de tradition auvergnate.",
    usedIn: "L'Herbe des Druides, Herbe des Druides Fût de Chêne, Le Gorgeon des Machurés",
    season: 'Récolte en juillet',
  },
  {
    name: 'Coriandre',
    latin: 'Coriandrum sativum',
    family: 'epice',
    role: 'Citronnée · épicée',
    description:
      "Les graines plutôt que les feuilles. Elles apportent un profil complexe, à la fois citronné et épicé, qui sert de liant dans les accords amers et dans notre liqueur CBD citron.",
    usedIn: "Le Cerf'Gent, CBD Absinthe Citron",
    season: 'Récolte en août',
  },
  {
    name: 'Cannelle',
    latin: 'Cinnamomum verum',
    family: 'epice',
    role: 'Chaleur · bois',
    description:
      "Cannelle de Ceylan, plus fine que la cannelle chinoise (Cassia). Elle apporte la chaleur boisée qui structure l'amer apéritif du Cerf'Gent.",
    usedIn: "Le Cerf'Gent",
    season: 'Importée',
    signature: true,
  },
  {
    name: 'Muscade',
    latin: 'Myristica fragrans',
    family: 'epice',
    role: 'Épicée · balsamique',
    description:
      "La noix de muscade, râpée fraîche avant macération. Sa chaleur balsamique complète la cannelle dans l'assemblage du Cerf'Gent.",
    usedIn: "Le Cerf'Gent",
    season: 'Importée',
    signature: true,
  },
  {
    name: 'Vanille',
    latin: 'Vanilla planifolia',
    family: 'epice',
    role: 'Crémeuse · sucrée',
    description:
      "Gousse fendue, macérée longuement. Elle enveloppe les fruits rouges de notre Flèche Ardente d'une douceur crémeuse — pour un digestif qui se boit autant sur glace que sur un dessert au chocolat.",
    usedIn: "La Flèche Ardente",
    season: 'Importée de Madagascar',
    signature: true,
  },

  // ═══ FRUITS ══════════════════════════════════════════════════════════════
  {
    name: 'Cassis',
    latin: 'Ribes nigrum',
    family: 'fruit',
    role: 'Fruit rouge · puissant',
    description:
      "Le fruit rouge le plus intense de notre gamme. Macéré entier, il apporte une profondeur sombre, presque tannique, qui porte tout l'assemblage de la Flèche Ardente.",
    usedIn: "La Flèche Ardente",
    season: 'Récolte en juillet',
    signature: true,
  },
  {
    name: 'Framboise',
    latin: 'Rubus idaeus',
    family: 'fruit',
    role: 'Fruit rouge · acidulé',
    description:
      "Petite baie acidulée qui vient équilibrer le cassis. Notes fraîches, légèrement florales — la framboise allège sans affaiblir l'accord fruit rouge.",
    usedIn: "La Flèche Ardente",
    season: 'Juin à septembre',
    signature: true,
  },
  {
    name: 'Myrtille',
    latin: 'Vaccinium myrtillus',
    family: 'fruit',
    role: 'Fruit rouge · doux',
    description:
      "Cueillie sauvage dans les forêts du Velay. Son profil doux, légèrement boisé, complète le trio de fruits rouges — un clin d'œil au terroir de Haute-Loire.",
    usedIn: "La Flèche Ardente",
    season: 'Juillet à août',
    signature: true,
  },
  {
    name: 'Pitaya',
    latin: 'Hylocereus undatus',
    family: 'fruit',
    role: 'Fruit exotique · rond',
    description:
      "Le fruit du dragon — chair rose nacrée, goût doux entre la poire et le kiwi. Touche exotique qui rehausse le trio de fruits rouges de la Flèche Ardente, sans jamais voler la vedette aux baies locales.",
    usedIn: "La Flèche Ardente",
    signature: true,
  },
  {
    name: 'Amande',
    latin: 'Prunus dulcis',
    family: 'fruit',
    role: 'Praline · gourmand',
    description:
      "Travaillée en praline — amandes caramélisées longuement pour obtenir des notes chaudes de caramel et de fruits secs. Signature de la Pralicoquine, notre apéritif gourmand qui dialogue aussi bien avec un café qu'avec un dessert au chocolat.",
    usedIn: "La Pralicoquine",
    signature: true,
  },

  // ═══ SPÉCIALITÉS ═════════════════════════════════════════════════════════
  {
    name: 'Chanvre (CBD)',
    latin: 'Cannabis sativa L.',
    family: 'autre',
    role: 'Terpènes · relaxant',
    description:
      "Variétés de chanvre certifiées sans THC (< 0,1 %, conformément à la réglementation française). Nous travaillons le CBD pour ses terpènes végétaux — pas pour un effet psychoactif, mais pour un accord botanique cohérent avec nos plantes. Trois liqueurs dédiées dans la gamme Lumière Obscure.",
    usedIn: "Verveine CBD Aurone, Menthe CBD Ortie, CBD Absinthe Citron",
    season: 'Récolte en septembre-octobre',
  },
];
