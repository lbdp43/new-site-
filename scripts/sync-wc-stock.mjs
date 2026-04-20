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
 *       "123": {
 *         stockStatus: "instock" | "outofstock" | "onbackorder",
 *         stockQuantity: number | null,
 *         // Prix par contenance (cl → prix EUR). Renseigné uniquement pour
 *         // les produits variables. Clés = int en cl (20, 50, 70, 150…).
 *         prices?: { "20": 9, "50": 17, "70": 22, "150": 75 }
 *       }
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

/** Récupère toutes les variations d'un produit variable, avec leur prix et
 *  l'attribut de contenance. Retourne un objet { [cl]: priceEUR } ou {} si
 *  erreur / pas de variations / aucun prix trouvé.
 */
async function fetchVariationPrices(productId) {
  try {
    const url = new URL(`/wp-json/wc/v3/products/${productId}/variations`, WC_BASE);
    url.searchParams.set('per_page', '100');

    const res = await fetchWithTimeout(url.toString(), {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });
    if (!res.ok) return {};

    const variations = await res.json();
    if (!Array.isArray(variations)) return {};

    const prices = {};
    for (const v of variations) {
      const priceNum = Number(v.price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) continue;
      // Trouve l'attribut de contenance — 1er attribut qui matche /contenance|gravure/i
      // ou à défaut le 1er attribut tout court. Parse le nombre (cl).
      const attrs = Array.isArray(v.attributes) ? v.attributes : [];
      const sizeAttr =
        attrs.find((a) => /contenance|gravure/i.test(String(a?.name || ''))) ||
        attrs[0];
      if (!sizeAttr) continue;
      const option = String(sizeAttr.option || '');
      const clMatch = option.match(/(\d+)\s*cl/i);
      if (!clMatch) continue;
      const cl = parseInt(clMatch[1], 10);
      if (!Number.isFinite(cl)) continue;
      // En cas de doublons (2 variations 70cl), on garde le prix le plus bas.
      if (!(cl in prices) || priceNum < prices[cl]) {
        prices[cl] = priceNum;
      }
    }
    return prices;
  } catch {
    return {};
  }
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

  // Étape 2 : pour chaque produit variable, récupère les prix par contenance.
  // On parallélise par batches de 6 pour éviter de saturer le WP (et être
  // gentil avec le mutualisé). Les erreurs ponctuelles ne bloquent pas.
  const variableProducts = rawWcProducts.filter((p) => p.type === 'variable');
  const BATCH = 6;
  let variationsOK = 0;
  for (let i = 0; i < variableProducts.length; i += BATCH) {
    const slice = variableProducts.slice(i, i + BATCH);
    const results = await Promise.all(
      slice.map((p) => fetchVariationPrices(p.id).then((prices) => ({ id: p.id, prices })))
    );
    for (const r of results) {
      if (r.prices && Object.keys(r.prices).length > 0) {
        const entry = products[String(r.id)];
        if (entry) {
          // JSON.stringify convertira les clés int en strings — comportement voulu.
          entry.prices = r.prices;
          variationsOK += 1;
        }
      }
    }
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
    `(${outOfStock} en rupture, ${variationsOK} avec prix par contenance)${draftNote}`
  );
}

main().catch((err) => {
  writeFallback(`exception — ${err.message}`);
  process.exit(0);
});
