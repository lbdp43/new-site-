#!/usr/bin/env node
/**
 * generate-pdf-report.mjs — convertit rapport-bascule.md en PDF A4 paginé.
 *
 * Pipeline :
 *   1. python3 -c "import markdown" → MD → HTML (avec extension fenced_code, tables, toc)
 *   2. wrap dans un template HTML stylé (CSS print-ready, page-break, headers/footers)
 *   3. Chrome headless --print-to-pdf → PDF A4
 *
 * Sortie : /Users/guillaume/site lbdp/rapport-bascule.pdf
 *
 * Usage : node scripts/generate-pdf-report.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MD_PATH = resolve(ROOT, 'rapport-bascule.md');
const HTML_PATH = resolve(ROOT, 'rapport-bascule.html');
const PDF_PATH = resolve(ROOT, 'rapport-bascule.pdf');

if (!existsSync(MD_PATH)) {
  console.error(`✗ ${MD_PATH} introuvable. Crée-le d'abord.`);
  process.exit(1);
}

const md = readFileSync(MD_PATH, 'utf-8');

// MD → HTML via Python markdown
const escapedMd = md.replace(/'/g, "'\\''");
const htmlBody = execSync(
  `python3 -c "
import sys, markdown
md_text = sys.stdin.read()
html = markdown.markdown(md_text, extensions=['fenced_code', 'tables', 'toc', 'sane_lists', 'nl2br'])
print(html)
"`,
  { input: md, encoding: 'utf-8' }
);

// Template HTML stylé pour print
const css = `
  @page {
    size: A4;
    margin: 18mm 16mm 22mm 16mm;
    @bottom-center {
      content: "La Brasserie des Plantes — Rapport de bascule www. — page " counter(page) " / " counter(pages);
      font-size: 9pt;
      color: #6b7280;
    }
  }
  * { box-sizing: border-box; }
  html { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1f2937; }
  body { max-width: 100%; margin: 0; padding: 0; }
  h1, h2, h3, h4, h5 { font-family: Georgia, "Times New Roman", serif; color: #14532d; page-break-after: avoid; line-height: 1.25; }
  h1 { font-size: 28pt; margin: 0 0 8pt 0; border-bottom: 2pt solid #14532d; padding-bottom: 6pt; }
  h2 { font-size: 18pt; margin: 24pt 0 8pt 0; padding-top: 6pt; border-top: 0.5pt solid #d1fae5; }
  h3 { font-size: 13pt; margin: 14pt 0 6pt 0; color: #166534; }
  h4 { font-size: 11pt; margin: 10pt 0 4pt 0; color: #166534; }
  h1 + p, h2 + p, h3 + p { margin-top: 0; }
  p { margin: 0 0 8pt 0; orphans: 3; widows: 3; }
  ul, ol { margin: 0 0 10pt 0; padding-left: 18pt; }
  li { margin-bottom: 3pt; }
  strong { color: #14532d; }
  em { color: #4b5563; }
  code { background: #f3f4f6; padding: 1pt 4pt; border-radius: 2pt; font-family: "SF Mono", Menlo, Monaco, Consolas, monospace; font-size: 9pt; color: #b91c1c; }
  pre { background: #f9fafb; border: 0.5pt solid #e5e7eb; border-radius: 4pt; padding: 8pt; overflow-x: auto; font-size: 8.5pt; line-height: 1.4; page-break-inside: avoid; }
  pre code { background: none; padding: 0; color: #1f2937; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt 0; font-size: 9pt; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border: 0.5pt solid #d1d5db; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #f0fdf4; color: #14532d; font-weight: 600; }
  blockquote { border-left: 3pt solid #16a34a; background: #f0fdf4; padding: 6pt 10pt; margin: 8pt 0 10pt 0; font-style: italic; }
  a { color: #166534; text-decoration: underline; }
  hr { border: none; border-top: 0.5pt solid #d1d5db; margin: 18pt 0; }
  .page-break { page-break-after: always; }
  /* Cover */
  .cover { text-align: center; padding: 40mm 0 30mm 0; page-break-after: always; }
  .cover .brand { font-size: 14pt; color: #6b7280; letter-spacing: 0.18em; text-transform: uppercase; }
  .cover h1 { font-size: 36pt; border: none; margin: 24pt 0 8pt 0; }
  .cover .subtitle { font-size: 14pt; color: #4b5563; font-style: italic; }
  .cover .date { margin-top: 60pt; font-size: 11pt; color: #6b7280; }
  /* Score badges */
  .score-badge { display: inline-block; padding: 2pt 8pt; border-radius: 12pt; font-size: 9pt; font-weight: 600; }
  .score-good { background: #d1fae5; color: #065f46; }
  .score-warn { background: #fef3c7; color: #92400e; }
  .score-bad { background: #fee2e2; color: #991b1b; }
  /* Verdict box */
  .verdict { border: 1pt solid #14532d; border-radius: 6pt; background: #f0fdf4; padding: 12pt; margin: 14pt 0; page-break-inside: avoid; }
  .verdict.go { border-color: #16a34a; background: #dcfce7; }
  .verdict.nogo { border-color: #dc2626; background: #fee2e2; }
  .verdict.warn { border-color: #d97706; background: #fef3c7; }
`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>La Brasserie des Plantes — Rapport de bascule www.</title>
<style>${css}</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

writeFileSync(HTML_PATH, html, 'utf-8');
console.log(`✓ HTML écrit : ${HTML_PATH}`);

// Chrome headless → PDF
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(chromePath)) {
  console.error(`✗ Chrome introuvable à ${chromePath}`);
  process.exit(1);
}

console.log('→ Chrome headless en cours...');
execSync(
  `"${chromePath}" --headless --disable-gpu --no-sandbox --print-to-pdf="${PDF_PATH}" --print-to-pdf-no-header --no-pdf-header-footer "file://${HTML_PATH}"`,
  { stdio: 'inherit' }
);

console.log(`✓ PDF généré : ${PDF_PATH}`);
