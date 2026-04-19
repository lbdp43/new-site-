// Helpers i18n — détection de langue + traduction + hreflang.

import { ui, defaultLang, type Lang, type UIKey } from './ui';
import { localizedPath, alternateLangPath } from './routes';

export { localizedPath, alternateLangPath };
export type { Lang };

/**
 * Détecte la langue d'une URL (chemin ou URL complète).
 * /en/anything → 'en', sinon 'fr'.
 */
export function getLangFromUrl(url: URL | string): Lang {
  const pathname = typeof url === 'string' ? url : url.pathname;
  if (pathname.startsWith('/en/') || pathname === '/en') return 'en';
  return 'fr';
}

/**
 * Traduit une clé UI. Si la clé n'existe pas dans la langue demandée,
 * fallback sur le français puis sur la clé elle-même.
 */
export function t(key: UIKey, lang: Lang = defaultLang): string {
  const translated = ui[lang]?.[key];
  if (translated) return translated;
  // Fallback FR
  const fallback = ui[defaultLang]?.[key];
  if (fallback) return fallback;
  // Fallback clé brute
  return key;
}

/**
 * Crée une fonction de traduction liée à une langue.
 * Usage :
 *   const tr = useTranslations(lang);
 *   <p>{tr('nav.shop')}</p>
 */
export function useTranslations(lang: Lang) {
  return (key: UIKey) => t(key, lang);
}

/**
 * Retourne la locale BCP47 pour une langue.
 * fr → fr_FR, en → en_US (par défaut international)
 */
export function getOgLocale(lang: Lang): string {
  return lang === 'en' ? 'en_US' : 'fr_FR';
}

/**
 * Retourne la locale pour l'attribut lang du <html>.
 */
export function getHtmlLang(lang: Lang): string {
  return lang === 'en' ? 'en' : 'fr';
}

/**
 * Construit les balises <link rel="alternate" hreflang="...">
 * pour une page donnée. Format Astro compatible.
 *
 * Usage dans Layout.astro :
 *   const alternates = getHreflangLinks(Astro.url.pathname, currentLang, siteUrl);
 */
export function getHreflangLinks(currentPath: string, currentLang: Lang, siteUrl: string) {
  const frPath = currentLang === 'fr' ? currentPath : alternateLangPath(currentPath, 'en', 'fr');
  const enPath = currentLang === 'en' ? currentPath : alternateLangPath(currentPath, 'fr', 'en');

  return [
    { hreflang: 'fr', href: new URL(frPath, siteUrl).toString() },
    { hreflang: 'en', href: new URL(enPath, siteUrl).toString() },
    { hreflang: 'x-default', href: new URL(frPath, siteUrl).toString() },
  ];
}

/**
 * Vérifie si une page existe dans une langue donnée.
 * Utile pour le language switcher : si la page EN n'existe pas, on masque le switch
 * ou on redirige vers la home EN.
 *
 * Note : liste statique car Astro ne permet pas l'introspection runtime des pages.
 * À maintenir à jour quand on ajoute des pages traduites.
 */
export const translatedPages: Record<Lang, string[]> = {
  fr: [], // toutes les pages FR existent par défaut
  en: [
    '/en/',
    '/en/our-story',
    '/en/shop',
    '/en/dark-light',
    '/en/our-plants',
    '/en/cocktails',
    '/en/workshops',
    '/en/trade',
    '/en/contact',
    '/en/journal',
    '/en/faq',
    '/en/press',
    '/en/legal-notice',
    '/en/terms-of-sale',
    '/en/cookie-policy',
  ],
};

export function hasTranslation(frPath: string, targetLang: Lang): boolean {
  if (targetLang === 'fr') return true;
  const translated = localizedPath(frPath, targetLang);
  return translatedPages[targetLang].some((p) => p === translated || translated.startsWith(p + '/'));
}
