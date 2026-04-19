// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://labrasseriedesplantes.fr',

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
    plugins: [tailwindcss()]
  },

  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // i18n pour sitemap : déclare les 4 langues avec leurs alternate links
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr-FR',
          en: 'en-US',
          es: 'es-ES',
          it: 'it-IT',
        },
      },
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