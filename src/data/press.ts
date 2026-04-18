// Revue de presse — toutes les mentions externes vérifiées de La Brasserie des Plantes.
// Utilisé pour la page /presse et pour générer des rich snippets (AI citations).

export type PressMediaType = 'press' | 'tv' | 'radio' | 'institutional' | 'specialist' | 'award';

export interface PressMention {
  title: string;
  source: string;
  url: string;
  date: string;      // ISO YYYY-MM-DD ou YYYY-MM si jour inconnu
  type: PressMediaType;
  /** Extrait court pour la carte. */
  excerpt: string;
  /** Produit central si l'article se concentre sur un. */
  productFocus?: string;
}

export const pressMentions: PressMention[] = [
  // === 2025 — année des distinctions ===
  {
    title: "World's Best Digestive 2025 — L'Alchimie Végétale / Elixir de Plantes",
    source: 'World Liqueur Awards (officiel)',
    url: 'https://www.worldliqueurawards.com/winner-liqueur/worlds-best-digestive-58512-world-liqueur-awards-2025',
    date: '2025-04-17',
    type: 'award',
    excerpt: "Fiche officielle du titre Meilleur Digestif du Monde 2025 décerné à L'Alchimie Végétale par les World Drinks Awards à Londres.",
    productFocus: "L'Alchimie Végétale",
  },
  {
    title: "La Brasserie des Plantes élue meilleur digestif au monde",
    source: 'Zoomdici',
    url: 'https://www.zoomdici.fr/actualite/la-brasserie-des-plantes-elu-meilleur-digestif-au-monde',
    date: '2025-06-14',
    type: 'press',
    excerpt: "Zoomdici revient sur quatre ans de R&D et l'assemblage de 27 plantes qui ont mené au titre mondial.",
  },
  {
    title: "Cette liqueur produite à 1h de Lyon vient d'être élue meilleur digestif du monde",
    source: 'Le Bonbon Lyon',
    url: 'https://www.lebonbon.fr/lyon/actu/liqueur-alchimie-vegetale-brasserie-plantes-meilleur-digestif-monde/',
    date: '2025-06-11',
    type: 'press',
    excerpt: "Antoine Lebrun pose l'angle géographique : la proximité lyonnaise d'une maison artisanale primée au niveau mondial.",
  },
  {
    title: "Nos artisans ont du talent — une liqueur de plantes élue meilleur digestif du monde",
    source: 'M Lyon',
    url: 'https://mlyon.fr/news/locales/222400/nos-artisans-ont-du-talent-pres-de-lyon-une-liqueur-de-plantes-a-ete-elue-meilleur-digestif-du-monde',
    date: '2025-06-17',
    type: 'press',
    excerpt: "M Lyon élargit au savoir-faire et rappelle que L'Herbe des Druides avait déjà été distinguée meilleure verveine artisanale 2023-2024.",
  },
  {
    title: "Offrez-vous les liqueurs et digestifs multi-médaillés de la Brasserie des Plantes",
    source: 'La Commère 43',
    url: 'https://www.lacommere43.fr/component/k2/item/78621-offrez-vous-les-liqueurs-et-digestifs-multi-medailles-de-la-brasserie-des-plantes.html',
    date: '2025-12-10',
    type: 'press',
    excerpt: "Guide cadeaux de fin d'année qui récapitule l'ensemble du palmarès : deux ors Lyon, un argent Paris, un or Salon de l'Agriculture, un Meilleur Digestif du Monde.",
  },

  // === 2023-2024 — croissance et distinctions régionales ===
  {
    title: "Avec leur brasserie de plantes, deux copains de Haute-Loire remettent la liqueur au goût du jour",
    source: 'France 3 Auvergne-Rhône-Alpes',
    url: 'https://france3-regions.franceinfo.fr/auvergne-rhone-alpes/haute-loire/avec-leur-brasserie-de-plantes-deux-copains-de-haute-loire-remettent-la-liqueur-au-gout-du-jour-2852657.html',
    date: '2023-06-18',
    type: 'tv',
    excerpt: "Reportage TV régional sur l'histoire d'amitié d'enfance entre Étienne et Guillaume et le choix de revaloriser les plantes oubliées du Velay.",
  },
  {
    title: "La Brasserie des Plantes à Saint-Didier-en-Velay — La Bonne Adresse",
    source: 'France Bleu Saint-Étienne Loire',
    url: 'https://www.francebleu.fr/emissions/la-bonne-adresse/la-brasserie-des-plantes-a-didier-en-velay-6025481',
    date: '2023-09-12',
    type: 'radio',
    excerpt: "Visite radiophonique de l'atelier dans la rubrique La Bonne Adresse, à l'occasion des deux ans de l'entreprise.",
  },
  {
    title: "Verveine, serpolet et carvi : les plantes du Velay se transforment en liqueurs d'exception",
    source: 'France Bleu Saint-Étienne Loire',
    url: 'https://www.francebleu.fr/emissions/le-produit-du-jour-et-sa-recette/verveine-serpolet-et-carvi-les-plantes-du-velay-se-transforment-en-liqueurs-d-exception-a-saint-didier-en-velay-1357034',
    date: '2023-10-04',
    type: 'radio',
    excerpt: "Le Produit du Jour s'attarde sur L'Herbe des Druides et le dialogue verveine-serpolet-carvi.",
    productFocus: "L'Herbe des Druides",
  },
  {
    title: "Artinov Haute-Loire 2023 — Lauréat Innovation de savoir-faire",
    source: 'CMA Auvergne-Rhône-Alpes (vidéo)',
    url: 'https://www.youtube.com/watch?v=-BUIyIrTeCY',
    date: '2023-11-28',
    type: 'tv',
    excerpt: "Vidéo officielle de la Chambre de Métiers et de l'Artisanat sur notre système de tirage pression pour liqueur végétale, lauréat Artinov 2023.",
  },
  {
    title: "Cinq artisans de Haute-Loire primés au concours Artinov",
    source: 'La Commère 43',
    url: 'https://www.lacommere43.fr/actualites/item/61048-cinq-artisans-de-haute-loire-primes-au-concours-artinov.html',
    date: '2023-11-30',
    type: 'press',
    excerpt: "Couverture des cinq lauréats Artinov 2023, dont La Brasserie des Plantes en catégorie Innovation de savoir-faire.",
  },
  {
    title: "Saint-Didier-en-Velay : la Brasserie des plantes reçoit une médaille d'or au concours de Lyon",
    source: 'La Commère 43',
    url: 'https://www.lacommere43.fr/loire-semene/item/55129-saint-didier-en-velay-la-brasserie-des-plantes-recoit-une-medaille-d-or-au-concours-de-lyon.html',
    date: '2023-03-22',
    type: 'press',
    excerpt: "Première médaille d'or internationale — L'Herbe des Druides primée au Concours International de Lyon.",
    productFocus: "L'Herbe des Druides",
  },
  {
    title: "La Brasserie des Plantes — Saint-Didier-en-Velay (vidéo atelier)",
    source: 'Haute-Loire Tourisme (Facebook)',
    url: 'https://www.facebook.com/haute.loire.tourisme/videos/la-brasserie-des-plantes-saint-didier-en-velay-09-10-2023/369282688888834/',
    date: '2023-10-09',
    type: 'institutional',
    excerpt: "Visite filmée de l'atelier par l'office de tourisme de Haute-Loire, publiée sur leur page Facebook officielle.",
  },
  {
    title: "La Brasserie des Plantes : l'art de redonner vie aux plantes oubliées",
    source: 'Loire Semène Tourisme',
    url: 'https://www.facebook.com/LoireSemeneTourisme/posts/1520307696397328/',
    date: '2023-07-08',
    type: 'institutional',
    excerpt: "Post éditorial de l'office de tourisme communautaire sur notre mission de revaloriser les plantes médicinales locales.",
  },

  // === 2022 — portraits de curateurs ===
  {
    title: "La brasserie des plantes",
    source: 'Likora (blog spécialisé)',
    url: 'https://likora.fr/2022/04/13/la-brasserie-des-plantes/',
    date: '2022-04-13',
    type: 'specialist',
    excerpt: "Première couverture par un curateur artisan-spiritueux national, avec fiches de dégustation détaillées par référence.",
  },
  {
    title: "La Brasserie des Plantes : des liqueurs artisanales à base de plantes oubliées",
    source: 'Velay Attractivité',
    url: 'https://www.velay-attractivite.fr/la-brasserie-des-plantes-des-liqueurs-artisanales-a-base-de-plantes-oubliees',
    date: '2022-09-15',
    type: 'institutional',
    excerpt: "Portrait institutionnel par l'agence d'attractivité territoriale du Velay, angle développement local.",
  },

  // === 2021 — les débuts ===
  {
    title: "Entreprenariat : des liqueurs artisanales à base de plantes oubliées",
    source: 'Réussir — Agriculture Massif Central',
    url: 'https://www.reussir.fr/agriculture-massif-central/des-liqueurs-artisanales-base-de-plantes-oubliees',
    date: '2021-05-04',
    type: 'press',
    excerpt: "Notre tout premier article de presse. Réussir (presse agricole nationale) couvre la création de l'entreprise, l'angle filière courte et plantes oubliées.",
  },
  {
    title: "Saint-Didier-en-Velay : la Brasserie des Plantes débouche sur trois liqueurs artisanales",
    source: 'La Commère 43',
    url: 'https://www.lacommere43.fr/loire-semene/item/41201-saint-didier-en-velay-la-brasserie-des-plantes-debouche-sur-trois-liqueurs-artisanales.html',
    date: '2021-07-22',
    type: 'press',
    excerpt: "Article de lancement : les trois premières références (L'Herbe des Druides, Le Gorgeon des Machurés, L'Alchimie Végétale).",
  },
];

// Groupement par année pour la page presse
export const pressByYear = pressMentions.reduce<Record<string, PressMention[]>>((acc, m) => {
  const year = m.date.slice(0, 4);
  (acc[year] ||= []).push(m);
  return acc;
}, {});

export const pressYearsDesc = Object.keys(pressByYear).sort((a, b) => b.localeCompare(a));

export const typeLabels: Record<PressMediaType, string> = {
  press: 'Presse écrite',
  tv: 'Télévision / vidéo',
  radio: 'Radio',
  institutional: 'Institutionnel',
  specialist: 'Curateur spécialisé',
  award: 'Concours & distinctions',
};

export const typeIcons: Record<PressMediaType, string> = {
  press: 'newspaper',
  tv: 'video',
  radio: 'radio',
  institutional: 'building',
  specialist: 'star',
  award: 'trophy',
};
