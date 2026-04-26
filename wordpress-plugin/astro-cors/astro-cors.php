<?php
/**
 * Plugin Name: LBDP Astro CORS
 * Description: Autorise le site Astro (www. + apex + test.labrasseriedesplantes.fr + localhost:4321) à dialoguer avec la WooCommerce Store API depuis un navigateur. Expose aussi les headers Cart-Token / Nonce nécessaires au panier.
 * Version:     1.2.0
 * Author:      La Brasserie des Plantes
 *
 * =====================================================================
 *  INSTALLATION
 *  1. Zippe ce dossier (astro-cors/) en astro-cors.zip
 *  2. WP Admin → Extensions → Ajouter → Téléverser une extension
 *  3. Active le plugin (en cas de mise à jour : remplacer + réactiver)
 *  Pour retirer le CORS : désactive simplement le plugin.
 *
 *  CHANGELOG
 *  1.2.0 — Ajoute www.labrasseriedesplantes.fr et l'apex
 *          (labrasseriedesplantes.fr) à la liste des origines autorisées,
 *          en préparation de la bascule DNS du site front Astro sur le
 *          domaine principal.
 *  1.1.0 — Ajoute les headers CORS dès l'action `init` (avant que WC
 *          ait le temps de wp_die() en cas d'erreur fatale). Sans ça,
 *          un 500 dans WooPayments arrivait sans Access-Control-Allow-
 *          Origin et le navigateur bloquait JS de lire la réponse →
 *          "Failed to fetch" mystérieux.
 *  1.0.0 — Version initiale.
 * =====================================================================
 */

defined( 'ABSPATH' ) || exit;

/**
 * Liste des origines autorisées à appeler l'API en cross-domain.
 * Ajuste cette liste si tu changes de sous-domaine / de port local.
 */
function lbdp_astro_allowed_origins() : array {
    return [
        'https://www.labrasseriedesplantes.fr',  // domaine principal Astro (post-bascule)
        'https://labrasseriedesplantes.fr',      // apex (redirige vers www. côté Vercel)
        'https://test.labrasseriedesplantes.fr', // staging Astro
        'http://localhost:4321',                 // Astro dev
        'http://127.0.0.1:4321',
    ];
}

/**
 * Pose les headers CORS le plus TÔT possible (action `init` priorité 1).
 *
 * Pourquoi pas seulement via `rest_pre_serve_request` (cf. v1.0.0) ?
 *   Quand WooCommerce / WooPayments rencontre une erreur fatale dans le
 *   handler REST, il sort en `wp_die()` sans jamais déclencher le filtre
 *   `rest_pre_serve_request`. Résultat : la réponse 500 part SANS
 *   Access-Control-Allow-Origin, le navigateur la bloque côté JS, et le
 *   front voit "Failed to fetch" sans aucune chance de récupérer le
 *   message d'erreur réel. En posant les headers ici (avant que quoi
 *   que ce soit s'exécute), ils sont systématiquement présents.
 */
function lbdp_astro_send_cors_headers() : void {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if ( strpos( $uri, '/wp-json/' ) === false ) {
        return;
    }

    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = lbdp_astro_allowed_origins();

    if ( ! $origin || ! in_array( $origin, $allowed, true ) ) {
        return;
    }

    if ( headers_sent() ) {
        return;
    }

    header( "Access-Control-Allow-Origin: {$origin}" );
    header( 'Vary: Origin' );
    header( 'Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS' );
    header( 'Access-Control-Allow-Credentials: true' );
    header( 'Access-Control-Allow-Headers: Authorization, Content-Type, Cart-Token, Nonce, X-WC-Store-API-Nonce, X-WP-Nonce' );
    header( 'Access-Control-Expose-Headers: Cart-Token, Nonce, X-WC-Store-API-Nonce' );
    header( 'Access-Control-Max-Age: 600' );
}

// Très tôt — avant tout traitement REST / WC qui pourrait wp_die().
add_action( 'init', 'lbdp_astro_send_cors_headers', 1 );

/**
 * Garde aussi le filtre rest_pre_serve_request comme défense secondaire
 * (au cas où des headers seraient envoyés tardivement par une couche
 *  intermédiaire qui retire les nôtres).
 */
add_action( 'rest_api_init', function() {
    remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
    add_filter( 'rest_pre_serve_request', function( $value ) {
        lbdp_astro_send_cors_headers();
        return $value;
    }, 15 );
}, 15 );

/**
 * Certains navigateurs envoient un preflight OPTIONS avant les POST / PUT.
 * WP renvoie 404 par défaut : on intercepte et on renvoie un 204 propre.
 */
add_action( 'init', function() {
    if ( ( $_SERVER['REQUEST_METHOD'] ?? '' ) !== 'OPTIONS' ) {
        return;
    }

    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = lbdp_astro_allowed_origins();

    if ( ! $origin || ! in_array( $origin, $allowed, true ) ) {
        return;
    }

    // Ne traite que les preflights sur /wp-json/…
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if ( strpos( $uri, '/wp-json/' ) === false ) {
        return;
    }

    header( "Access-Control-Allow-Origin: {$origin}" );
    header( 'Vary: Origin' );
    header( 'Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS' );
    header( 'Access-Control-Allow-Credentials: true' );
    header( 'Access-Control-Allow-Headers: Authorization, Content-Type, Cart-Token, Nonce, X-WC-Store-API-Nonce, X-WP-Nonce' );
    header( 'Access-Control-Max-Age: 600' );
    http_response_code( 204 );
    exit;
}, 0 );
