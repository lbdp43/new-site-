// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://labrasseriedesplantes.fr',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      i18n: undefined,
      // Exclut les pages transactionnelles (noindex) et la confirmation
      // (URL avec query params, pas indexable). Évite la contradiction
      // "URL noindex dans le sitemap" qui dégrade la confiance du crawler.
      filter: (page) =>
        !/\/(panier|commande)(\/|$)/.test(new URL(page).pathname),
    }),
  ]
});