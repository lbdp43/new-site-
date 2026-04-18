<?php
/**
 * Plugin Name: LBDP Astro CORS
 * Description: Autorise le site Astro (test.labrasseriedesplantes.fr + localhost:4321) à dialoguer avec la WooCommerce Store API depuis un navigateur. Expose aussi les headers Cart-Token / Nonce nécessaires au panier.
 * Version:     1.0.0
 * Author:      La Brasserie des Plantes
 *
 * =====================================================================
 *  INSTALLATION
 *  1. Zippe ce dossier (astro-cors/) en astro-cors.zip
 *  2. WP Admin → Extensions → Ajouter → Téléverser une extension
 *  3. Active le plugin
 *  Pour retirer le CORS : désactive simplement le plugin.
 * =====================================================================
 */

defined( 'ABSPATH' ) || exit;

/**
 * Liste des origines autorisées à appeler l'API en cross-domain.
 * Ajuste cette liste si tu changes de sous-domaine / de port local.
 */
function lbdp_astro_allowed_origins() : array {
    return [
        'https://test.labrasseriedesplantes.fr',
        'http://localhost:4321',  // Astro dev
        'http://127.0.0.1:4321',
    ];
}

/**
 * Ajoute les headers CORS aux réponses REST (y compris la Store API).
 * Court-circuite la vérification CSRF classique en exposant Cart-Token /
 * Nonce, dont WooCommerce a besoin pour les requêtes cross-origin.
 */
add_action( 'rest_api_init', function() {
    // On retire les headers CORS par défaut de WP pour mettre les nôtres.
    remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );

    add_filter( 'rest_pre_serve_request', function( $value ) {
        $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = lbdp_astro_allowed_origins();

        if ( $origin && in_array( $origin, $allowed, true ) ) {
            header( "Access-Control-Allow-Origin: {$origin}" );
            header( 'Vary: Origin' );
            header( 'Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS' );
            header( 'Access-Control-Allow-Credentials: true' );
            header( 'Access-Control-Allow-Headers: Authorization, Content-Type, Cart-Token, Nonce, X-WC-Store-API-Nonce, X-WP-Nonce' );
            header( 'Access-Control-Expose-Headers: Cart-Token, Nonce, X-WC-Store-API-Nonce' );
            header( 'Access-Control-Max-Age: 600' );
        }

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
