#!/usr/bin/env node
/**
 * indexnow-submit.mjs — notifie Bing / Yandex des URLs à (re)crawler
 *
 * IndexNow est un protocole standard supporté par Bing et Yandex (mais
 * pas Google, qui a son propre mécanisme via GSC + ping sitemap).
 * Permet l'indexation quasi-instantanée après un deploy.
 *
 * Doc : https://www.indexnow.org/documentation
 *
 * ── CONDITIONS D'EXÉCUTION ────────────────────────────────────────────
 *
 * Ce script s'exécute au `postbuild`, mais ne submet réellement que si :
 *   - INDEXNOW_ENABLED = "true"   (variable d'env Vercel explicite)
 *   - ET le build produit un sitemap valide
 *
 * Sur `test.labrasseriedesplantes.fr` (noindex) → on ne doit PAS activer
 * INDEXNOW_ENABLED, sinon on pollue l'index Bing avec des URLs noindex.
 *
 * Le jour de la bascule `www.` → Astro, l'utilisateur ajoute
 *   INDEXNOW_ENABLED=true  dans Vercel (Production uniquement)
 * et le prochain deploy déclenche le premier envoi.
 *
 * ── FORMAT API ────────────────────────────────────────────────────────
 *
 * POST https://api.indexnow.org/indexnow
 * Body JSON :
 *   {
 *     "host": "www.labrasseriedesplantes.fr",
 *     "key": "e3e81d795b356f57b451d271fc89a108",
 *     "keyLocation": "https://www.labrasseriedesplantes.fr/e3e81d795b356f57b451d271fc89a108.txt",
 *     "urlList": ["https://www.labrasseriedesplantes.fr/...", ...]
 *   }
 *
 * Limites :
 *   - 10 000 URLs par requête max (on est à ~100, largement OK)
 *   - 200 = OK, 202 = accepté avec délai, 422 = clé invalide,
 *     429 = trop de requêtes (quota journalier).
 *
 * Ne plante JAMAIS le build. Toujours `exit 0`.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = resolve(__dirname, '../dist');
const INDEXNOW_KEY = 'e3e81d795b356f57b451d271fc89a108';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_BATCH = 10_000;

// Gate 1 : activation explicite
if (process.env.INDEXNOW_ENABLED !== 'true') {
  console.log('[indexnow] skip — INDEXNOW_ENABLED ≠ "true" (à activer une fois la bascule www. faite)');
  process.exit(0);
}

// Gate 2 : le sitemap existe (sinon le build a échoué)
if (!existsSync(DIST_DIR)) {
  console.warn('[indexnow] skip — dossier dist/ inexistant (pas de build ?)');
  process.exit(0);
}

/** Extrait toutes les URLs <loc> d'un fichier sitemap XML (parse naïf, suffit). */
function extractUrls(xmlContent) {
  const matches = xmlContent.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map((m) => m.replace(/<\/?loc>/g, '').trim());
}

/** Trouve tous les sitemap-*.xml dans dist/ et agrège les URLs. */
function collectUrlsFromSitemaps() {
  const sitemapFiles = readdirSync(DIST_DIR)
    .filter((f) => /^sitemap(-\d+)?\.xml$/.test(f) || f === 'sitemap-index.xml');

  const urls = new Set();

  for (const file of sitemapFiles) {
    try {
      const content = readFileSync(join(DIST_DIR, file), 'utf-8');

      // Si c'est un sitemap-index, il contient des <loc> vers d'autres sitemaps
      // → on ne récupère QUE les URLs finales (pas celles qui finissent en .xml)
      const found = extractUrls(content).filter((u) => !u.endsWith('.xml'));
      for (const u of found) urls.add(u);
    } catch (err) {
      console.warn(`[indexnow] warn — ${file} illisible (${err.message})`);
    }
  }

  return Array.from(urls);
}

async function submit(host, urlList) {
  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  return { status: res.status, statusText: res.statusText };
}

async function main() {
  const allUrls = collectUrlsFromSitemaps();

  if (allUrls.length === 0) {
    console.warn('[indexnow] skip — aucune URL trouvée dans les sitemaps');
    process.exit(0);
  }

  // Détermine le host principal en regardant la 1re URL du sitemap. On filtre
  // ensuite pour ne soumettre QUE les URLs de ce même host (pas de test.,
  // pas de localhost). On refuse explicitement `test.` par sécurité.
  const firstUrl = allUrls[0];
  let host;
  try {
    host = new URL(firstUrl).host;
  } catch {
    console.warn(`[indexnow] skip — URL invalide dans le sitemap : ${firstUrl}`);
    process.exit(0);
  }

  if (host.startsWith('test.') || host.includes('localhost') || host.includes('127.0.0.1')) {
    console.warn(`[indexnow] skip — host "${host}" n'est pas la prod (sécurité anti-noindex)`);
    process.exit(0);
  }

  const urlList = allUrls.filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });

  if (urlList.length === 0) {
    console.warn(`[indexnow] skip — aucune URL ne match https://${host}/…`);
    process.exit(0);
  }

  // Chunking si jamais on dépasse 10k URLs un jour
  const batches = [];
  for (let i = 0; i < urlList.length; i += MAX_URLS_PER_BATCH) {
    batches.push(urlList.slice(i, i + MAX_URLS_PER_BATCH));
  }

  try {
    for (const [idx, batch] of batches.entries()) {
      const { status, statusText } = await submit(host, batch);
      const label = batches.length > 1 ? ` (batch ${idx + 1}/${batches.length})` : '';

      if (status === 200 || status === 202) {
        console.log(`[indexnow] ✓ ${batch.length} URLs soumises${label} (HTTP ${status})`);
      } else {
        console.warn(`[indexnow] ⚠ HTTP ${status} ${statusText}${label} — vérifier la clé ou le quota`);
      }
    }
  } catch (err) {
    console.warn(`[indexnow] fetch failed — ${err.message}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.warn(`[indexnow] exception — ${err.message}`);
  process.exit(0);
});
