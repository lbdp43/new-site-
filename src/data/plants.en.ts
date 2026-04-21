// English translations for the plants used in our liqueurs.
// Keyed by the French name (from plants.ts). Keep keys in sync.

export const familyLabelsEn: Record<string, string> = {
  aromatique: 'Aromatic herb',
  racine: 'Root',
  ecorce: 'Bark',
  epice: 'Spice',
  fleur: 'Flower',
  agrume: 'Citrus',
  fruit: 'Fruit',
  autre: 'Specialty',
};

export interface PlantEn {
  role?: string;
  description: string;
  usedIn: string;
  season?: string;
}

export const plantsEn: Record<string, PlantEn> = {
  'Verveine citronnelle': {
    role: 'Lemony freshness · digestive',
    description:
      "Native to South America, cultivated in France since the 18th century. Its fresh, lemony, soothing aroma makes it the queen of digestifs. It's our most-used plant — it goes into four of our liqueurs.",
    usedIn: "L'Herbe des Druides, Herbe des Druides Oak Cask, Le Gorgeon des Machurés, Verveine CBD Aurone",
    season: 'June to September',
  },
  'Serpolet': {
    role: 'Wild thyme · spiced depth',
    description:
      "The wild thyme of our Velay highlands. Finer and more floral than common thyme, it grows flat on alpine pasture. Present in our signature trio with verbena and caraway.",
    usedIn: "L'Herbe des Druides, Herbe des Druides Oak Cask, Le Gorgeon des Machurés",
    season: 'July to August',
  },
  'Thym-citron': {
    role: 'Lemony freshness · light',
    description:
      "A rustic hybrid of common thyme and broad-leaf thyme. Lemony freshness, lightness — ideal to lengthen a spritz, for a revisited mojito or in a summer pairing.",
    usedIn: "La Lime des Prés",
    season: 'May to September',
  },
  'Mélisse': {
    role: 'Soft lemony · honeyed',
    description:
      "\"Balm\" in Greek — lemon balm both calms and refreshes. Soft notes of lemon and honey, soothing, very present in our spring compositions.",
    usedIn: "La Lime des Prés",
    season: 'May to October',
  },
  'Hysope': {
    role: 'Camphorated · alpine',
    description:
      "A medieval plant from monastic gardens, lightly camphorated, a touch bitter. It brings depth and an \"alpine\" character to our mountain blends.",
    usedIn: "L'Essence des Alpes",
    season: 'June to August',
  },
  'Aurone': {
    role: 'Fine bitter · fruit-candy',
    description:
      "A cousin to absinthe and wormwood. Less bitter, more subtle — fruit-candy and citrus at the same time. Long used as a tonic infusion in Auvergne countryside.",
    usedIn: "Le Gorgeon des Machurés, Verveine CBD Aurone",
    season: 'July to September',
  },
  'Absinthe': {
    role: 'Great bitter · depth',
    description:
      "The great bitter. We work it with restraint, in accord with lemon and CBD, for a long, mentholated freshness that never overwhelms.",
    usedIn: "CBD Absinthe Citron",
    season: 'July to September',
  },
  'Menthe poivrée': {
    role: 'Dominant freshness · power',
    description:
      "Two hundred and fifty mint varieties exist; we choose peppermint for its power and sparkle. The dominant note of our triple-mint.",
    usedIn: "Le Menthor",
    season: 'June to September',
  },
  'Menthe coréenne': {
    role: 'Mentholated · lightly aniseed',
    description:
      "Rarer, more spiced — Korean mint complements peppermint with a faintly aniseed, almost liquorice edge. The accord is what gives Le Menthor its depth.",
    usedIn: "Le Menthor",
    season: 'July to September',
  },
  'Menthe verte': {
    role: 'Chlorophyllic · fresh',
    description:
      "The softest of mints. Chlorophyllic, thirst-quenching, fresh without biting. It balances two of our liqueurs — including one with CBD.",
    usedIn: "Le Menthor, Menthe CBD Ortie",
    season: 'June to September',
  },
  'Ortie': {
    role: 'Green · mineral',
    description:
      "An unloved weed, yet mineral-rich and with an unmistakable green flavour. Cooked or macerated, it loses its sting and reveals a subtle green-tea taste, almost iodic.",
    usedIn: "Menthe CBD Ortie",
    season: 'April to July',
  },
  'Baraban': {
    role: 'Bitter · earthy',
    description:
      "The Auvergnat name for dandelion. We work mainly its leaves — bitter and earthy, an undergrowth bitterness, like damp spring soil. Locally foraged.",
    usedIn: "Le Gorgeon des Machurés",
    season: 'March to May',
  },
  'Génépi': {
    role: 'Mountain · fine bitter',
    description:
      "The queen plant of the Alps. We work it in partnership with a forager from Barcelonnette. Noble bitterness, mineral character, highly sought-after profile for mountain digestifs.",
    usedIn: "L'Essence des Alpes",
    season: 'July to August',
  },
  'Épine de sapin': {
    role: 'Resinous · woody',
    description:
      "Young spruce shoots, picked in spring while still tender. They add a resinous, almost balsamic woodiness that anchors our alpine blends.",
    usedIn: "L'Essence des Alpes",
    season: 'April to June',
  },
  'Fleur de sureau': {
    role: 'Floral · honeyed',
    description:
      "Small white umbels that bloom in early June. Floral, honeyed aroma, almost muscat. Picked close to the workshop, they define our Nectar d'Ostara.",
    usedIn: "Le Nectar d'Ostara",
    season: 'Late May to June',
  },
  'Bleuet': {
    role: 'Floral · herbaceous',
    description:
      "Cornflower — the blue flower of wheat fields, almost lost in conventional cereals, brought back by organic growers. Discreet, slightly herbaceous floral profile — a visual and aromatic caress.",
    usedIn: "Le Nectar d'Ostara",
    season: 'June to August',
  },
  'Camomille': {
    role: 'Soft · apple',
    description:
      "German chamomile, whose aroma recalls ripe apple. Soft, soothing — it rounds off the floral accord of Nectar d'Ostara.",
    usedIn: "Le Nectar d'Ostara",
    season: 'May to September',
  },
  'Gentiane jaune': {
    role: 'Frank bitter · backbone',
    description:
      "The great root of the Auvergne mountains. Frank, deep, almost vegetal bitterness — it gives our aperitif its backbone, paired with cinchona bark.",
    usedIn: "Le Cerf'Gent",
    season: 'Harvest September to November',
  },
  'Quinquina': {
    role: 'Tonic bitter',
    description:
      "The iconic bark of classic bitter aperitifs (Dubonnet, Lillet…). We pair it with gentian for a chilled or tonic-served aperitif — bitter depth, tonic finish.",
    usedIn: "Le Cerf'Gent",
    season: 'Imported from South America',
  },
  'Réglisse': {
    role: 'Sweetness · roundness',
    description:
      "For sweetness and roundness. Used in measured amounts, it wraps bitters and rounds citrus. At the heart of our Cuvée Michel — a numbered tribute to L'Alchimie Végétale.",
    usedIn: "L'Alchimie Cuvée Michel",
    season: 'Autumn harvest',
  },
  'Houblon': {
    role: 'Noble bitterness · herbaceous',
    description:
      "The brewer's plant. Dried female cones that bring a noble, herbaceous bitterness, slightly resinous. In La Lime des Prés, it plays the role lemon peel plays in other recipes.",
    usedIn: "La Lime des Prés",
    season: 'Harvest August-September',
  },
  'Citron jaune': {
    role: 'Zest · juice · tangy',
    description:
      "Zest for aromatic richness, juice for acidity. Used in our citrus trio (Zéleste), in Cerf'Gent to balance the bitter, and as peels in our CBD citrus liqueur.",
    usedIn: "Le Zéleste, Le Cerf'Gent, CBD Absinthe Citron",
    season: 'Year-round',
  },
  'Orange': {
    role: 'Zest · sweet warmth',
    description:
      "Peels rather than juice, for their sweet warmth and essential oils. They round off the citrus accord of Le Zéleste.",
    usedIn: "Le Zéleste",
    season: 'Year-round',
  },
  'Citron vert': {
    role: 'Vivacity · acidity',
    description:
      "More acidic than yellow lemon, more floral too. The third pillar of our citrus trio — it brings the final vivacity to Le Zéleste.",
    usedIn: "Le Zéleste",
    season: 'Year-round',
  },
  'Carvi': {
    role: 'Aniseed · warmth',
    description:
      "Also called meadow caraway, or meadow anise. Its seeds, after long maceration, offer an aniseed warmth with a light mentholated edge. A staple of traditional Auvergnat liqueurs.",
    usedIn: "L'Herbe des Druides, Herbe des Druides Oak Cask, Le Gorgeon des Machurés",
    season: 'Harvested in July',
  },
  'Coriandre': {
    role: 'Citrus · spiced',
    description:
      "Seeds rather than leaves. They bring a complex profile, both citrusy and spiced, which serves as a binder in our bitter accords and in our CBD citrus liqueur.",
    usedIn: "Le Cerf'Gent, CBD Absinthe Citron",
    season: 'Harvested in August',
  },
  'Cannelle': {
    role: 'Warmth · wood',
    description:
      "Ceylon cinnamon, finer than Chinese cassia. It brings the woody warmth that structures the bitter aperitif profile of Cerf'Gent.",
    usedIn: "Le Cerf'Gent",
    season: 'Imported',
  },
  'Muscade': {
    role: 'Spiced · balsamic',
    description:
      "Nutmeg, freshly grated before maceration. Its balsamic warmth complements cinnamon in the Cerf'Gent blend.",
    usedIn: "Le Cerf'Gent",
    season: 'Imported',
  },
  'Vanille': {
    role: 'Creamy · sweet',
    description:
      "Split pod, macerated slowly. It wraps the red fruits of our Flèche Ardente in a creamy softness — for a digestif that works both on ice and with a chocolate dessert.",
    usedIn: "La Flèche Ardente",
    season: 'Imported from Madagascar',
  },
  'Cassis': {
    role: 'Red fruit · powerful',
    description:
      "The most intense red fruit in our range. Macerated whole, it brings a dark, almost tannic depth that carries the whole Flèche Ardente blend.",
    usedIn: "La Flèche Ardente",
    season: 'Harvest in July',
  },
  'Framboise': {
    role: 'Red fruit · tangy',
    description:
      "A small, tangy berry that balances blackcurrant. Fresh, slightly floral notes — raspberry lightens the blend without weakening the red-fruit accord.",
    usedIn: "La Flèche Ardente",
    season: 'June to September',
  },
  'Myrtille': {
    role: 'Red fruit · sweet',
    description:
      "Wild-foraged in Velay forests. Its sweet, faintly woody profile rounds off the red-fruit trio — a nod to the Haute-Loire terroir.",
    usedIn: "La Flèche Ardente",
    season: 'July to August',
  },
  'Pitaya': {
    role: 'Exotic fruit · round',
    description:
      "Dragon fruit — pearly pink flesh, a mellow flavour between pear and kiwi. An exotic touch that lifts the red-fruit trio of La Flèche Ardente without ever stealing the show from the local berries.",
    usedIn: "La Flèche Ardente",
  },
  'Amande': {
    role: 'Praline · gourmand',
    description:
      "Worked as praline — almonds slowly caramelised to reach warm notes of toffee and dried fruit. The signature of La Pralicoquine, our gourmand aperitif that sits just as naturally next to an espresso as a chocolate dessert.",
    usedIn: "La Pralicoquine",
  },
  'Chanvre (CBD)': {
    role: 'Terpenes · relaxing',
    description:
      "Hemp varieties certified THC-free (< 0.1% per French regulation). We work CBD for its vegetal terpenes — not for a psychoactive effect, but for a botanical accord consistent with our plants. Three dedicated liqueurs in the Lumière Obscure range.",
    usedIn: "Verveine CBD Aurone, Menthe CBD Ortie, CBD Absinthe Citron",
    season: 'Harvest September-October',
  },
};
