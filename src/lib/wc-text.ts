/**
 * Décodage des entités HTML renvoyées par WooCommerce.
 *
 * La Store API renvoie ses libellés **échappés en HTML**, parce que le front
 * WordPress les injecte tels quels dans la page. Exemples relevés le
 * 22/09/2026 sur de vraies commandes :
 *
 *   "Mariage Aurore &amp; Damien"          (nom d'un tarif de livraison)
 *   "L&#8217;ALCHIMIE VÉGÉTALE - 70cl"     (apostrophe typographique)
 *   "… - 70cl &times; 1"                   (meta de ligne de livraison)
 *
 * React, lui, échappe déjà ce qu'il affiche : écrire `{r.name}` dans du JSX
 * produit littéralement « Mariage Aurore &amp; Damien » à l'écran. Il faut
 * donc décoder avant de rendre — signalé par Guillaume le 22/09/2026.
 *
 * ⚠️ Volontairement SANS DOM. L'astuce classique (`textarea.innerHTML = s`)
 * ne marche pas au rendu serveur des îles Astro (`document` n'existe pas au
 * build) et fait transiter du texte d'origine externe par un parseur HTML.
 * Ici, on ne construit jamais de HTML : on remplace des motifs par du texte.
 *
 * ⚠️ Un seul passage de remplacement, jamais en boucle : « &amp;times; » doit
 * donner « &times; » (le client a vraiment tapé ça), pas « × ». Un double
 * décodage rouvrirait la porte à l'injection que WooCommerce a fermée.
 */

/** Entités nommées réellement produites par WooCommerce et ses extensions. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  times: "×",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  euro: "€",
  deg: "°",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
  ugrave: "ù",
  ocirc: "ô",
  ecirc: "ê",
  icirc: "î",
  acirc: "â",
  ucirc: "û",
};

const ENTITY_PATTERN = /&(#[Xx][0-9A-Fa-f]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g;

/**
 * Rend lisible un libellé venu de WooCommerce.
 *
 * Les entités inconnues sont **laissées telles quelles** plutôt que
 * supprimées : mieux vaut afficher `&frac12;` que de faire disparaître
 * silencieusement un morceau du nom d'un produit.
 */
export function decodeEntities(input: string | null | undefined): string {
  if (!input) return "";
  if (!input.includes("&")) return input;

  return input.replace(ENTITY_PATTERN, (match, body: string) => {
    if (body.charCodeAt(0) === 35 /* # */) {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);

      // On refuse les points de code invalides ou de substitution, qui
      // produiraient un caractère de remplacement illisible.
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      if (code >= 0xd800 && code <= 0xdfff) return match;

      return String.fromCodePoint(code);
    }

    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}
