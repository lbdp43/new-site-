#!/usr/bin/env node
/**
 * sync-wc-stock.mjs — synchronise le stock live depuis WooCommerce
 *
 * Exécuté avant chaque build (hook `prebuild` de package.json).
 *
 * Lit les variables d'environnement :
 *   - PUBLIC_WC_BASE_URL    (ex: https://www.labrasseriedesplantes.fr)
 *   - WC_CONSUMER_KEY       (ck_…)
 *   - WC_CONSUMER_SECRET    (cs_…)
 *
 * Produit : src/data/wc-live.json avec la forme
 *   {
 *     generatedAt: "2026-04-20T17:00:00.000Z",
 *     source: "wc-api" | "fallback" | "empty",
 *     products: {
 *       "123": { stockStatus: "instock" | "outofstock" | "onbackorder",
 *                stockQuantity: number | null }
 *     }
 *   }
 *
 * Le fichier est committé dans git — ça permet au build Vercel de toujours
 * avoir une source de vérité (même si WC est down), et à l'équipe de voir
 * l'historique stock via git log. Si le script ne peut pas joindre WC, il
 * préserve le fichier existant plutôt que de l'écraser avec du vide.
 *
 * Le script ne plante JAMAIS le build : en cas d'erreur, il logge un warning
 * et sort en code 0. Le fichier pré-existant (ou un vide) sert de fallback.
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_PATH = resolve(__dirname, '../src/data/wc-live.json');
const PRODUCTS_DIR = resolve(__dirname, '../src/content/products');
const FETCH_TIMEOUT_MS = 20_000;
const PER_PAGE = 100;
const MAX_PAGES = 10; // 10 × 100 = 1000 produits, largement suffisant

const WC_BASE = process.env.PUBLIC_WC_BASE_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

/** Préserve le fichier existant avec un log, si présent. Sinon écrit un vide. */
function writeFallback(reason) {
  if (existsSync(OUTPUT_PATH)) {
    console.warn(`[sync-wc-stock] ${reason} — fichier existant conservé.`);
    return;
  }
  const empty = {
    generatedAt: new Date().toISOString(),
    source: 'empty',
    note: reason,
    products: {},
  };
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(empty, null, 2) + '\n');
  console.warn(`[sync-wc-stock] ${reason} — fichier vide créé.`);
}

if (!WC_BASE) {
  writeFallback('PUBLIC_WC_BASE_URL manquant');
  process.exit(0);
}
if (!WC_KEY || !WC_SECRET) {
  writeFallback('WC_CONSUMER_KEY ou WC_CONSUMER_SECRET manquant (dev local ?)');
  process.exit(0);
}

const authHeader = 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64');

/** Fetch avec timeout manuel (AbortController). */
async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Récupère une page de produits. Retourne [] si erreur. */
async function fetchProductsPage(page) {
  const url = new URL('/wp-json/wc/v3/products', WC_BASE);
  url.searchParams.set('per_page', String(PER_PAGE));
  url.searchParams.set('page', String(page));
  // Exclut les produits brouillon/corbeille. On garde publish + private.
  url.searchParams.set('status', 'publish');

  const res = await fetchWithTimeout(url.toString(), {
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`WC API ${res.status} ${res.statusText} (page ${page})`);
  }

  const totalPages = Number(res.headers.get('x-wp-totalpages') || 1);
  const items = await res.json();
  return { items, totalPages };
}

/** Lit l'ensemble des wcId présents dans les fichiers .md de la collection
 *  `products`, pour détecter les produits WC qui n'ont pas encore de fiche
 *  éditoriale. Parse naïf (pas de full YAML), suffit pour extraire wcId.
 */
