#!/usr/bin/env node
/**
 * import-cbd-20cl.mjs — importe les 3 photos 20cl CBD depuis Downloads
 *
 * Les images source (`/Users/guillaume/Downloads/liqueurs-artisanales-verveine-
 * cadeau-{5,7,9}-1420x2048.png`) sont sur fond NOIR (pas transparent).
 *
 * Ce script :
 *  1. Pour chaque fichier source, détecte la couleur dominante de la zone
 *     étiquette (45-60% hauteur, 40-60% largeur) → associe à un produit
 *     (menthe CBD → vert, verveine CBD → orange, absinthe CBD → violet).
 *  2. Convertit les pixels sombres (luminosité < SEUIL) en transparent.
 *  3. Crop serré au bounding box alpha.
 *  4. Exporte en WebP vers public/images/products/sizes/<slug>-20cl.webp
 *     ET la version déjà croppée -stack.webp.
 *
 * One-shot, à lancer une fois : `node scripts/import-cbd-20cl.mjs`
 */

import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DOWNLOADS = '/Users/guillaume/Downloads';
const OUT_DIR = resolve(__dirname, '../public/images/products/sizes');

// Mapping manuel basé sur l'inspection visuelle des 3 PNG reçus :
// les 3 bouteilles CBD ont des étiquettes trop sombres pour être classifiées
// automatiquement par couleur dominante. On mappe fichier source → slug.
const SOURCE_TO_SLUG = {
  'liqueurs-artisanales-verveine-cadeau-5-1420x2048.png': 'menthe-cbd-ortie',
  'liqueurs-artisanales-verveine-cadeau-7-1420x2048.png': 'verveine-cbd-aurone',
  'liqueurs-artisanales-verveine-cadeau-9-1420x2048.png': 'absinthe-cbd-citron',
};

// Double seuil pour préserver la luminosité ET les couleurs de la bouteille :
// - lum ≤ HARD_THRESHOLD : pixel purement noir → alpha 0 (transparent)
// - lum entre HARD et SOFT : alpha proportionnel (transition douce, préserve
//   l'anti-aliasing des bords et évite le "halo noir" autour de la bouteille)
// - lum ≥ SOFT_THRESHOLD : pixel laissé intact (alpha original, couleurs
//   préservées → aucune modification sur la bouteille elle-même)
const HARD_THRESHOLD = 12;
const SOFT_THRESHOLD = 32;

// Pour classifier : on lit la couleur dominante de la zone étiquette centrale
async function detectDominantColor(inputPath) {
  const img = sharp(inputPath);
  const meta = await img.metadata();
  const w = meta.width;
  const h = meta.height;

  // Zone étiquette : 45-60% hauteur, 35-65% largeur
  const cropLeft = Math.floor(w * 0.35);
  const cropTop = Math.floor(h * 0.45);
  const cropW = Math.floor(w * 0.3);
  const cropH = Math.floor(h * 0.15);

  const { data, info } = await sharp(inputPath)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Ignore les pixels trop sombres (le noir du fond peut leaker ici)
    if ((r + g + b) / 3 < 30) continue;
    rSum += r;
    gSum += g;
    bSum += b;
    count += 1;
  }

  if (count === 0) return { r: 0, g: 0, b: 0 };
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}

function classifyColor({ r, g, b }) {
  // Menthe-CBD-Ortie : vert dominant → g > r, g > b
  if (g > r && g > b && g - r > 15) return 'menthe-cbd-ortie';
  // Absinthe-CBD-Citron : étiquette violette → b > g, r non-dominant
  if (b > g && b > r - 20) return 'absinthe-cbd-citron';
  // Verveine-CBD-Aurone : orange/ambre → r dominant
  return 'verveine-cbd-aurone';
}

/**
 * Enlève le fond noir (luminosité < threshold) en rendant ces pixels
 * transparents, puis crop au bounding box alpha.
 */
