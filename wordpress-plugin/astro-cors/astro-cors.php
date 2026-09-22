<?php
/**
 * Plugin Name: LBDP Astro CORS
 * Description: Autorise le site Astro (www. + apex + test.labrasseriedesplantes.fr + localhost:4321) à dialoguer avec la WooCommerce Store API depuis un navigateur. Expose aussi les headers Cart-Token / Nonce nécessaires au panier, et fait le pont de session pour les routes PayPal (wc-ppcp).
 * Version:     1.4.0
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
 *  1.4.0 — ROUTE D'ENCAISSEMENT `lbdp-astro/v1/pay-order`.
 *          Suite de l'incident du 22/09/2026 : `/wc-ppcp/v1/cart/checkout`
 *          encaisse SANS créer de commande (deux débits de 16 € sans aucune
 *          trace en boutique), et `/wc/store/v1/checkout` crée la commande
 *          sans jamais encaisser. Cette route recolle les deux moitiés dans
 *          le bon ordre : le front crée d'abord la commande en attente, puis
 *          appelle ceci pour l'encaisser via `process_payment()` — la même
 *          méthode publique que WooCommerce appelle sur sa propre page.
 *          Autorisation par `order_key`, comme la page de paiement invité.
 *          Refuse toute commande qui n'est pas en attente de paiement.
 *          ⚠️ ÉCRIT SANS POUVOIR ÊTRE TESTÉ — installer en surveillant.
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

/* =====================================================================
 *  ENCAISSEMENT D'UNE COMMANDE EXISTANTE (route maison)
 * =====================================================================
 *
 *  POST /wp-json/lbdp-astro/v1/pay-order
 *  { order_id, order_key, ppcp_paypal_order_id }
 *
 *  POURQUOI CETTE ROUTE EXISTE — incident du 22/09/2026.
 *
 *  Appelée depuis le front Astro, la route `/wc-ppcp/v1/cart/checkout` de
 *  l'extension PayPal ENCAISSE réellement l'argent puis renvoie vers sa page
 *  de relecture SANS CRÉER LA MOINDRE COMMANDE WooCommerce. Deux paiements de
 *  16 € ont été débités sans qu'aucune commande n'existe côté boutique.
 *  `/wc-ppcp/v1/order/pay` répond 200 avec un corps vide et ne fait rien.
 *
 *  Inversement, `POST /wc/store/v1/checkout` crée la commande de façon fiable
 *  mais ne déclenche jamais l'encaissement PayPal.
 *
 *  Cette route recolle les deux moitiés, dans le bon ordre :
 *  le front crée d'abord la commande (en attente, aucun argent en jeu), puis
 *  appelle ceci pour l'encaisser. C'est exactement ce que fait WooCommerce sur
 *  sa propre page de paiement — on appelle la MÊME méthode publique de la
 *  passerelle, `process_payment()`, avec le même champ `$_POST`.
 *
 *  🔒 GARANTIE DE SÛRETÉ : la commande existe AVANT tout encaissement. Un
 *  débit sans commande est donc impossible, et tout débit reste visible en
 *  back-office et remboursable depuis WooCommerce. C'est la propriété que
 *  l'incident avait fait perdre.
 *
 *  AUTHENTIFICATION : `order_key`, le secret que WooCommerce utilise déjà
 *  lui-même pour autoriser le paiement d'une commande d'invité
 *  (/checkout/order-pay/{id}/?key=…). On n'invente pas un mécanisme.
 *
 *  ⚠️ ÉCRIT SANS POUVOIR ÊTRE TESTÉ (l'environnement de dev ne joint pas le
 *  WordPress). Les refus sont donc volontairement nombreux et explicites :
 *  en cas de doute la route ne fait RIEN et le dit, plutôt que de tenter un
 *  encaissement approximatif.
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'lbdp-astro/v1', '/pay-order', [
        'methods'             => 'POST',
        'permission_callback' => '__return_true', // l'order_key fait l'autorisation
        'callback'            => 'lbdp_astro_pay_order',
        'args'                => [
            'order_id'  => [ 'required' => true ],
            'order_key' => [ 'required' => true ],
        ],
    ] );
} );

function lbdp_astro_pay_order( WP_REST_Request $request ) {
    if ( ! function_exists( 'wc_get_order' ) || ! function_exists( 'WC' ) ) {
        return new WP_Error( 'lbdp_no_woo', 'WooCommerce n\'est pas actif.', [ 'status' => 500 ] );
    }

    $order_id  = absint( $request->get_param( 'order_id' ) );
    $order_key = (string) $request->get_param( 'order_key' );
    $order     = $order_id ? wc_get_order( $order_id ) : false;

    if ( ! $order ) {
        return new WP_Error( 'lbdp_no_order', 'Commande introuvable.', [ 'status' => 404 ] );
    }

    // Même contrôle que la page de paiement WooCommerce pour un invité.
    if ( ! hash_equals( (string) $order->get_order_key(), $order_key ) ) {
        return new WP_Error( 'lbdp_bad_key', 'Clé de commande invalide.', [ 'status' => 403 ] );
    }

    // Verrou anti-double-encaissement : une commande déjà payée n'est jamais
    // repassée à la caisse, quoi que demande l'appelant.
    if ( ! $order->needs_payment() ) {
        return new WP_Error(
            'lbdp_already_paid',
            'Cette commande n\'est pas en attente de paiement.',
            [ 'status' => 409, 'order_status' => $order->get_status() ]
        );
    }

    $gateway_id = $order->get_payment_method();
    $gateways   = WC()->payment_gateways() ? WC()->payment_gateways()->payment_gateways() : [];

    if ( empty( $gateways[ $gateway_id ] ) ) {
        return new WP_Error(
            'lbdp_no_gateway',
            sprintf( 'La passerelle « %s » n\'est pas disponible.', $gateway_id ),
            [ 'status' => 400 ]
        );
    }

    // La passerelle lit ses champs dans $_POST, comme sur le formulaire de
    // commande classique. `ppcp_paypal_order_id` est le nom réellement
    // employé par l'extension : relevé dans le formulaire WordPress, et seul
    // des trois candidats testés que `cart/checkout` ait accepté.
    foreach ( [ 'ppcp_paypal_order_id', 'paypal_order_id', 'paypal_order' ] as $field ) {
        $value = $request->get_param( $field );
        if ( is_string( $value ) && $value !== '' ) {
            $_POST[ $field ]    = $value;
            $_REQUEST[ $field ] = $value;
        }
    }
    $_POST['payment_method']    = $gateway_id;
    $_REQUEST['payment_method'] = $gateway_id;

    try {
        $result = $gateways[ $gateway_id ]->process_payment( $order_id );
    } catch ( Exception $e ) {
        return new WP_Error( 'lbdp_gateway_exception', $e->getMessage(), [ 'status' => 502 ] );
    }

    // On relit la commande depuis la base : c'est elle qui fait foi, pas ce
    // que la passerelle prétend avoir fait.
    $fresh = wc_get_order( $order_id );

    return rest_ensure_response( [
        'gateway_result' => is_array( $result ) ? $result : null,
        'order_id'       => $order_id,
        'order_key'      => $order->get_order_key(),
        'status'         => $fresh ? $fresh->get_status() : null,
        'transaction_id' => $fresh ? $fresh->get_transaction_id() : '',
        'is_paid'        => $fresh ? ! $fresh->needs_payment() : false,
    ] );
}
