<?php
/**
 * Plugin Name: LBDP Astro CORS
 * Description: Autorise le site Astro (www. + apex + test.labrasseriedesplantes.fr + localhost:4321) à dialoguer avec la WooCommerce Store API depuis un navigateur. Expose aussi les headers Cart-Token / Nonce nécessaires au panier, et fait le pont de session pour les routes PayPal (wc-ppcp).
 * Version:     1.3.0
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
 *  1.3.0 — PONT DE SESSION POUR PAYPAL (wc-ppcp).
 *          Diagnostic du 22/09/2026 : un appel à
 *          POST /wp-json/wc-ppcp/v1/cart/order avec un `Cart-Token` valide
 *          renvoie 200 et un corps VIDE, alors que le même jeton renvoie
 *          bien le panier (1 article, 55,00 €) sur /wc/store/v1/cart.
 *          Cause : WooCommerce n'installe son gestionnaire de session
 *          "Store API" (celui qui sait lire l'en-tête Cart-Token) que pour
 *          les routes /wc/store/*. Les routes du plugin PayPal, elles,
 *          cherchent la session dans un cookie — que le front Astro, sur un
 *          autre domaine, n'a pas. Le plugin ne trouve donc aucun panier et
 *          renvoie du vide sans protester.
 *          Ce correctif étend le gestionnaire Store API aux routes wc-ppcp.
 *          ⚠️ ÉCRIT SANS POUVOIR ÊTRE TESTÉ (l'environnement de dev ne joint
 *          pas le WordPress) — à installer en pouvant surveiller le site.
 *  1.2.0 — Ajoute `www.` et l'apex aux origines autorisées, en prévision
 *          de la bascule du domaine public sur le site Astro.
 *          ⚠️ AUCUN RISQUE À L'INSTALLER AVANT LA BASCULE : autoriser une
 *          origine qui n'existe pas encore n'a aucun effet. Le navigateur
 *          n'envoie un en-tête `Origin` que depuis le domaine réellement
 *          servi. Installer cette version tôt retire une étape du jour J —
 *          et évite le scénario où le panier casse sur `www.` parce qu'on
 *          a oublié de téléverser le plugin dans le feu de l'action.
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
        // Domaine public après la bascule. L'origine est celle du site qui
        // AFFICHE les pages (Astro), pas celle qui sert l'API — donc quand le
        // WordPress passera sur wp.labrasseriedesplantes.fr, rien à changer ici.
        'https://www.labrasseriedesplantes.fr',
        'https://labrasseriedesplantes.fr',  // apex (redirige vers www.)

        'https://test.labrasseriedesplantes.fr',
        'http://localhost:4321',  // Astro dev
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

/* =====================================================================
 *  PONT DE SESSION — routes PayPal (wc-ppcp)
 *
 *  LE PROBLÈME
 *  Le front Astro identifie son panier avec un jeton `Cart-Token` (un JWT
 *  émis par la Store API), pas avec un cookie : il est sur un autre domaine,
 *  les cookies WordPress ne le suivent pas.
 *
 *  WooCommerce sait lire ce jeton — mais seulement pour ses propres routes
 *  `/wc/store/*`, pour lesquelles il installe un gestionnaire de session
 *  dédié. Les routes du plugin PayPal (`/wc-ppcp/*`) n'en bénéficient pas :
 *  elles cherchent la session dans le cookie, ne trouvent rien, et
 *  renvoient un corps vide avec un 200 trompeur.
 *
 *  LA CORRECTION
 *  Étendre ce même gestionnaire aux routes `wc-ppcp`, et s'assurer que le
 *  panier est chargé avant que le plugin ne s'exécute.
 *
 *  ⚠️ POURQUOI C'EST SANS DANGER POUR LE SITE WORDPRESS ACTUEL
 *  Tout est conditionné à la présence de l'en-tête `Cart-Token`. Un
 *  visiteur normal du WordPress n'en envoie JAMAIS — seul le front Astro le
 *  fait. Le tunnel de commande WordPress actuel n'est donc pas modifié d'un
 *  iota : ces deux hooks sortent immédiatement pour lui.
 * ===================================================================== */

/**
 * Vrai uniquement pour une requête REST vers le plugin PayPal accompagnée
 * d'un Cart-Token — c'est-à-dire, en pratique, une requête du front Astro.
 */
function lbdp_astro_is_headless_ppcp_request() : bool {
    if ( empty( $_SERVER['HTTP_CART_TOKEN'] ) ) {
        return false;
    }
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    return strpos( $uri, '/wc-ppcp/' ) !== false;
}

/**
 * Fait lire l'en-tête `Cart-Token` par WooCommerce sur les routes wc-ppcp,
 * en y installant le gestionnaire de session de la Store API.
 *
 * Le `class_exists()` est volontaire : si WooCommerce renomme ou déplace
 * cette classe dans une version future, on retombe silencieusement sur le
 * gestionnaire par défaut. PayPal cessera de fonctionner côté Astro — ce
 * qui est visible et réparable — plutôt que de provoquer une erreur fatale
 * sur tout le site.
 */
add_filter( 'woocommerce_session_handler', function ( $handler ) {
    if ( ! lbdp_astro_is_headless_ppcp_request() ) {
        return $handler;
    }

    $store_api_handler = 'Automattic\\WooCommerce\\StoreApi\\SessionHandler';

    return class_exists( $store_api_handler ) ? $store_api_handler : $handler;
}, 20 );

/**
 * Charge le panier avant que les routes wc-ppcp ne s'exécutent.
 *
 * Sur le site WordPress, ces routes sont appelées via le tunnel
 * `?wc-ajax=wc_ppcp_frontend_request`, et c'est WooCommerce qui charge le
 * panier au passage. En REST direct, personne ne le fait : sans ça, le
 * gestionnaire de session ci-dessus serait bien en place, mais `WC()->cart`
 * resterait vide.
 */
add_action( 'rest_api_init', function () {
    if ( ! lbdp_astro_is_headless_ppcp_request() ) {
        return;
    }
    if ( ! function_exists( 'wc_load_cart' ) || ! function_exists( 'WC' ) ) {
        return;
    }
    if ( ! empty( WC()->cart ) ) {
        return; // déjà chargé
    }
    wc_load_cart();
}, 5 );
