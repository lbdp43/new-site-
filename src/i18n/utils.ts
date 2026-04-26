// Helpers i18n — détection de langue + traduction + hreflang.

import { ui, defaultLang, type Lang, type UIKey } from './ui';
import { localizedPath, alternateLangPath } from './routes';

export { localizedPath, alternateLangPath };
export type { Lang };

/**
 * Détecte la langue d'une URL (chemin ou URL complète).
 * /en/* → 'en', /es/* → 'es', /it/* → 'it', sinon 'fr'.
 */
export function getLangFromUrl(url: URL | string): Lang {
  const pathname = typeof url === 'string' ? url : url.pathname;
  if (pathname.startsWith('/en/') || pathname === '/en') return 'en';
  if (pathname.startsWith('/es/') || pathname === '/es') return 'es';
  if (pathname.startsWith('/it/') || pathname === '/it') return 'it';
  return 'fr';
}

/**
 * Traduit une clé UI. Si la clé n'existe pas dans la langue demandée,
 * fallback sur le français puis sur la clé elle-même.
 *
 * ES et IT sont des dictionnaires partiels — toutes les clés non traduites
 * retombent naturellement sur FR via le fallback.
 */
export function t(key: UIKey, lang: Lang = defaultLang): string {
  // Cast nécessaire car ES/IT sont des dictionnaires partiels de UIKey.
  const dict = ui[lang] as Record<string, string | undefined> | undefined;
  const translated = dict?.[key];
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
 */
export function getOgLocale(lang: Lang): string {
  // en_GB plutôt que en_US : audience cible majoritairement européenne
  // (FR, BE, CH, LU + visiteurs UK). Signal géographique plus pertinent
  // pour Google côté EN.
  const map: Record<Lang, string> = {
    fr: 'fr_FR',
    en: 'en_GB',
    es: 'es_ES',
    it: 'it_IT',
  };
  return map[lang];
}

/**
 * Retourne la locale pour l'attribut lang du <html>.
 */
export function getHtmlLang(lang: Lang): string {
  return lang;
}

/**
 * Construit les balises <link rel="alternate" hreflang="...">
 * pour une page donnée. Format Astro compatible.
 *
 * Usage dans Layout.astro :
 *   const alternates = getHreflangLinks(Astro.url.pathname, currentLang, siteUrl);
 */
/** Normalise un chemin pour toujours se terminer par `/` (aligné avec le sitemap généré). */
function withTrailingSlash(path: string): string {
  if (!path) return '/';
  if (path.endsWith('/')) return path;
  // ne pas ajouter de slash si query string ou hash (pas le cas dans ce projet, par sécurité)
  if (path.includes('?') || path.includes('#')) return path;
  return path + '/';
}

export function getHreflangLinks(currentPath: string, currentLang: Lang, siteUrl: string) {
  // Calcule le chemin FR canonique (pivot pour toutes les conversions)
  const frPath = currentLang === 'fr'
    ? currentPath
    : alternateLangPath(currentPath, currentLang, 'fr');

  // Génère un alternate par langue déclarée, en n'émettant que si la page
  // a effectivement une traduction publiée (évite de pointer vers une page
  // 404). FR est toujours considérée présente (langue source).
  const langs: Lang[] = ['fr', 'en', 'es', 'it'];
  const alternates = langs
    .filter((lang) => lang === 'fr' || hasTranslation(frPath, lang))
    .map((lang) => {
      const path = lang === 'fr' ? frPath : localizedPath(frPath, lang);
      return { hreflang: lang, href: new URL(withTrailingSlash(path), siteUrl).toString() };
    });

  // x-default → version FR (langue par défaut du site)
  alternates.push({
    hreflang: 'x-default',
    href: new URL(withTrailingSlash(frPath), siteUrl).toString(),
  });

  return alternates;
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
    '/en/build-your-gift-box',
  ],
  // ES et IT : seule la home existe pour l'instant. Étendre cette liste à
  // chaque nouvelle page traduite (sinon les hreflang ne seront pas émis).
  es: ['/es/'],
  it: ['/it/'],
};

export function hasTranslation(frPath: string, targetLang: Lang): boolean {
  if (targetLang === 'fr') return true;
  const translated = localizedPath(frPath, targetLang);
  return translatedPages[targetLang].some((p) => p === translated || translated.startsWith(p + '/'));
}
