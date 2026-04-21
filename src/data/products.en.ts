// English translations for the 20 products.
// Keyed by product slug (from products.ts).
//
// Product NAMES are kept in French (brand identity — see Q2 decision).
// This file only contains translated user-facing strings: composition,
// tagline, awards, description, tasting notes, serving, usage, highlight.

export interface ProductEn {
  /** English subtitle shown below the FR name */
  subtitle?: string;
  composition?: string[];
  usage?: string;
  tagline?: string;
  highlight?: string;
  awards?: string[];
  description?: string;
  tasting?: {
    nose?: string;
    palate?: string;
    finish?: string;
  };
  serving?: string;
}

export const productsEn: Record<string, ProductEn> = {
  // ===== BRASSERIE (SIGNATURE) =====

  'alchimie-vegetale': {
    subtitle: 'The award-winning digestif — 27 plants',
    composition: ['27 plants, roots, barks, flowers and spices, carefully selected'],
    usage: 'Prestige digestif',
    tagline: '27 plants, roots, barks and spices — a tribute to Haute-Loire.',
    highlight: 'World\'s Best Digestif 2025',
    awards: ['World\'s Best Digestif 2025 — World Drinks Awards'],
    description:
      "Our prestige liqueur. A complex maceration inspired by the great monastic liqueurs, L'Alchimie Végétale assembles 27 plants, roots, barks and spices chosen one by one for their balance. Three years of formulation, a tribute to the know-how of Haute-Loire — and international recognition in 2025.",
    tasting: {
      nose: 'Fresh, herbaceous, mentholated.',
      palate: 'Citrus on the attack, spice on the structure, with a peppery roundness.',
      finish: 'Long, complex, mentholated. Persistent aromatic richness.',
    },
    serving: 'At 3°C as a digestif, after the meal. Or a dash in a long espresso.',
  },

  'herbe-des-druides': {
    subtitle: 'Verbena — multi-award-winning',
    composition: ['Lemon verbena', 'Wild thyme (serpolet)', 'Caraway'],
    usage: 'Aperitif or digestif',
    tagline: 'Verbena at its noblest — floral, wild, spiced.',
    highlight: 'Multi-award: Lyon, Paris, London',
    awards: [
      'Gold Medal 2023 — Lyon International Competition',
      'Gold Medal 2024 — Lyon International Competition',
      'Gold Medal 2026 — Lyon International Competition',
      'Silver Medal — Paris Agricultural Competition',
      'Silver Medal 2025 — World Drinks Awards',
    ],
    description:
      "Our best-seller. L'Herbe des Druides is a 28% verbena liqueur, softened by wild thyme (serpolet from our hillsides) and spiced with caraway. A floral, wild expression, where the spicy notes temper the alcohol. Serve chilled as an aperitif with a zest, or neat as a digestif.",
    tasting: {
      nose: 'Lemon verbena, wild thyme, a touch of anise.',
      palate: 'Floral and wild — spicy notes soften the alcohol.',
      finish: 'Soft, mentholated, persistent.',
    },
    serving: 'Chilled as an aperitif, or at room temperature as a digestif.',
  },

  'gorgeon-des-machures': {
    subtitle: 'Black verbena — miners\' tribute',
    composition: ['Verbena', 'Southernwood', 'Dandelion root', 'Activated charcoal'],
    usage: 'Digestif — black verbena',
    tagline: 'A tribute to the Saint-Étienne miners — deep and mysterious.',
    description:
      "A black verbena, coloured with activated charcoal, to drink in memory of the Machurés — the Saint-Étienne miners whose faces were black with coal dust at the end of the day. Inspired by three historic recipes from Saint-Étienne, blending verbena, southernwood and baraban (dandelion in local dialect).",
    tasting: {
      nose: 'Hint of Arquebuse in the background, roots, a touch of wood.',
      palate: 'Deep and mysterious, slightly peppery, woody dandelion root notes.',
      finish: 'Long, woody, slightly smoky.',
    },
    serving: 'Digestif at room temperature.',
  },

  'fleche-ardente': {
    subtitle: 'Red fruit liqueur with vanilla',
    composition: ['Blackcurrant', 'Raspberry', 'Blueberry', 'Dragon fruit', 'Vanilla'],
    usage: 'Digestif or cocktail',
    tagline: 'Red-fruit candy with a long vanilla note.',
    description:
      "A red-fruit liqueur that evokes childhood sweets — blackcurrant, raspberry, blueberry and a hint of dragon fruit for surprise. Vanilla weaves through the back and rounds out the fruit's acidity. At 27%, it stands perfectly as a digestif but shines in cocktails (see our Philtre d'Éros).",
    tasting: {
      nose: 'Ripe red fruits, a touch of bourbon vanilla.',
      palate: 'Candy-like, round, indulgent.',
      finish: 'Long vanilla, lightly tangy.',
    },
    serving: 'Digestif or long drink with sparkling water and mint.',
  },

  'essence-des-alpes': {
    subtitle: 'Mountain digestif — genepi & hyssop',
    composition: [
      'Organic genepi (from our partner in Barcelonnette)',
      'Fir bud liqueur',
      'Hyssop',
    ],
    usage: 'Mountain digestif',
    tagline: 'Softened genepi — hyssop, fir, a mountain character.',
    highlight: 'Silver Medal 2026 — Lyon',
    awards: [
      'Silver Medal 2026 — Lyon International Competition',
    ],
    description:
      "A mountain digestif. Organic genepi from a partner in Barcelonnette, married to our fir bud liqueur and to hyssop — that cousin of lavender with mentholated, camphorated notes. Softness, freshness, a discreet resinous note at the bottom.",
    tasting: {
      nose: 'Alpine, resinous, lightly mentholated.',
      palate: 'Softened genepi, fresh hyssop, discreet fir resin.',
      finish: 'Fresh, camphorated, elegant.',
    },
    serving: 'Digestif at room temperature, or very cold in summer.',
  },

  'nectar-ostara': {
    subtitle: 'Spring flower liqueur',
    composition: ['Elderflower', 'Cornflower', 'Chamomile'],
    usage: 'Flower liqueur — spritz, floral aperitif',
    tagline: 'Very floral, very honeyed, very round — perfect for spring spritz.',
    description:
      "Our most floral liqueur. Three April flowers: elder for the pollen, cornflower for the roundness, chamomile for the backbone. A very honeyed, very round Nectar d'Ostara at 24% — ideal in a spritz or neat as an aperitif.",
    tasting: {
      nose: 'Pollen, acacia honey, a touch of almond.',
      palate: 'Very floral, very round. Primary notes of pollen and honey, secondary of citrus, almond and liquorice.',
      finish: 'Soft, enveloping.',
    },
    serving: "Spritz with Prosecco and Mandarine Napoléon (see Spritz Efflorescent), or neat at room temperature.",
  },

  'lime-des-pres': {
    subtitle: 'Lemon without lemon — meadow freshness',
    composition: ['Lemon thyme', 'Lemon balm', 'Hops'],
    usage: 'Lemony liqueur — without lemon',
    tagline: 'The lemon effect, without the lemon — lemon thyme, lemon balm, hops.',
    description:
      "A botanical sleight of hand: a lemony liqueur without a single gram of real lemon. Lemon thyme brings the zesty attack, lemon balm brings the floral freshness, hops the noble bitterness. No acidity — just a wave of lemon-scented meadow.",
    tasting: {
      nose: 'Lemon thyme on the attack.',
      palate: 'Green, herbaceous, no acidity.',
      finish: 'Long, refreshing, lightly bitter.',
    },
    serving: 'At room temperature over ice, or with a dash of white Port as an aperitif.',
  },

  // ===== APERITIFS =====

  'cerf-gent': {
    subtitle: 'French bitter aperitif — gentian & cinchona',
    composition: ['Gentian', 'Cinchona', 'Lemon zest', 'Nutmeg', 'Coriander seeds', 'Cinnamon'],
    usage: 'Bitter aperitif — the French answer to Suze',
    tagline: 'Our French alternative to Suze — gentian, cinchona, spices.',
    highlight: 'Gold Medal Paris 2025',
    awards: ['Gold Medal 2025 — Paris Agricultural Competition'],
    description:
      "A bitter aperitif for connoisseurs. Gentian provides the spine, cinchona the depth, the spices (nutmeg, coriander, cinnamon, lemon zest) the complexity. A powerful, authentic character, worthy of the great bitter spirits of Auvergne.",
    tasting: {
      nose: 'Gentian, roots, zest.',
      palate: 'Straight bitter, spiced, with a touch of bitter orange.',
      finish: 'Long, noble bitterness.',
    },
    serving: 'Very cold, as an aperitif, neat or lengthened with a splash of tonic.',
  },

  'pralicoquine': {
    subtitle: 'Praline & almond liqueur',
    composition: ['Pink pralines', 'Macerated roasted almonds'],
    usage: 'Indulgent aperitif or light digestif',
    tagline: 'Silky, indulgent — praline and almond in a bottle.',
    description:
      "The pleasure liqueur. Pralines and roasted almonds macerated in alcohol — silky, indulgent, very easy-drinking as an aperitif. Also excellent in creative cocktails: sparkling kir, gin-based drinks, even a twisted margarita.",
    tasting: {
      nose: 'Pink praline, toasted almond.',
      palate: 'Creamy, sweet, round.',
      finish: 'Lingering toasted almond.',
    },
    serving: 'Neat as aperitif, in cocktails, or as a light digestif.',
  },

  'menthor': {
    subtitle: 'Triple mint aperitif',
    composition: [
      'Peppermint (dominant freshness)',
      'Korean mint (mentholated, spiced)',
      'Spearmint (chlorophyll-rich)',
    ],
    usage: 'Mojitos, end of meal',
    tagline: 'Three mints in alliance — refreshing and invigorating.',
    description:
      "The artisan alternative to industrial mint liqueur. Three mints come together: peppermint for dominant freshness, Korean mint for the spicy note, spearmint for the chlorophyll backbone. All lightness, all freshness — perfect for mojitos or at the end of a meal.",
    tasting: {
      nose: 'Bright peppermint.',
      palate: 'Refreshing, invigorating, lightly spiced.',
      finish: 'Fresh, long.',
    },
    serving: 'Chilled at the end of a meal, or as a base for homemade mojitos.',
  },

  'zeleste': {
    subtitle: 'Citrus trio aperitif',
    composition: ['Lemon (zest + juice)', 'Orange', 'Lime'],
    usage: 'Fresh aperitif — alternative to Limoncello',
    tagline: 'Citrus trio — a change from classic Limoncello.',
    description:
      "A trio of citrus: lemon, orange, lime — zests and juices. More complex than a classic Limoncello, with a subtle underlying bitterness that gives it character. The originality and freshness of a distinctive aperitif.",
    tasting: {
      nose: 'Bright citrus, fresh zest.',
      palate: 'Tangy, with a light bitterness at the back.',
      finish: 'Fresh and clean.',
    },
    serving: 'Very cold as an aperitif, or as a long drink with tonic.',
  },

  // ===== LUMIÈRE OBSCURE (CBD) =====

  'menthe-cbd-ortie': {
    subtitle: 'Spearmint & hemp aperitif',
    composition: ['Spearmint', 'Hemp (CBD, no THC)', 'Nettle'],
    usage: 'Botanical aperitif with CBD',
    tagline: 'A fermented mint tea — spearmint, hemp, nettle.',
    description:
      "The herbaceous side of our CBD range. Spearmint dominates — you find the chlorophyll of a mint tea, softened by nettle and hemp. Exactly the opposite of Menthor, which plays on mentholated freshness.",
    tasting: {
      nose: 'Spearmint, fresh grass.',
      palate: 'Herbaceous, mint tea, quite soft.',
      finish: 'Long spearmint.',
    },
    serving: 'Aperitif, chilled, as a long drink or neat.',
  },

  'verveine-cbd-aurone': {
    subtitle: 'Verbena & hemp digestif',
    composition: ['Verbena', 'Southernwood', 'Hemp (CBD, no THC)'],
    usage: 'Botanical digestif with CBD',
    tagline: 'Verbena + southernwood + hemp — relaxing digestif.',
    description:
      "A CBD digestif. Lemon verbena, southernwood (a cousin of wormwood, less bitter) and hemp come together for a smooth experience. At 30%, it is a true digestif, but with that touch of relaxation that CBD brings.",
    tasting: {
      nose: 'Lemon verbena, a resinous hint.',
      palate: 'Dominant verbena, hemp in the background.',
      finish: 'Persistent, lightly camphorated.',
    },
    serving: 'Digestif, at room temperature.',
  },

  'absinthe-cbd-citron': {
    subtitle: 'Hemp-forward botanical digestif',
    composition: [
      'Hemp (CBD, dominant, no THC)',
      'Wormwood (absinthe)',
      'Lemon peel',
      'Coriander seeds',
    ],
    usage: 'Botanical digestif — for hemp enthusiasts',
    tagline: 'Hemp-forward, wormwood in the background, citrus — for enthusiasts.',
    description:
      "The most assertive of the Lumière Obscure range. Hemp takes the lead — you clearly feel the distinctive green-hay note, not for everyone. Wormwood brings a mentholated, liquorice structure; lemon peel and coriander the freshness needed for balance.",
    tasting: {
      nose: 'Hemp, green hay, lemon.',
      palate: 'Very green, herbaceous, with wormwood as a mentholated backbone.',
      finish: 'Persistent hemp.',
    },
    serving: 'Digestif, at room temperature. For informed enthusiasts.',
  },

  // ===== LIMITED EDITIONS =====

  'herbe-druides-fut-chene': {
    subtitle: 'Oak-cask-aged verbena — limited edition',
    composition: ['Verbena', 'Wild thyme', 'Caraway', 'Six months of oak-cask finishing'],
    usage: 'Digestif — limited edition',
    tagline: 'Our verbena, aged six months in French oak.',
    description:
      "A limited edition that spends six months in French oak casks. The wood rounds the verbena aromas, adds notes of vanilla and caramel, transforms a lively liqueur into a smooth digestif. A few hundred numbered bottles per year.",
    tasting: {
      nose: 'Integrated verbena, vanilla, toasted oak.',
      palate: 'Round, woody, softened verbena.',
      finish: 'Long, delicate oak, persistent verbena.',
    },
    serving: 'Digestif, at room temperature.',
  },

  'alchimie-cuvee-michel': {
    subtitle: 'Tribute cuvée — confidential release',
    composition: ['27 plants (Alchimie blend)', 'Variation around liquorice and gentian'],
    usage: 'Prestige digestif — confidential release',
    tagline: 'A tribute to an old friend — a variation on Alchimie, in confidential release.',
    description:
      "Our tribute cuvée to Michel — a childhood friend now gone, who would have enjoyed this world award. A gentle variation on the Alchimie Végétale base, with an extra touch of liquorice and gentian. Confidential release, a few dozen bottles per year.",
    tasting: {
      nose: 'Liquorice, soft plants, mentholated.',
      palate: 'Darker than the classic Alchimie, liquorice mid-palate.',
      finish: 'Long gentian, elegant.',
    },
    serving: 'Digestif at 3°C, slowly.',
  },

  // ===== ACCESSORIES =====

  'coffret-initiation': {
    subtitle: 'Six-flask discovery set',
    composition: ['6 × 4 cl flasks — Initiation selection'],
    usage: 'Discovery or gift',
    tagline: 'Six flasks to step into the world of La Brasserie.',
    description:
      'Six of our signature liqueurs, in 4 cl format, presented in a gift case. The best way to discover the range or give it.',
    serving: 'Best enjoyed as a comparative tasting.',
  },

  'flasque-entonnoir': {
    subtitle: 'Pocket flask + funnel',
    composition: [],
    usage: 'Accessory',
    tagline: 'The pocket flask, delivered with its funnel.',
    description:
      '20 cl stainless-steel flask with its funnel, to carry your favourite liqueur on a hike, a bivouac, or to offer the elegance of a useful object.',
  },
};
