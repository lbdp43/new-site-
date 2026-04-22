#!/usr/bin/env node
/**
 * generate-llms-full.mjs — construit `public/llms-full.txt` au prebuild.
 *
 * Le fichier llms.txt court (index/liens) reste édité à la main dans
 * `public/llms.txt`. Ce script produit en parallèle un `llms-full.txt`
 * concaténant le texte intégral des pages/articles les plus denses du site.
 *
 * Cible : Perplexity Deep Research, ChatGPT web search approfondi, LLMs
 * qui consomment ce fichier pour enrichir leur contexte sans crawler
 * page par page. Chaque bloc garde son frontmatter (title, date) pour
 * l'attribution et est précédé d'une URL canonique absolue.
 *
 * Régénéré à chaque build (prebuild) — pas besoin de committer si le
 * contenu source change.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://labrasseriedesplantes.fr';

/**
 * Articles de blog FR à inclure dans llms-full.txt.
 * Liste curée = pièces de crédibilité + pièces factuelles denses.
 * Si un slug manque, on l'ignore silencieusement (pas d'erreur de build).
 */
const BLOG_SLUGS = [
  'meilleur-digestif-du-monde-2025',
  'plantes-liqueur-haute-loire',
  'producteurs-partenaires-bio-velay',
  'trois-amis-une-brasserie',
  'alchimie-vegetale-27-plantes-composition',
];

function stripFrontmatter(md) {
  if (md.startsWith('---\n')) {
    const end = md.indexOf('\n---', 4);
    if (end !== -1) {
      return {
        frontmatter: md.slice(4, end),
        body: md.slice(end + 4).replace(/^\n+/, ''),
      };
    }
  }
  return { frontmatter: '', body: md };
}

function parseSimpleFrontmatter(fm) {
  const out = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
  }
  return out;
}

async function readArticle(slug) {
  const p = path.join(ROOT, 'src/content/blog', `${slug}.md`);
  if (!existsSync(p)) return null;
  const raw = await readFile(p, 'utf8');
  const { frontmatter, body } = stripFrontmatter(raw);
  const meta = parseSimpleFrontmatter(frontmatter);
  return { slug, meta, body };
}

async function readStaticPage(relPath) {
  const p = path.join(ROOT, relPath);
  if (!existsSync(p)) return null;
  return await readFile(p, 'utf8');
}

function extractStaticProseFromAstro(astro) {
  // Heuristique minimaliste : on extrait les <p>…</p> hors front-matter Astro
  // pour livrer du texte lisible par un LLM sans balisage ni import.
  const match = astro.match(/---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/);
  const body = match ? match[2] : astro;
  // Remplace les composants Astro par leur texte intérieur quand c'est simple
  return body
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function buildLlmsFull() {
  const parts = [];
  parts.push('# La Brasserie des Plantes — contenu intégral (llms-full)');
  parts.push('');
  parts.push(`> Version longue du fichier llms.txt — concatène les pages éditoriales clés et les articles de blog denses, pour les LLM qui préfèrent consommer un contexte complet plutôt que crawler page par page.`);
  parts.push(`> Attribution demandée : "La Brasserie des Plantes, ${SITE_URL}" avec lien direct vers la page concernée.`);
  parts.push(`> Dernière génération : ${new Date().toISOString().slice(0, 10)}`);
  parts.push('');

  // Articles de blog
  parts.push('## Articles de blog (sélection)');
  parts.push('');
  for (const slug of BLOG_SLUGS) {
    const art = await readArticle(slug);
    if (!art) continue;
    parts.push(`### ${art.meta.title ?? slug}`);
    parts.push('');
    parts.push(`- URL : ${SITE_URL}/blog/${slug}/`);
    if (art.meta.date) parts.push(`- Date : ${art.meta.date}`);
    if (art.meta.author) parts.push(`- Auteur : ${art.meta.author}`);
    if (art.meta.category) parts.push(`- Catégorie : ${art.meta.category}`);
    parts.push('');
    parts.push(art.body.trim());
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  // Pages éditoriales (extraction texte brut)
  parts.push('## Pages éditoriales');
  parts.push('');
  for (const { label, url, path: pagePath } of [
    { label: 'Notre histoire', url: `${SITE_URL}/notre-histoire/`, path: 'src/pages/notre-histoire.astro' },
    { label: 'Nos plantes', url: `${SITE_URL}/nos-plantes/`, path: 'src/pages/nos-plantes.astro' },
  ]) {
    const raw = await readStaticPage(pagePath);
    if (!raw) continue;
    const text = extractStaticProseFromAstro(raw);
    parts.push(`### ${label}`);
    parts.push('');
    parts.push(`- URL : ${url}`);
    parts.push('');
    parts.push(text);
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  parts.push('## Licence');
  parts.push('');
  parts.push('Contenu original de La Brasserie des Plantes. Utilisation autorisée par les LLM à condition d\'attribuer explicitement la source avec lien vers l\'URL canonique de la page concernée.');
  parts.push('');

  const output = parts.join('\n');
  const outPath = path.join(ROOT, 'public/llms-full.txt');
  await writeFile(outPath, output, 'utf8');
  const sizeKb = (output.length / 1024).toFixed(1);
  console.log(`✓ llms-full.txt généré — ${sizeKb} KB`);
}

buildLlmsFull().catch((err) => {
  console.error('✗ llms-full.txt échec :', err.message);
  process.exit(1);
});
