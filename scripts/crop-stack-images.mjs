#!/usr/bin/env node
/**
 * crop-stack-images.mjs — génère des versions "stack-ready" des images 20cl
 *
 * Les PNG/WebP packshots produits ont ~20-30% d'espace transparent autour de
 * la bouteille. `sharp.trim()` ne fonctionne pas bien ici car les images ont
 * des pixels semi-transparents (anti-aliasing + drop-shadow subtile) qui
 * atteignent les bords.
 *
 * Solution : détection manuelle de la bounding box alpha (on cherche les
 * pixels dont alpha > ALPHA_THRESHOLD pour définir les limites de la
 * bouteille "visible"). Puis on extract cette bbox + un petit padding
 * de sécurité.
 *
 * Les versions originales *-20cl.webp restent intactes (utilisées par les
 * fiches produit). Les nouvelles *-20cl-stack.webp sont utilisées dans
 * les contextes d'empilement (teaser homepage, configurateur).
 */

import { readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SIZES_DIR = resolve(__dirname, '../public/images/products/sizes');

// Seuil alpha pour considérer un pixel comme "partie nette de la bouteille".
// 150/255 = ~60% → ignore les drop-shadows qui s'étendent jusqu'aux coins
// du PNG (diag a montré que les 4 coins ont alpha=106, donc on doit aller
// au-dessus). Ne garde que les pixels opaques du corps + goulot + étiquette.
const ALPHA_THRESHOLD = 150;

// Padding de sécurité (en pixels) autour de la bouteille détectée. 2px seulement
// car on veut un crop TRÈS serré pour l'empilement (les bouteilles doivent se
// toucher bout-à-bout comme un palet).
const PADDING = 4;

async function cropOne(filename) {
  const inputPath = join(SIZES_DIR, filename);
  const outputName = filename.replace(/\.webp$/, '-stack.webp');
  const outputPath = join(SIZES_DIR, outputName);

  try {
    // Lire les pixels RAW (RGBA) pour détecter la bounding box alpha.
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    let minX = width, maxX = -1, minY = height, maxY = -1;

    // Parcours tous les pixels : cherche min/max X et Y où alpha > threshold
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alphaIdx = (y * width + x) * channels + 3;
        if (data[alphaIdx] > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      console.warn(`[crop-stack] ⚠ ${filename} : aucun pixel opaque détecté, skip`);
      return false;
    }

    // Ajout padding + clamp aux dimensions de l'image
    const left = Math.max(0, minX - PADDING);
    const top = Math.max(0, minY - PADDING);
    const right = Math.min(width - 1, maxX + PADDING);
    const bottom = Math.min(height - 1, maxY + PADDING);
    const cropW = right - left + 1;
    const cropH = bottom - top + 1;

    await sharp(inputPath)
      .extract({ left, top, width: cropW, height: cropH })
      .webp({ quality: 90, alphaQuality: 90 })
      .toFile(outputPath);

    const reduction = 100 - Math.round((cropW * cropH) / (width * height) * 100);
    console.log(
      `[crop-stack] ✓ ${filename} → ${outputName} ` +
      `(${width}×${height} → ${cropW}×${cropH}, -${reduction}% en surface)`
    );
    return true;
  } catch (err) {
    console.error(`[crop-stack] ⚠ ${filename} : ${err.message}`);
    return false;
  }
}

async function main() {
  if (!existsSync(SIZES_DIR)) {
    console.error(`[crop-stack] Dossier introuvable : ${SIZES_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(SIZES_DIR)
    .filter((f) => /-20cl\.webp$/.test(f))
    .filter((f) => !/-stack\.webp$/.test(f));

  if (files.length === 0) {
    console.warn('[crop-stack] Aucun fichier *-20cl.webp trouvé.');
    process.exit(0);
  }

  console.log(`[crop-stack] Traitement de ${files.length} images (threshold alpha=${ALPHA_THRESHOLD}, padding=${PADDING}px)…`);
  let ok = 0;
  for (const f of files) {
    const success = await cropOne(f);
    if (success) ok += 1;
  }

  console.log(
    `[crop-stack] Terminé. ${ok}/${files.length} images croppées → *-20cl-stack.webp`
  );
}

main().catch((err) => {
  console.error(`[crop-stack] Exception fatale : ${err.message}`);
  process.exit(1);
});
