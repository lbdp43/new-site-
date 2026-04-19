// Table de correspondance des slugs FR <-> EN pour l'i18n routing.
// Quand un slug existe ici, les deux versions linguistiques ont des URLs différentes
// (ex: /notre-histoire ↔ /en/our-story). Sinon, même slug dans les deux langues.
//
// Pour ajouter une page traduite :
// 1. Ajouter la paire { fr: "...", en: "..." } ci-dessous
// 2. Créer src/pages/en/<en-slug>.astro

import type { Lang } from './ui';

/**
 * Mapping des slugs de premier niveau.
 * La clé "/" = homepage.
 */
export const routeMap = {
  // Pages principales
  '/': { fr: '/', en: '/en/' },
  '/notre-histoire': { fr: '/notre-histoire', en: '/en/our-story' },
  '/boutique': { fr: '/boutique', en: '/en/shop' },
  '/lumiere-obscure': { fr: '/lumiere-obscure', en: '/en/dark-light' },
  '/nos-plantes': { fr: '/nos-plantes', en: '/en/our-plants' },
  '/cocktails': { fr: '/cocktails', en: '/en/cocktails' },
  '/ateliers': { fr: '/ateliers', en: '/en/workshops' },
  '/professionnels': { fr: '/professionnels', en: '/en/trade' },
  '/contact': { fr: '/contact', en: '/en/contact' },
  '/blog': { fr: '/blog', en: '/en/journal' },
  '/faq': { fr: '/faq', en: '/en/faq' },
  '/presse': { fr: '/presse', en: '/en/press' },
  '/mentions-legales': { fr: '/mentions-legales', en: '/en/legal-notice' },
  '/cgv': { fr: '/cgv', en: '/en/terms-of-sale' },
  '/politique-cookies': { fr: '/politique-cookies', en: '/en/cookie-policy' },
} as const;

/**
 * Génère le chemin localisé d'une URL FR.
 * Exemple : localizedPath('/notre-histoire', 'en') → '/en/our-story'
 *           localizedPath('/notre-histoire', 'fr') → '/notre-histoire'
 *
 * Pour les sous-routes dynamiques (boutique/[slug], blog/[...slug]),
 * préfixer manuellement avec getPrefix(lang).
 */
export function localizedPath(frPath: string, lang: Lang): string {
  // Normalise : retire trailing slash sauf pour la home
  const normalized = frPath === '/' ? '/' : frPath.replace(/\/$/, '');

  if (normalized in routeMap) {
    return routeMap[normalized as keyof typeof routeMap][lang];
  }

  // Sous-routes (ex: /boutique/lherbe-des-druides)
  // On cherche le préfixe le plus long qui matche
  for (const key of Object.keys(routeMap).sort((a, b) => b.length - a.length)) {
    if (normalized.startsWith(key + '/')) {
      const rest = normalized.slice(key.length);
      return routeMap[key as keyof typeof routeMap][lang] + rest;
    }
  }

  // Aucun match : préfixer simplement par /en/ pour l'anglais
  if (lang === 'en') {
    return `/en${normalized === '/' ? '' : normalized}`;
  }
  return normalized;
}

/**
 * Retourne le chemin équivalent dans l'autre langue (pour le language switcher).
 */
export function alternateLangPath(currentPath: string, currentLang: Lang, targetLang: Lang): string {
  if (currentLang === targetLang) return currentPath;

  // Cas courant : on part d'une page FR et on veut l'EN
  if (currentLang === 'fr' && targetLang === 'en') {
    return localizedPath(currentPath, 'en');
  }

  // On part d'EN et on veut FR : chercher la clé FR dont le mapping en === currentPath
  if (currentLang === 'en' && targetLang === 'fr') {
    const normalized = currentPath === '/en/' || currentPath === '/en' ? '/en/' : currentPath.replace(/\/$/, '');

    for (const [frKey, entry] of Object.entries(routeMap)) {
      if (entry.en === normalized) return frKey;
      // Sous-route EN → FR
      if (normalized.startsWith(entry.en + '/')) {
        const rest = normalized.slice(entry.en.length);
        return frKey + rest;
      }
    }

    // Pas de mapping explicite : retirer le préfixe /en
    return normalized.replace(/^\/en(\/|$)/, '/');
  }

  return currentPath;
}
