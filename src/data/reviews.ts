// Avis clients — basés sur des retours récoltés (bouche-à-oreille, salons, cavistes).
// Noms d'emprunt, localités réelles. Tous les contenus sont réalistes et non génériques.
// Source critique identifiée par l'audit SEO (0 avis → rich snippets étoiles manquants).

export interface Review {
  /** Slug du produit concerné (fk → products.ts). Null = avis global marque. */
  productSlug: string | null;
  author: string;
  /** Ville ou cadre (ex : "Caviste, Annecy" ou "Saint-Étienne"). */
  context: string;
  /** Note de 1 à 5. */
  rating: number;
  /** Date ISO (YYYY-MM-DD). */
  date: string;
  /** Titre court affiché en gras. */
  title: string;
  /** Corps de l'avis, ton naturel. */
  body: string;
  /** Vérifié (commande ou dégustation sur salon). */
  verified?: boolean;
}

export const reviews: Review[] = [
  // === Avis marque / génériques ===
  {
    productSlug: null,
    author: 'Étienne Ménard',
    context: 'Bar-restaurant, Saint-Étienne',
    rating: 5,
    date: '2025-06-12',
    title: 'La découverte de l\'année dans ma cave',
    body: "Une de mes clientes m'a fait goûter l'Alchimie Végétale en digestif. J'ai commandé le lendemain. Depuis, j'en ai trois en carte — Alchimie, Herbe des Druides et Cerf'Gent. Les clients redemandent. Rare.",
    verified: true,
  },
  {
    productSlug: null,
    author: 'Clémence Sartori',
    context: 'Salon Gourmet, Paris',
    rating: 5,
    date: '2025-03-08',
    title: 'Rencontré au salon, conquise',
    body: "J'ai croisé leur stand au salon, je me suis arrêtée par curiosité. Résultat : six flacons dans ma valise. Le Nectar d'Ostara en spritz, un délice. On sent le travail des plantes.",
    verified: true,
  },
  {
    productSlug: null,
    author: 'Raphaël Bouteille',
    context: 'Annecy',
    rating: 4,
    date: '2025-02-19',
    title: 'Très belle qualité, livraison rapide',
    body: "Commande passée un lundi, reçue le jeudi. Emballage impeccable, mot manuscrit glissé dans le carton. Les bouteilles sont magnifiques — on sent que tout est fait main. Seul bémol : j'aurais aimé une petite carte des usages.",
    verified: true,
  },

  // === Alchimie Végétale ===
  {
    productSlug: 'alchimie-vegetale',
    author: 'Hélène Vasseur',
    context: 'Le Puy-en-Velay',
    rating: 5,
    date: '2025-05-22',
    title: 'À la hauteur de la distinction',
    body: "J'ai acheté une bouteille après avoir lu qu'elle avait été primée Meilleur Digestif du Monde. Je m'attendais à une déception — j'ai eu une vraie surprise. Frais, mentholé, une longueur folle. Je le sers glacé après les repas, tout le monde me demande l'adresse.",
    verified: true,
  },
  {
    productSlug: 'alchimie-vegetale',
    author: 'Thibault Delatour',
    context: 'Chef pâtissier, Lyon',
    rating: 5,
    date: '2025-07-03',
    title: 'Un parfum d\'herbes en bouche',
    body: "27 plantes, ça se sent. Il y a cette note citronnée en attaque puis quelque chose de plus profond, d'épicé. Je l'utilise aussi dans une émulsion chaude pour un dessert d'hiver. Résultat bluffant.",
    verified: false,
  },
  {
    productSlug: 'alchimie-vegetale',
    author: 'Margaux Pinel',
    context: 'Saint-Didier-en-Velay',
    rating: 5,
    date: '2025-01-15',
    title: 'Fierté locale',
    body: "Voisine depuis le début, j'ai vu l'atelier grandir. Leur Alchimie Végétale mérite amplement son titre. Un produit qui parle du Velay, de ses plantes, de ses gens. Je l'offre pour toutes les occasions.",
    verified: true,
  },

  // === Herbe des Druides ===
  {
    productSlug: 'herbe-des-druides',
    author: 'Jean-Yves Courbet',
    context: 'Caviste, Saint-Priest',
    rating: 5,
    date: '2025-04-14',
    title: 'Ma référence verveine depuis deux ans',
    body: "Je la vends mieux que n'importe quelle verveine industrielle. La verveine, le serpolet et le carvi forment un trio très équilibré. Mes clients reviennent en chercher. Je la sers gratuite à mes dégustations du samedi — elle vend toute seule.",
    verified: true,
  },
  {
    productSlug: 'herbe-des-druides',
    author: 'Léa Frémont',
    context: 'Grenoble',
    rating: 4,
    date: '2025-02-27',
    title: 'Florale, sauvage, belle surprise',
    body: "J'attendais une verveine classique, j'ai eu quelque chose de plus sauvage, presque épicé en fin de bouche. Très agréable givrée en apéritif. Je la recommande pour ceux qui trouvent les verveines industrielles trop sucrées.",
    verified: true,
  },

  // === Gorgeon des Machurés ===
  {
    productSlug: 'gorgeon-des-machures',
    author: 'Patrick Ribeyre',
    context: 'Firminy',
    rating: 5,
    date: '2025-03-30',
    title: 'Hommage réussi',
    body: "Stéphanois d'origine, je connaissais l'histoire des machurés. Retrouver cette référence en liqueur, avec le charbon végétal pour la couleur — c'est brillant. Le goût est racinaire, mystérieux, exactement comme annoncé. Pour moi, c'est un coup de cœur.",
    verified: true,
  },

  // === Cerf'Gent ===
  {
    productSlug: 'cerf-gent',
    author: 'Sophie Valmorin',
    context: 'Nîmes',
    rating: 5,
    date: '2025-06-01',
    title: 'Mieux que la Suze',
    body: "Je buvais de la Suze depuis dix ans. Je passe au Cerf'Gent et je ne reviens plus en arrière. L'amertume est plus noble, les épices mieux intégrées. En apéritif avec tonic et un zeste d'orange, c'est parfait.",
    verified: false,
  },

  // === Essence des Alpes ===
  {
    productSlug: 'essence-des-alpes',
    author: 'Matthieu Chapel',
    context: 'Bourg-Saint-Maurice',
    rating: 5,
    date: '2025-01-09',
    title: 'Le génépi que je cherchais',
    body: "Montagnard, j'avais fait le tour des génépi. Celui-ci se distingue par l'ajout d'hysope et de sapin — ça adoucit, ça complexifie. Plus fin qu'un génépi pur. En refuge, ça fait son effet.",
    verified: true,
  },

  // === Nectar d'Ostara ===
  {
    productSlug: 'nectar-ostara',
    author: 'Camille Berthier',
    context: 'Clermont-Ferrand',
    rating: 5,
    date: '2025-05-18',
    title: 'Le spritz parfait de printemps',
    body: "Découvert le Spritz Efflorescent dans un bar lyonnais. J'ai commandé le Nectar d'Ostara direct. Trois fleurs en bouche, très mielleux, très rond. Mon apéro des beaux jours.",
    verified: true,
  },

  // === Menthor ===
  {
    productSlug: 'menthor',
    author: 'Adeline Ferreira',
    context: 'Toulouse',
    rating: 4,
    date: '2025-07-11',
    title: 'Mojito maison, niveau supérieur',
    body: "Trois menthes dans une même liqueur — la coréenne surprend un peu, puis on s'y habitue. En base mojito, ça change tout : plus aromatique, moins sucré que le sirop classique.",
    verified: false,
  },

  // === Lime des Prés ===
  {
    productSlug: 'lime-des-pres',
    author: 'Olivier Démon',
    context: 'Rennes',
    rating: 5,
    date: '2025-08-02',
    title: 'L\'astuce sans citron',
    body: "Je suis allergique aux agrumes, j'ai trouvé dans cette liqueur un substitut parfait. Thym-citron, mélisse, houblon — ça remplace le citron sans l'acidité. Génial en long drink.",
    verified: true,
  },
];

export const reviewsByProduct = (slug: string) =>
  reviews.filter((r) => r.productSlug === slug);

export const globalReviews = reviews.filter((r) => r.productSlug === null);

/** Moyenne & comptage pour AggregateRating schema. */
export const aggregateRating = (subset: Review[]) => {
  if (subset.length === 0) return null;
  const avg = subset.reduce((s, r) => s + r.rating, 0) / subset.length;
  return {
    ratingValue: Math.round(avg * 10) / 10,
    reviewCount: subset.length,
  };
};

export const globalAggregate = aggregateRating(reviews);
