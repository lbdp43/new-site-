// Dictionnaire i18n — chaînes d'interface partagées entre les pages.
// FR = langue par défaut. EN = traduction professionnelle (relue).
//
// Usage :
//   import { t } from '../i18n/utils';
//   <p>{t('nav.shop', lang)}</p>

export const languages = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  it: 'Italiano',
} as const;

export const defaultLang: Lang = 'fr';
export type Lang = 'fr' | 'en' | 'es' | 'it';

// ui[lang][key] = traduction
export const ui = {
  fr: {
    // Navigation principale
    'nav.home': 'Accueil',
    'nav.maison': 'La Maison',
    'nav.story': 'Notre histoire',
    'nav.shop': 'Boutique',
    'nav.shop-all': 'Toute la boutique',
    'nav.range-brasserie': 'Gamme Classique',
    'nav.range-aperitif': 'Gamme Apéritif',
    'nav.range-edition': 'Éditions limitées',
    'nav.range-accessoire': 'Coffrets & accessoires',
    'nav.lumiere': 'Lumière Obscure',
    'nav.plants': 'Nos plantes',
    'nav.cocktails': 'Cocktails',
    'nav.workshops': 'Ateliers',
    'nav.journal': 'Journal',
    'nav.pros': 'Pros',
    'nav.contact': 'Contact',
    'nav.discover-shop': 'Découvrir la boutique',
    'nav.open-menu': 'Ouvrir le menu',
    'nav.close-menu': 'Fermer le menu',

    // Footer / legal
    'footer.faq': 'FAQ',
    'footer.legal': 'Mentions légales',
    'footer.cgv': 'CGV',
    'footer.cookies': 'Cookies',
    'footer.press': 'Presse',
    'footer.newsletter': 'Recevoir nos nouvelles',
    'footer.newsletter-placeholder': 'Votre adresse email',
    'footer.newsletter-submit': "S'inscrire",
    'footer.rights': 'Tous droits réservés',
    'footer.abuse': "L'abus d'alcool est dangereux pour la santé. À consommer avec modération.",

    // Annonce bandeau
    'promo.free-shipping': 'Livraison offerte dès 65 €',
    'promo.delivery-time': 'Expédition sous 2 à 3 jours ouvrés',

    // Langues
    'lang.switch': 'Changer de langue',
    'lang.fr': 'Français',
    'lang.en': 'English',

    // Appels à l'action courants
    'cta.discover': 'Découvrir',
    'cta.see-more': 'En savoir plus',
    'cta.add-to-cart': 'Ajouter au panier',
    'cta.buy-now': 'Acheter maintenant',
    'cta.read-article': "Lire l'article",
    'cta.see-all-products': 'Voir tous les produits',
    'cta.see-all-articles': 'Voir tous les articles',
    'cta.contact-us': 'Nous contacter',
    'cta.write-us': 'Nous écrire',
    'cta.back-home': "Retour à l'accueil",

    // Étiquettes produit
    'product.price-from': 'À partir de',
    'product.in-stock': 'En stock',
    'product.out-of-stock': 'Rupture',
    'product.coming-soon': 'Bientôt disponible',
    'product.alcohol': "Degré d'alcool",
    'product.size': 'Contenance',
    'product.tasting': 'Notes de dégustation',
    'product.nose': 'Nez',
    'product.palate': 'Bouche',
    'product.finish': 'Finale',
    'product.awards': 'Distinctions',
    'product.composition': 'Composition',
    'product.serving': 'Dégustation',
    'product.usage': 'Utilisation',

    // Panier / checkout
    'cart.title': 'Votre panier',
    'cart.empty': 'Votre panier est vide',
    'cart.subtotal': 'Sous-total',
    'cart.total': 'Total',
    'cart.shipping': 'Livraison',
    'cart.free': 'Offerte',
    'cart.checkout': 'Valider ma commande',
    'cart.continue-shopping': 'Continuer mes achats',
    'cart.remove': 'Retirer',
    'cart.quantity': 'Quantité',

    // Divers
    'loading': 'Chargement…',
    'error': "Une erreur s'est produite",
    'page-not-found': 'Page introuvable',

    // Métadonnées / SEO home
    'home.hero.title': "L'art végétal des liqueurs",
    'home.hero.subtitle': "Artisans liquoristes en Haute-Loire",
  },

  // ES et IT : fondations minimales, fallback sur FR pour les clés non traduites.
  // À remplir progressivement quand on crée les pages /es/* et /it/*.
  es: {
    'lang.switch': 'Cambiar de idioma',
    'lang.fr': 'Français',
    'lang.en': 'English',
    'lang.es': 'Español',
    'lang.it': 'Italiano',
    'nav.home': 'Inicio',
    'nav.story': 'Nuestra historia',
    'nav.shop': 'Tienda',
    'nav.plants': 'Nuestras plantas',
    'nav.cocktails': 'Cócteles',
    'nav.workshops': 'Talleres',
    'nav.journal': 'Diario',
    'nav.contact': 'Contacto',
    'nav.discover-shop': 'Ver la tienda',
  },

  it: {
    'lang.switch': 'Cambia lingua',
    'lang.fr': 'Français',
    'lang.en': 'English',
    'lang.es': 'Español',
    'lang.it': 'Italiano',
    'nav.home': 'Home',
    'nav.story': 'La nostra storia',
    'nav.shop': 'Bottega',
    'nav.plants': 'Le nostre piante',
    'nav.cocktails': 'Cocktail',
    'nav.workshops': 'Laboratori',
    'nav.journal': 'Diario',
    'nav.contact': 'Contatti',
    'nav.discover-shop': 'Scopri la bottega',
  },

  en: {
    // Main navigation
    'nav.home': 'Home',
    'nav.maison': 'The House',
    'nav.story': 'Our story',
    'nav.shop': 'Shop',
    'nav.shop-all': 'All bottles',
    'nav.range-brasserie': 'Classic range',
    'nav.range-aperitif': 'Aperitif range',
    'nav.range-edition': 'Limited editions',
    'nav.range-accessoire': 'Gift sets & accessories',
    'nav.lumiere': 'Dark Light',
    'nav.plants': 'Our plants',
    'nav.cocktails': 'Cocktails',
    'nav.workshops': 'Workshops',
    'nav.journal': 'Journal',
    'nav.pros': 'Trade',
    'nav.contact': 'Contact',
    'nav.discover-shop': 'Visit the shop',
    'nav.open-menu': 'Open menu',
    'nav.close-menu': 'Close menu',

    // Footer / legal
    'footer.faq': 'FAQ',
    'footer.legal': 'Legal notice',
    'footer.cgv': 'Terms of sale',
    'footer.cookies': 'Cookies',
    'footer.press': 'Press',
    'footer.newsletter': 'Get our news',
    'footer.newsletter-placeholder': 'Your email address',
    'footer.newsletter-submit': 'Subscribe',
    'footer.rights': 'All rights reserved',
    'footer.abuse': 'Excessive alcohol consumption is harmful to health. Please drink responsibly.',

    // Banner annoucement
    'promo.free-shipping': 'Free shipping on orders above €65',
    'promo.delivery-time': 'Dispatch within 2 to 3 business days',

    // Languages
    'lang.switch': 'Change language',
    'lang.fr': 'Français',
    'lang.en': 'English',

    // Common CTAs
    'cta.discover': 'Discover',
    'cta.see-more': 'Learn more',
    'cta.add-to-cart': 'Add to cart',
    'cta.buy-now': 'Buy now',
    'cta.read-article': 'Read article',
    'cta.see-all-products': 'See all products',
    'cta.see-all-articles': 'See all articles',
    'cta.contact-us': 'Contact us',
    'cta.write-us': 'Write to us',
    'cta.back-home': 'Back to home',

    // Product labels
    'product.price-from': 'From',
    'product.in-stock': 'In stock',
    'product.out-of-stock': 'Out of stock',
    'product.coming-soon': 'Coming soon',
    'product.alcohol': 'Alcohol',
    'product.size': 'Size',
    'product.tasting': 'Tasting notes',
    'product.nose': 'Nose',
    'product.palate': 'Palate',
    'product.finish': 'Finish',
    'product.awards': 'Awards',
    'product.composition': 'Ingredients',
    'product.serving': 'Serving',
    'product.usage': 'Pairings',

    // Cart / checkout
    'cart.title': 'Your cart',
    'cart.empty': 'Your cart is empty',
    'cart.subtotal': 'Subtotal',
    'cart.total': 'Total',
    'cart.shipping': 'Shipping',
    'cart.free': 'Free',
    'cart.checkout': 'Proceed to checkout',
    'cart.continue-shopping': 'Continue shopping',
    'cart.remove': 'Remove',
    'cart.quantity': 'Quantity',

    // Misc
    'loading': 'Loading…',
    'error': 'An error occurred',
    'page-not-found': 'Page not found',

    // Home metadata / SEO
    'home.hero.title': 'The botanical art of spirits',
    'home.hero.subtitle': 'Craft botanical liqueur house in Haute-Loire, France',
  },
} as const;

export type UIKey = keyof (typeof ui)['fr'];