function getExistingWcIds() {
  const wcIds = new Set();
  if (!existsSync(PRODUCTS_DIR)) return wcIds;

  for (const file of readdirSync(PRODUCTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    try {
      const content = readFileSync(join(PRODUCTS_DIR, file), 'utf-8');
      const match = content.match(/^\s*wcId:\s*(\d+)\s*$/m);
      if (match) wcIds.add(Number(match[1]));
    } catch {
      // fichier illisible, on ignore
    }
  }
  return wcIds;
}

/** Si un produit WC n'a pas de fiche Astro correspondante, on crée un stub
 *  `.md` avec `draft: true`. Le CMS affichera le produit avec un badge "À
 *  compléter", le site ne l'affichera pas tant que `draft: false` n'est pas
 *  posé par un humain.
 *
 *  On pré-remplit les champs que WC connaît (nom, prix, image, wcId) ; les
 *  champs éditoriaux (tasting, description, tagline, etc.) sont vides.
 */
function createDraftStub(wcProduct) {
  // slug = nom WC en kebab-case lowercase, nettoyé
  const slug = String(wcProduct.slug || wcProduct.name || `wc-${wcProduct.id}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const destPath = join(PRODUCTS_DIR, `${slug}.md`);
  if (existsSync(destPath)) return false; // déjà là

  const prices = (wcProduct.prices_info || {}).regular_price
    ? Number(wcProduct.prices_info.regular_price) / 100
    : Number(wcProduct.regular_price || wcProduct.price || 0);

  const primaryImage = (wcProduct.images && wcProduct.images[0] && wcProduct.images[0].src) || '';

  const frontmatter = [
    '---',
    `name: ${JSON.stringify(wcProduct.name || slug)}`,
    `range: brasserie  # ⚠️ À ajuster : brasserie | aperitif | lumiere-obscure | edition-limitee | accessoire`,
    `priceMin: ${prices || 0}`,
    `priceMax: ${prices || 0}`,
    `image: ${primaryImage || `/images/products/${slug}.png`}`,
    `alcohol: 0  # ⚠️ À compléter`,
    `composition: []`,
    `usage: "À compléter"`,
    `tagline: "À compléter"`,
    `wcId: ${wcProduct.id}`,
    `draft: true  # ⚠️ Passer à false pour publier sur le site`,
    '---',
    '',
    `<!-- Description longue à rédiger. Conseils tasting, service, accords cocktails, histoire. -->`,
    '',
  ].join('\n');

  mkdirSync(PRODUCTS_DIR, { recursive: true });
  writeFileSync(destPath, frontmatter);
  return true;
}

async function main() {
  const started = Date.now();
  const products = {};
  const rawWcProducts = [];

  try {
    let page = 1;
    let totalPages = 1;
    do {
      const { items, totalPages: tp } = await fetchProductsPage(page);
      totalPages = tp;

      for (const p of items) {
        if (!p.id) continue;
        rawWcProducts.push(p);
        products[String(p.id)] = {
          stockStatus: p.stock_status || 'instock',
          stockQuantity: typeof p.stock_quantity === 'number' ? p.stock_quantity : null,
        };
      }
      page += 1;
    } while (page <= totalPages && page <= MAX_PAGES);
  } catch (err) {
    writeFallback(`fetch WC échoué — ${err.message}`);
    process.exit(0);
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: 'wc-api',
    products,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');

  // Auto-draft : détecte les produits WC qui n'ont pas encore de fiche .md
  // et crée un stub en draft:true. Le prochain prebuild (generate-products)
  // les ignorera (car draft:true) ; le CMS les exposera pour rédaction.
  const existingWcIds = getExistingWcIds();
  const newDrafts = [];
  for (const wc of rawWcProducts) {
    if (existingWcIds.has(wc.id)) continue;
    const created = createDraftStub(wc);
    if (created) newDrafts.push(wc.id);
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const count = Object.keys(products).length;
  const outOfStock = Object.values(products).filter((p) => p.stockStatus === 'outofstock').length;
  const draftNote = newDrafts.length > 0
    ? ` — ${newDrafts.length} nouveau(x) produit(s) WC détecté(s), stubs draft créés (wcId: ${newDrafts.join(', ')})`
    : '';
  console.log(
    `[sync-wc-stock] ✓ ${count} produits synchronisés en ${elapsed}s ` +
    `(${outOfStock} en rupture)${draftNote}`
  );
}

main().catch((err) => {
  writeFallback(`exception — ${err.message}`);
  process.exit(0);
});
