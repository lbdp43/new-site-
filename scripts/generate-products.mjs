#!/usr/bin/env node
/**
 * generate-products.mjs — compile les fichiers .md de src/content/products/
 * en un fichier JSON consommé par src/data/products.ts.
 *
 * Exécuté au `prebuild` (avant astro build).
 *
 * Pourquoi cette indirection ? Les consommateurs de `products.ts` (14 fichiers
 * .astro) attendent un `export const products: Product[] = [...]` synchrone.
 * Les Content Collections Astro sont async via getCollection() — ça casserait
 * les 14 fichiers.
 *
 * Solution : on garde l'API sync de products.ts, mais on lit les données
 * depuis ce JSON généré à partir des .md. Les éditions via Sveltia CMS
 * (→ .md) sont bien prises en compte au prochain build.
 *
 * Les fichiers .md avec `draft: true` sont EXCLUS de la génération — ils
 * n'apparaissent ni sur le site ni dans products.generated.json.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PRODUCTS_DIR = resolve(__dirname, '../src/content/products');
const OUTPUT_PATH = resolve(__dirname, '../src/data/products.generated.json');

/** Convertit `sizeImages` de list `[{size, image}]` en `Record<number,string>`.
 *  Tolère aussi l'ancien format objet `{20: "…", 50: "…"}` pour migration
 *  douce. Retourne undefined si vide ou absent.
 */
function normalizeSizeImages(raw) {
  if (!raw) return undefined;

  // Nouveau format : array de { size, image }
  if (Array.isArray(raw)) {
    const entries = raw
      .filter((e) => e && typeof e === 'object' && e.size != null && e.image)
      .map((e) => [Number(e.size), String(e.image)]);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  // Ancien format : objet { "20": "/path" }
  if (typeof raw === 'object') {
    const entries = Object.entries(raw)
      .filter(([, v]) => typeof v === 'string' && v.length > 0)
      .map(([k, v]) => [Number(k), v]);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return undefined;
}

/** Parse un .md en { slug, frontmatter, body }. Format attendu :
 *    ---
 *    yaml-front-matter
 *    ---
 *    body markdown
 */
function parseMarkdownFile(filePath, slug) {
  const raw = readFileSync(filePath, 'utf-8');

  // Split sur les 2 premiers "---" en ligne
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`[${slug}] frontmatter YAML introuvable`);
  }

  const [, yamlPart, bodyPart] = match;
  const frontmatter = YAML.parse(yamlPart);
  const body = (bodyPart || '').trim();

  return { slug, frontmatter, body };
}

function main() {
  const files = readdirSync(PRODUCTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    console.warn('[generate-products] aucun .md trouvé dans src/content/products/');
  }

  const products = [];
  let draftCount = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const filePath = join(PRODUCTS_DIR, file);

    try {
      const { frontmatter, body } = parseMarkdownFile(filePath, slug);

      // Drafts = pas encore prêts pour affichage → exclus
      if (frontmatter.draft === true) {
        draftCount += 1;
        continue;
      }

      // Reconstruit l'objet Product au format attendu par products.ts.
      // Note : le body markdown devient la `description` (champ principal
      // d'édition via le CMS).
      const product = {
        slug,
        name: frontmatter.name,
        range: frontmatter.range,
        priceMin: frontmatter.priceMin,
        priceMax: frontmatter.priceMax,
        image: frontmatter.image,
        image2: frontmatter.image2,
        alcohol: frontmatter.alcohol,
        composition: frontmatter.composition ?? [],
        usage: frontmatter.usage,
        tagline: frontmatter.tagline,
        highlight: frontmatter.highlight,
        description: body || undefined,
        tasting: frontmatter.tasting,
        awards: frontmatter.awards,
        serving: frontmatter.serving,
        sizes: frontmatter.sizes,
        // sizeImages = list de { size, image } dans le .md (pour robustesse CMS)
        // → on convertit en Record<number, string> pour products.ts.
        // Tolérant aux deux formats (array de paires OU ancien objet legacy)
        // pour migration sans casser.
        sizeImages: normalizeSizeImages(frontmatter.sizeImages),
        wcId: frontmatter.wcId,
        wcSizeAttribute: frontmatter.wcSizeAttribute,
        defaultSize: frontmatter.defaultSize,
        order: frontmatter.order,
      };

      // Nettoie les undefined pour un JSON plus propre
      for (const key of Object.keys(product)) {
        if (product[key] === undefined) {
          delete product[key];
        }
      }

      products.push(product);
    } catch (err) {
      console.error(`[generate-products] ⚠ ${file} : ${err.message}`);
      // On continue — un produit cassé ne doit pas bloquer tout le build
    }
  }

  // Tri stable : par range (ordre logique), puis par `order`, puis par slug
  const rangeOrder = ['brasserie', 'aperitif', 'lumiere-obscure', 'edition-limitee', 'accessoire'];
  products.sort((a, b) => {
    const rangeA = rangeOrder.indexOf(a.range);
    const rangeB = rangeOrder.indexOf(b.range);
    if (rangeA !== rangeB) return rangeA - rangeB;
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.slug.localeCompare(b.slug);
  });

  const output = {
    generatedAt: new Date().toISOString(),
    productCount: products.length,
    draftCount,
    products,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');

  console.log(
    `[generate-products] ✓ ${products.length} produits compilés ` +
    `(${draftCount} drafts exclus) → src/data/products.generated.json`
  );
}

main();
