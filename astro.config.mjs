// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://labrasseriedesplantes.fr',

  // Inline les CSS < 4 KB dans le HTML pour supprimer le render-blocking
  // sur les routes éditoriales (gain LCP mesuré à l'audit d'avril 2026).
  // Les CSS plus gros (Layout.css ~18 KB) restent externes et sont mis en
  // cache CDN Vercel agressivement.
  build: {
    inlineStylesheets: 'auto',
  },

  // i18n — FR (défaut, pas de préfixe) + EN + ES + IT
  // ES et IT en cours de traduction : les locales sont déclarées pour que les
  // hreflang / redirects soient préparés, mais les pages elles-mêmes sont à
  // créer progressivement sous /es/* et /it/*.
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'es', 'it'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
    // Alias @/* → src/* pour matcher la convention shadcn / 21st.dev.
    // Complète `paths` dans tsconfig.json (pour l'analyse TypeScript).
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  },

  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // i18n pour sitemap : déclare les 4 langues avec leurs alternate links.
      // Les codes courts ('fr','en','es','it') sont alignés avec ce qu'émet
      // getHreflangLinks() dans le <head> HTML — sans cohérence sitemap↔HTML,
      // GSC remontait fr-FR et fr comme deux langues distinctes.
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr',
          en: 'en',
          es: 'es',
          it: 'it',
        },
      },
      // Exclut les pages transactionnelles (noindex) et la confirmation
      // (URL avec query params, pas indexable). Évite la contradiction
      // "URL noindex dans le sitemap" qui dégrade la confiance du crawler.
      // /admin/* = interface CMS (Sveltia), jamais indexable non plus.
      filter: (page) =>
        !/\/(panier|commande|admin|pro\/catalogue)(\/|$)/.test(new URL(page).pathname),
      // Différencie la priorité : home + boutique = 1.0, fiches produit 0.9,
      // Lumière Obscure + cocktails + ateliers 0.8, contenu secondaire 0.7,
      // pages légales 0.3. Changefreq adapté selon la fréquence d'update.
      serialize(item) {
        const p = new URL(item.url).pathname;
        if (p === '/' || p === '/boutique' || p === '/boutique/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (/^\/(liqueurs-artisanales|liqueurs-de-plantes|liqueur-digestive)\/?$/.test(p)) {
          // Pages-piliers SEO — keywords commerciaux haute valeur
          item.priority = 0.95;
          item.changefreq = 'weekly';
        } else if (p.startsWith('/boutique/')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else if (/^\/(lumiere-obscure|cocktails|ateliers|nos-plantes|notre-histoire|professionnels)/.test(p)) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (p.startsWith('/blog')) {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        } else if (/^\/(mentions-legales|cgv|politique-cookies|faq|contact)/.test(p)) {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        }
        return item;
      },
    }),
  ]
});