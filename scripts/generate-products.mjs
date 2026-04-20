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

/** Renvoie true si la valeur est "vide" au sens CMS (à supprimer du JSON).
 *  Sveltia stocke les champs vides comme `null`, `''`, `[]`, ou `{}`
 *  selon leur type. On nettoie agressivement pour garder un JSON propre.
 */
function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true;
  return false;
}

/** Convertit `sizeImages` de list `[{size, image}]` en `Record<number,string>`.
 *  Tolère aussi l'ancien format objet `{20: "…", 50: "…"}` et les arrays sparse
 *  (le bug Sveltia d'origine) pour migration robuste.
 *  Retourne undefined si vide ou absent.
 */
function normalizeSizeImages(raw) {
  if (isEmpty(raw)) return undefined;

  // Nouveau format : array de { size, image }
  if (Array.isArray(raw)) {
    const entries = raw
      .filter((e) => e && typeof e === 'object' && e.size != null && !isEmpty(e.image))
      .map((e) => [Number(e.size), String(e.image)]);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  // Ancien format : objet { "20": "/path" } OU { "20": "/path", "50": null, ... }
  if (typeof raw === 'object') {
    const entries = Object.entries(raw)
      .filter(([, v]) => typeof v === 'string' && v.length > 0)
      .map(([k, v]) => [Number(k), v]);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return undefined;
}

/** Nettoie un objet tasting en supprimant les champs nose/palate/finish vides.
 *  Retourne undefined si tout est vide.
 */
function normalizeTasting(raw) {
  if (isEmpty(raw)) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined;

  const clean = {};
  for (const key of ['nose', 'palate', 'finish']) {
    if (!isEmpty(raw[key])) clean[key] = String(raw[key]).trim();
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

/** Nettoie une list de strings en filtrant les éléments vides. */
function normalizeStringArray(raw) {
  if (!Array.isArray(raw)) return undefined;
  const clean = raw.filter((v) => typeof v === 'string' && v.trim() !== '').map((v) => v.trim());
  return clean.length > 0 ? clean : undefined;
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
      // Chaque champ optionnel passe par isEmpty() — Sveltia peut renvoyer
      // null, string vide ou array vide sur les champs laissés blancs dans
      // le CMS. On nettoie tout pour un JSON propre, sans propriétés
      // polluantes qui pourraient casser les templates consommateurs.
      const product = {
        // Champs obligatoires
        slug,
        name: String(frontmatter.name).trim(),
        range: frontmatter.range,
        priceMin: Number(frontmatter.priceMin),
        priceMax: Number(frontmatter.priceMax),
        image: String(frontmatter.image).trim(),
        alcohol: Number(frontmatter.alcohol),
        usage: String(frontmatter.usage).trim(),
      };

      // Strings optionnels
      if (!isEmpty(frontmatter.image2)) product.image2 = String(frontmatter.image2).trim();
      if (!isEmpty(frontmatter.tagline)) product.tagline = String(frontmatter.tagline).trim();
      if (!isEmpty(frontmatter.highlight)) product.highlight = String(frontmatter.highlight).trim();
      if (!isEmpty(frontmatter.serving)) product.serving = String(frontmatter.serving).trim();
      if (!isEmpty(frontmatter.wcSizeAttribute))
        product.wcSizeAttribute = String(frontmatter.wcSizeAttribute).trim();

      // Numbers optionnels
      if (!isEmpty(frontmatter.wcId)) product.wcId = Number(frontmatter.wcId);
      if (!isEmpty(frontmatter.defaultSize)) product.defaultSize = Number(frontmatter.defaultSize);
      if (!isEmpty(frontmatter.order)) product.order = Number(frontmatter.order);

      // Body markdown = description longue (nettoyée des espaces)
      if (body) product.description = body;

      // Composition : liste de plantes (array de strings, toujours présent
      // pour le typage Product ; on défaut à [] si absent ou vide)
      product.composition = normalizeStringArray(frontmatter.composition) ?? [];

      // Listes optionnelles
      const cleanAwards = normalizeStringArray(frontmatter.awards);
      if (cleanAwards) product.awards = cleanAwards;
      const cleanSizes = normalizeStringArray(frontmatter.sizes);
      if (cleanSizes) product.sizes = cleanSizes;

      // Objet tasting (nose/palate/finish) nettoyé
      const cleanTasting = normalizeTasting(frontmatter.tasting);
      if (cleanTasting) product.tasting = cleanTasting;

      // Record<number, string> sizeImages (from list format)
      const cleanSizeImages = normalizeSizeImages(frontmatter.sizeImages);
      if (cleanSizeImages) product.sizeImages = cleanSizeImages;

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
