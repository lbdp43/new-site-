// Feed Instagram — placeholder tant qu'on n'a pas branché la Meta Graph API.
//
// ========= COMMENT METTRE À JOUR (manuellement, en 30 secondes par post) =========
//
// 1. Ouvre instagram.com/labrasseriedesplantes sur ordinateur
// 2. Clic droit sur une photo → "Enregistrer l'image sous"
// 3. Renomme-la (ex: ig-recolte-verveine.jpg) et mets-la dans public/images/instagram/
// 4. Copie l'URL du post (clic sur la photo puis copie l'URL du navigateur —
//    ex: https://www.instagram.com/p/Cxyz123ABC/)
// 5. Ajoute une entrée ci-dessous (les plus récents en haut)
//
// ========= OU AUTOMATISATION (à faire plus tard) =========
//
// Quand le compte @labrasseriedesplantes aura été converti en Instagram Business
// et connecté à une page Facebook, on pourra utiliser l'API Meta Graph pour
// générer ce fichier automatiquement à chaque build. Laisse-moi un mot le moment venu.

export interface InstagramPost {
  id: string;
  image: string;
  url: string;
  caption: string;
  date: string; // ISO
}

/** Nom d'utilisateur Instagram (sans le @) */
export const instagramHandle = 'labrasseriedesplantes';

/** URL du profil complet */
export const instagramProfileUrl = `https://www.instagram.com/${instagramHandle}/`;

/**
 * Posts affichés sur le site. Ordre = chronologique inverse (récent en haut).
 *
 * ⚠️ Pour l'instant, ces entrées utilisent des photos locales + un lien vers
 * le profil global. Remplace chaque `url` par un vrai permalien de post
 * (instagram.com/p/XXXXX/) dès que tu en copies.
 */
export const instagramPosts: InstagramPost[] = [
  {
    id: 'placeholder-1',
    image: '/images/stories/world-drinks-awards-2025.jpg',
    url: instagramProfileUrl,
    caption: "Meilleur Digestif du Monde 2025 — on a du mal à réaliser 🌿🥇",
    date: '2025-04-28',
  },
  {
    id: 'placeholder-2',
    image: '/images/cocktails/spritz-efflorescent.jpg',
    url: instagramProfileUrl,
    caption: "Le Spritz Efflorescent, notre cocktail-signature de l'été — Nectar d'Ostara, Prosecco, orange.",
    date: '2025-07-14',
  },
  {
    id: 'placeholder-3',
    image: '/images/stories/plantes.jpg',
    url: instagramProfileUrl,
    caption: "Récolte matinale de verveine citronnelle. Le parfum dans l'atelier est dingue.",
    date: '2025-07-10',
  },
  {
    id: 'placeholder-4',
    image: '/videos/duo-making-of-poster.jpg',
    url: instagramProfileUrl,
    caption: "Deux amis, un terroir, 27 plantes. Merci pour vos messages après l'annonce du prix 🙏",
    date: '2025-05-02',
  },
  {
    id: 'placeholder-5',
    image: '/images/cocktails/verveine-printaniere.jpg',
    url: instagramProfileUrl,
    caption: "La Verveine Printanière — avec l'Herbe des Druides. Recette sur le site.",
    date: '2025-06-22',
  },
  {
    id: 'placeholder-6',
    image: '/images/stories/atelier-1.jpg',
    url: instagramProfileUrl,
    caption: "Prochain atelier mixologie : samedi 19 juillet à Saint-Didier. Places limitées.",
    date: '2025-07-05',
  },
];