async function cleanAndCrop(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const newData = Buffer.from(data);

  // Passe 1 : noir → transparent
  for (let i = 0; i < newData.length; i += channels) {
    const r = newData[i];
    const g = newData[i + 1];
    const b = newData[i + 2];
    const lum = (r + g + b) / 3;
    if (lum <= HARD_THRESHOLD) {
      newData[i + 3] = 0; // transparent total
    } else if (lum < SOFT_THRESHOLD) {
      // Transition douce : alpha proportionnel → bords préservés
      const ratio = (lum - HARD_THRESHOLD) / (SOFT_THRESHOLD - HARD_THRESHOLD);
      newData[i + 3] = Math.round(255 * ratio);
    }
    // lum >= SOFT_THRESHOLD : alpha inchangé (couleurs bouteille préservées)
  }

  // Passe 2 : détection bbox sur pixels visibles
  let minX = width, maxX = -1, minY = height, maxY = -1;
  const ALPHA_THRESHOLD = 150;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const aIdx = (y * width + x) * channels + 3;
      if (newData[aIdx] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error('Aucun pixel opaque détecté après nettoyage');
  }

  const PADDING = 4;
  const left = Math.max(0, minX - PADDING);
  const top = Math.max(0, minY - PADDING);
  const right = Math.min(width - 1, maxX + PADDING);
  const bottom = Math.min(height - 1, maxY + PADDING);

  await sharp(newData, { raw: { width, height, channels } })
    .extract({
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1,
    })
    .webp({ quality: 95, alphaQuality: 100, lossless: false, effort: 6 })
    .toFile(outputPath);

  return { width: right - left + 1, height: bottom - top + 1 };
}

/**
 * Version non-croppée : on garde les dimensions originales du PNG, on remplace
 * juste les pixels sombres par du transparent. Pas de crop, pas de recadrage —
 * la bouteille reste à la même position et taille que dans la photo source.
 */
async function removeBlackBackgroundOnly(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const newData = Buffer.from(data);

  for (let i = 0; i < newData.length; i += channels) {
    const r = newData[i];
    const g = newData[i + 1];
    const b = newData[i + 2];
    const lum = (r + g + b) / 3;
    if (lum <= HARD_THRESHOLD) {
      newData[i + 3] = 0;
    } else if (lum < SOFT_THRESHOLD) {
      const ratio = (lum - HARD_THRESHOLD) / (SOFT_THRESHOLD - HARD_THRESHOLD);
      newData[i + 3] = Math.round(255 * ratio);
    }
  }

  await sharp(newData, { raw: { width, height, channels } })
    .webp({ quality: 95, alphaQuality: 100, lossless: false, effort: 6 })
    .toFile(outputPath);
}

async function main() {
  for (const [filename, slug] of Object.entries(SOURCE_TO_SLUG)) {
    const inputPath = `${DOWNLOADS}/${filename}`;
    if (!existsSync(inputPath)) {
      console.error(`[import-cbd] ⚠ fichier introuvable : ${inputPath}`);
      continue;
    }

    console.log(`[import-cbd] ${filename} → ${slug}`);

    const outRaw = `${OUT_DIR}/${slug}-20cl.webp`;
    const outStack = `${OUT_DIR}/${slug}-20cl-stack.webp`;

    // 1) Version "raw" : dimensions originales + fond noir → transparent,
    //    SANS crop ni modification de la composition.
    await removeBlackBackgroundOnly(inputPath, outRaw);
    console.log(`[import-cbd] ✓ écrit ${outRaw} (original, fond enlevé)`);

    // 2) Version "stack" : croppée serrée pour l'empilement dans le
    //    configurateur (parité avec les autres -stack.webp du site).
    await cleanAndCrop(inputPath, outStack);
    console.log(`[import-cbd] ✓ écrit ${outStack} (croppée pour pile)`);
  }

  console.log('[import-cbd] Terminé.');
}

main().catch((err) => {
  console.error(`[import-cbd] Exception fatale : ${err.message}`);
  process.exit(1);
});
