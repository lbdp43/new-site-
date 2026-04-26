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
 *
 * ES et IT : pour l'instant seule la home est déclarée. Les autres routes
 * retombent automatiquement sur un préfixe simple (/es/xxx, /it/xxx) via
 * `localizedPath` — ajoute une entrée ici quand tu crées une vraie page
 * avec un slug localisé.
 */
export const routeMap = {
  // Pages principales
  '/': { fr: '/', en: '/en/', es: '/es/', it: '/it/' },
  '/notre-histoire': { fr: '/notre-histoire', en: '/en/our-story', es: '/es/nuestra-historia', it: '/it/la-nostra-storia' },
  '/boutique': { fr: '/boutique', en: '/en/shop', es: '/es/tienda', it: '/it/bottega' },
  '/lumiere-obscure': { fr: '/lumiere-obscure', en: '/en/dark-light', es: '/es/luz-oscura', it: '/it/luce-oscura' },
  '/nos-plantes': { fr: '/nos-plantes', en: '/en/our-plants', es: '/es/nuestras-plantas', it: '/it/le-nostre-piante' },
  '/cocktails': { fr: '/cocktails', en: '/en/cocktails', es: '/es/cocteles', it: '/it/cocktail' },
  // Pages-piliers SEO (keywords commerciaux haute valeur)
  '/liqueurs-artisanales': { fr: '/liqueurs-artisanales', en: '/en/craft-liqueurs', es: '/es/licores-artesanales', it: '/it/liquori-artigianali' },
  '/liqueurs-de-plantes': { fr: '/liqueurs-de-plantes', en: '/en/botanical-liqueurs', es: '/es/licores-de-plantas', it: '/it/liquori-di-piante' },
  '/liqueur-digestive': { fr: '/liqueur-digestive', en: '/en/digestif', es: '/es/licor-digestivo', it: '/it/liquore-digestivo' },
  '/ateliers': { fr: '/ateliers', en: '/en/workshops', es: '/es/talleres', it: '/it/laboratori' },
  '/professionnels': { fr: '/professionnels', en: '/en/trade', es: '/es/profesionales', it: '/it/professionisti' },
  '/composer-mon-coffret': { fr: '/composer-mon-coffret', en: '/en/build-your-gift-box', es: '/es/componer-mi-estuche', it: '/it/componi-il-tuo-cofanetto' },
  '/contact': { fr: '/contact', en: '/en/contact', es: '/es/contacto', it: '/it/contatti' },
  '/blog': { fr: '/blog', en: '/en/journal', es: '/es/diario', it: '/it/diario' },
  '/faq': { fr: '/faq', en: '/en/faq', es: '/es/preguntas', it: '/it/faq' },
  '/presse': { fr: '/presse', en: '/en/press', es: '/es/prensa', it: '/it/stampa' },
  '/mentions-legales': { fr: '/mentions-legales', en: '/en/legal-notice', es: '/es/aviso-legal', it: '/it/note-legali' },
  '/cgv': { fr: '/cgv', en: '/en/terms-of-sale', es: '/es/terminos', it: '/it/termini' },
  '/politique-cookies': { fr: '/politique-cookies', en: '/en/cookie-policy', es: '/es/cookies', it: '/it/cookie' },
} as const;

/**
 * Génère le chemin localisé d'une URL FR.
 * Exemple : localizedPath('/notre-histoire', 'en') → '/en/our-story'
 *           localizedPath('/notre-histoire', 'fr') → '/notre-histoire'
 *
 * Pour les sous-routes dynamiques (boutique/[slug], blog/[...slug]),
 * ajoute le rest du chemin après le préfixe localisé.
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

  // Aucun match : préfixer simplement par /xx/ pour les locales non-FR
  if (lang !== 'fr') {
    return `/${lang}${normalized === '/' ? '' : normalized}`;
  }
  return normalized;
}

/**
 * Retourne le chemin équivalent dans l'autre langue (pour le language switcher).
 */
export function alternateLangPath(currentPath: string, currentLang: Lang, targetLang: Lang): string {
  if (currentLang === targetLang) return currentPath;

  // Cas : on part d'une page FR et on veut une autre langue
  if (currentLang === 'fr') {
    return localizedPath(currentPath, targetLang);
  }

  // On part d'une langue non-FR et on veut soit FR, soit une autre non-FR.
  // Étape 1 : retrouver l'équivalent FR du chemin courant
  const prefix = `/${currentLang}`;
  const normalized = currentPath === `${prefix}/` || currentPath === prefix ? `${prefix}/` : currentPath.replace(/\/$/, '');

  let frPath = '';
  for (const [frKey, entry] of Object.entries(routeMap)) {
    const localized = (entry as Record<string, string>)[currentLang];
    if (!localized) continue;
    if (localized === normalized) {
      frPath = frKey;
      break;
    }
    if (normalized.startsWith(localized + '/')) {
      frPath = frKey + normalized.slice(localized.length);
      break;
    }
  }

  // Pas de mapping explicite : retirer le préfixe /xx
  if (!frPath) {
    frPath = normalized.replace(new RegExp(`^${prefix}(/|$)`), '/');
  }

  // Si la cible est FR, on a fini
  if (targetLang === 'fr') return frPath;

  // Sinon on re-localise depuis FR vers la cible
  return localizedPath(frPath, targetLang);
}
