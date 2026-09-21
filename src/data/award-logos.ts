/**
 * Logos officiels des concours.
 *
 * Les distinctions sont saisies en texte libre dans le frontmatter des fiches
 * produit (`awards: ["Médaille d'Or 2023 — Concours de Lyon", …]`), pour rester
 * éditables dans Sveltia sans structure imbriquée. Ce fichier fait le pont
 * entre ce libellé et le visuel officiel du concours.
 *
 * Quand un logo correspond, la fiche produit l'affiche à la place du laurier
 * dessiné. Sinon elle garde le laurier — rien ne disparaît jamais.
 *
 * AJOUTER UN LOGO
 * 1. Déposer le fichier dans `public/images/awards/` (WebP à fond transparent,
 *    500 px sur le grand côté).
 * 2. Ajouter une entrée ci-dessous. Chaque `match` combine des lookaheads :
 *    millésime + concours + niveau de médaille. Cette forme évite qu'une
 *    distinction en attrape une autre (un Or 2024 à Lyon et un Argent 2024 à
 *    Paris partagent l'année, jamais les deux autres critères).
 *
 * Visuels fournis par Guillaume le 21/09/2026, recadrés et convertis en WebP.
 */

export interface AwardLogo {
  /** Motif testé sur le libellé complet de la distinction. */
  match: RegExp;
  /** Chemin public du visuel. */
  logo: string;
  /** Texte alternatif — repris tel quel dans l'attribut alt. */
  alt: string;
}

export const awardLogos: AwardLogo[] = [
  // ─── World Liqueur Awards ────────────────────────────────────
  // Leurs libellés ne contiennent ni « Or » ni « Argent » : aucun risque de
  // collision avec les règles Lyon et CGA ci-dessous.
  {
    match: /meilleur digestif du monde/i,
    logo: '/images/awards/wla-2025-worlds-best-digestive.webp',
    alt: "World's Best Digestive 2025 — World Liqueur Awards",
  },
  {
    match: /meilleure liqueur de plantes française/i,
    logo: '/images/awards/wla-2026-france-herbal-winner.webp',
    alt: 'France Herbal Winner 2026 — World Liqueur Awards',
  },
  {
    match: /(?=.*2026)(?=.*(world drinks|world liqueur))(?=.*digestif)/i,
    logo: '/images/awards/wla-2026-france-digestive-winner.webp',
    alt: 'France Digestive Winner 2026 — World Liqueur Awards',
  },
  {
    match: /(?=.*2025)(?=.*(world drinks|world liqueur))(?=.*\bor\b)/i,
    logo: '/images/awards/wla-2025-gold.webp',
    alt: 'Gold 2025 — World Liqueur Awards',
  },
  {
    match: /(?=.*2025)(?=.*(world drinks|world liqueur))(?=.*argent)/i,
    logo: '/images/awards/wla-2025-silver.webp',
    alt: 'Silver 2025 — World Liqueur Awards',
  },
  {
    match: /(?=.*2026)(?=.*(world drinks|world liqueur))(?=.*argent)/i,
    logo: '/images/awards/wla-2026-silver.webp',
    alt: 'Silver 2026 — World Liqueur Awards',
  },

  // ─── Concours International de Lyon ──────────────────────────
  {
    match: /(?=.*2023)(?=.*lyon)(?=.*\bor\b)/i,
    logo: '/images/awards/lyon-2023-or.webp',
    alt: "Médaille d'Or 2023 — Concours International de Lyon",
  },
  {
    match: /(?=.*2024)(?=.*lyon)(?=.*\bor\b)/i,
    logo: '/images/awards/lyon-2024-or.webp',
    alt: "Médaille d'Or 2024 — Concours International de Lyon",
  },
  {
    match: /(?=.*2026)(?=.*lyon)(?=.*\bor\b)/i,
    logo: '/images/awards/lyon-2026-or.webp',
    alt: "Médaille d'Or 2026 — Concours International de Lyon",
  },
  {
    match: /(?=.*2026)(?=.*lyon)(?=.*argent)/i,
    logo: '/images/awards/lyon-2026-argent.webp',
    alt: "Médaille d'Argent 2026 — Concours International de Lyon",
  },

  // ─── Concours Général Agricole (Paris) ───────────────────────
  {
    match: /(?=.*2025)(?=.*agricole)(?=.*\bor\b)/i,
    logo: '/images/awards/cga-paris-2025-or.webp',
    alt: "Médaille d'Or 2025 — Concours Général Agricole de Paris",
  },
  {
    match: /(?=.*2024)(?=.*agricole)(?=.*argent)/i,
    logo: '/images/awards/cga-paris-2024-argent.webp',
    alt: "Médaille d'Argent 2024 — Concours Général Agricole de Paris",
  },
];

/** Renvoie le logo officiel d'une distinction, ou undefined si aucun ne correspond. */
export function findAwardLogo(award: string): AwardLogo | undefined {
  return awardLogos.find((l) => l.match.test(award));
}
