/**
 * Traduit `vercel.json` en fichiers de configuration Cloudflare Pages.
 *
 * Génère `public/_redirects` et `public/_headers`, que Astro recopie dans
 * `dist/` au build. Cloudflare Pages les lit à la racine du dossier publié ;
 * Vercel les ignore. Les deux plateformes peuvent donc cohabiter pendant la
 * phase de test, sans branche ni build séparé.
 *
 * Pourquoi un script plutôt qu'une écriture à la main : les 44 redirections
 * sont le filet de sécurité SEO du jour de la bascule. Une seule oubliée en
 * recopiant = une page qui tombe en 404 et un positionnement perdu. En
 * dérivant du fichier source, la traduction est vérifiable (voir
 * `verify-cloudflare-config.mjs`) et se rejoue si `vercel.json` change.
 *
 * Usage : node scripts/generate-cloudflare-config.mjs
 *
 * ⚠️ Deux règles de `vercel.json` n'ont PAS d'équivalent dans ces fichiers,
 * parce que le format Cloudflare ne sait pas conditionner par nom d'hôte.
 * Elles sont à recréer en Transform Rules dans le tableau de bord Cloudflare
 * — voir `docs/cloudflare-pages.md`.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf-8'));

// ---------------------------------------------------------------- redirects

/**
 * Vercel : `/shop/x/:path*` matche `/shop/x`, `/shop/x/` ET `/shop/x/a/b`
 * (le modificateur `*` accepte zéro segment, et le `/` qui précède est
 * optionnel). Cloudflare : `/shop/x/*` ne matche PAS `/shop/x` tout court.
 * Il faut donc émettre DEUX lignes par règle `:path*` — sinon l'URL sans
 * slash final, qui est justement celle que WordPress publie, tomberait en
 * 404 le jour de la bascule.
 */
function toCloudflare(source) {
  const m = source.match(/^(.*?)\/:path\*$/);
  if (m) {
    const base = m[1] || '';
    return [base || '/', `${base}/*`];
  }
  // Source exacte. On émet les DEUX formes, avec et sans slash final :
  // WordPress publie ses permaliens AVEC slash final (`/boutique/x/`), donc
  // c'est cette forme-là que Google a indexée et qui arrivera le jour de la
  // bascule. Ne pas se reposer sur une éventuelle normalisation de Cloudflare
  // pour une règle dont dépend le référencement.
  if (source === '/') return ['/'];
  const bare = source.replace(/\/$/, '');
  return [bare, `${bare}/`];
}

const seen = new Set();
const dynamic = [];
const statik = [];

for (const r of vercel.redirects ?? []) {
  const code = r.permanent === false ? 302 : 301;
  for (const src of toCloudflare(r.source)) {
    const line = `${src}  ${r.destination}  ${code}`;
    if (seen.has(src)) continue;
    seen.add(src);
    (src.includes('*') ? dynamic : statik).push(line);
  }
}

// Cloudflare évalue de haut en bas, première règle gagnante. On place donc
// les règles exactes AVANT les règles à joker : `/shop/la-fleche-ardente`
// doit gagner sur un éventuel `/shop/*`.
const redirects = [
  '# Généré par scripts/generate-cloudflare-config.mjs — ne pas éditer à la main.',
  '# Source de vérité : vercel.json. Régénérer après toute modification.',
  '#',
  '# Cloudflare évalue de haut en bas, première règle gagnante :',
  '# les règles exactes passent avant les règles à joker.',
  '',
  `# --- ${statik.length} règles exactes ---`,
  ...statik,
  '',
  `# --- ${dynamic.length} règles à joker ---`,
  ...dynamic,
  '',
].join('\n');

writeFileSync(join(root, 'public/_redirects'), redirects);

// ------------------------------------------------------------------ headers

const skipped = [];
const blocks = [];

for (const h of vercel.headers ?? []) {
  if (h.has) {
    // Condition par nom d'hôte : impossible dans `_headers`. On la signale
    // au lieu de la perdre silencieusement.
    skipped.push(h);
    continue;
  }
  // `/(.*)` (regex Vercel) et `/images/:path*` → `/*` et `/images/*`
  const source = h.source
    .replace(/^\/\(\.\*\)$/, '/*')
    .replace(/\/:path\*$/, '/*');
  blocks.push([source, ...h.headers.map((k) => `  ${k.key}: ${k.value}`)].join('\n'));
}

const headers = [
  '# Généré par scripts/generate-cloudflare-config.mjs — ne pas éditer à la main.',
  '# Source de vérité : vercel.json. Régénérer après toute modification.',
  '#',
  `# ⚠️ ${skipped.length} règle(s) de vercel.json ne sont PAS reprises ici :`,
  ...skipped.map(
    (h) =>
      `#    ${h.source} quand host = ${h.has.map((c) => c.value).join(', ')} → ` +
      h.headers.map((k) => `${k.key}: ${k.value}`).join(' ; '),
  ),
  '#    `_headers` ne sait pas conditionner par nom d\'hôte. À recréer en',
  '#    Transform Rule dans le tableau de bord Cloudflare — voir',
  '#    docs/cloudflare-pages.md.',
  '',
  ...blocks,
  '',
].join('\n');

writeFileSync(join(root, 'public/_headers'), headers);

console.log(
  `[cloudflare] _redirects : ${statik.length} exactes + ${dynamic.length} à joker ` +
    `(limites Cloudflare : 2100 et 100)`,
);
console.log(`[cloudflare] _headers  : ${blocks.length} bloc(s), ${skipped.length} règle(s) à porter en Transform Rule`);
