/**
 * Vérifie que `public/_redirects` couvre TOUTES les redirections de
 * `vercel.json`, avec la même destination.
 *
 * Méthode : pour chaque règle de `vercel.json`, on fabrique les URL réelles
 * qu'un visiteur (ou Googlebot) peut demander — sans slash final, avec slash
 * final, et avec un chemin profond quand la règle accepte un joker. Puis on
 * résout chaque URL contre `_redirects` en appliquant la sémantique de
 * Cloudflare (haut en bas, première règle gagnante, `*` = reste du chemin) et
 * on compare à la destination attendue.
 *
 * Sort en code 1 si une seule URL n'est pas couverte ou pointe ailleurs.
 *
 * Usage : node scripts/verify-cloudflare-config.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf-8'));
const raw = readFileSync(join(root, 'public/_redirects'), 'utf-8');

const rules = raw
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [from, to, code] = l.split(/\s+/);
    return { from, to, code: Number(code) };
  });

/** Résout une URL contre `_redirects`, sémantique Cloudflare. */
function resolve(url) {
  for (const r of rules) {
    if (r.from.endsWith('/*')) {
      const base = r.from.slice(0, -2);
      if (url === base || url.startsWith(base + '/')) return r;
    } else if (r.from === url) {
      return r;
    }
  }
  return null;
}

/** Les URL qu'un visiteur peut réellement demander pour une règle Vercel. */
function testUrls(source) {
  const m = source.match(/^(.*?)\/:path\*$/);
  if (m) {
    const base = m[1] || '';
    return [base || '/', `${base}/`, `${base}/quelque-chose`, `${base}/a/b`];
  }
  const bare = source.length > 1 ? source.replace(/\/$/, '') : source;
  return [bare, `${bare}/`];
}

let checked = 0;
const failures = [];

for (const r of vercel.redirects ?? []) {
  const expected = r.destination;
  const expectedCode = r.permanent === false ? 302 : 301;
  for (const url of testUrls(r.source)) {
    checked++;
    const hit = resolve(url);
    if (!hit) {
      failures.push(`${url} → AUCUNE règle (attendu ${expected})`);
    } else if (hit.to !== expected) {
      failures.push(`${url} → ${hit.to} (attendu ${expected}, règle « ${hit.from} »)`);
    } else if (hit.code !== expectedCode) {
      failures.push(`${url} → code ${hit.code} (attendu ${expectedCode})`);
    }
  }
}

// Garde-fous supplémentaires : les limites du plan Cloudflare Pages.
const dyn = rules.filter((r) => r.from.includes('*')).length;
const sta = rules.length - dyn;
if (dyn > 100) failures.push(`${dyn} règles à joker — limite Cloudflare : 100`);
if (sta > 2100) failures.push(`${sta} règles exactes — limite Cloudflare : 2100`);

// Une URL du site actuel ne doit JAMAIS être capturée par une redirection :
// ce serait une page vivante rendue inaccessible.
const mustNotRedirect = [
  '/', '/boutique', '/boutique/alchimie-vegetale', '/notre-histoire',
  '/nos-plantes', '/cocktails', '/contact', '/faq', '/ateliers',
  '/professionnels', '/presse', '/cgv', '/mentions-legales',
  '/politique-cookies', '/composer-mon-coffret', '/panier', '/commande',
  '/en/', '/en/shop', '/en/shop/alchimie-vegetale', '/en/our-story',
  '/blog', '/blog/trois-amis-une-brasserie',
];
for (const url of mustNotRedirect) {
  const hit = resolve(url);
  if (hit) failures.push(`⚠️ PAGE VIVANTE capturée : ${url} → ${hit.to} (règle « ${hit.from} »)`);
}

console.log(`[verify] ${checked} URL testées · ${sta} règles exactes · ${dyn} à joker`);
console.log(`[verify] ${mustNotRedirect.length} pages vivantes contrôlées (ne doivent pas rediriger)`);

if (failures.length) {
  console.error(`\n❌ ${failures.length} problème(s) :`);
  for (const f of failures) console.error('   ' + f);
  process.exit(1);
}
console.log('\n✅ Toutes les redirections de vercel.json sont couvertes, à l’identique.');
