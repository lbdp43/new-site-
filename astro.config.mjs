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
      // Différencie la priorité : home + boutique = 1.0, fiches produit 0.9,
      // Lumière Obscure + cocktails + ateliers 0.8, contenu secondaire 0.7,
      // pages légales 0.3. Changefreq adapté selon la fréquence d'update.
      serialize(item) {
        const p = new URL(item.url).pathname;
        if (p === '/' || p === '/boutique' || p === '/boutique/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
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