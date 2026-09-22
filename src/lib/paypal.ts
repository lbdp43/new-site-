/**
 * Chargement du SDK JavaScript PayPal.
 *
 * Paramètres calqués sur ceux du checkout WordPress (relevés dans l'onglet
 * Réseau le 22/09/2026), à une exception près — voir `disable-funding` :
 *
 *   intent=capture   → encaissement immédiat, pas une simple autorisation
 *   commit=true      → le bouton affiche « Payer maintenant » : le client
 *                      valide définitivement chez PayPal
 *   currency=EUR
 *
 * 🔒 **`disable-funding=paylater,card` — arbitrage Guillaume du 22/09/2026 :
 * « mets juste le bouton PayPal ».**
 *
 * Sans ce paramètre, le SDK affiche trois boutons : PayPal, « Payer en
 * plusieurs fois » (Pay Later) et « Carte bancaire » (paiement invité via
 * PayPal). Guillaume n'en veut qu'un.
 *
 * ⚠️ Ne pas « rétablir » `enable-funding=paylater` en croyant corriger un
 * oubli : le Pay Later est bien actif sur le WordPress, et cette doc a
 * d'abord recommandé de le reproduire — la décision l'a ensuite écarté.
 * La carte, elle, reste offerte par WooPayments via l'autre onglet du
 * sélecteur, donc rien n'est perdu pour le client.
 *
 * `components` est volontairement réduit à `buttons` : le WordPress charge en
 * plus `messages`, `card-fields`, `googlepay` et `applepay`, mais les
 * passerelles correspondantes (`ppcp_card`, `ppcp_googlepay`, `ppcp_applepay`)
 * sont **désactivées** côté WooCommerce. Les charger alourdirait la page sans
 * rien offrir de plus.
 *
 * ⚠️ CSP : `vercel.json` doit autoriser `https://*.paypal.com` et
 * `https://*.paypalobjects.com` en `script-src`, `frame-src` et `connect-src`,
 * sinon le navigateur bloque le SDK sans message clair.
 */

const CLIENT_ID = import.meta.env.PUBLIC_PAYPAL_CLIENT_ID as string | undefined;

/** Sous-ensemble du SDK PayPal qu'on utilise réellement. */
export interface PayPalButtonsActions {
  order?: unknown;
}

export interface PayPalButtonsOptions {
  style?: Record<string, string | number>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (err: unknown) => void;
}

export interface PayPalNamespace {
  Buttons: (options: PayPalButtonsOptions) => {
    render: (container: HTMLElement) => Promise<void>;
    close?: () => void;
  };
}

let sdkPromise: Promise<PayPalNamespace> | null = null;

/**
 * Charge le SDK une seule fois par page, même si plusieurs îles le demandent.
 * En cas d'échec réseau, la promesse mémoïsée est effacée pour qu'un nouvel
 * essai soit possible (sinon l'erreur serait définitive jusqu'au rechargement).
 */
export function loadPayPalSdk(): Promise<PayPalNamespace> {
  if (!CLIENT_ID) {
    return Promise.reject(
      new Error("PUBLIC_PAYPAL_CLIENT_ID n'est pas défini — PayPal ne peut pas se charger."),
    );
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<PayPalNamespace>((resolve, reject) => {
    const existing = (window as unknown as { paypal?: PayPalNamespace }).paypal;
    if (existing) {
      resolve(existing);
      return;
    }

    const params = new URLSearchParams({
      "client-id": CLIENT_ID,
      intent: "capture",
      commit: "true",
      currency: "EUR",
      components: "buttons",
      // Un seul bouton PayPal — cf. l'arbitrage en tête de fichier.
      "disable-funding": "paylater,card",
    });

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;

    script.onload = () => {
      const pp = (window as unknown as { paypal?: PayPalNamespace }).paypal;
      if (pp) resolve(pp);
      else {
        sdkPromise = null;
        reject(new Error("Le SDK PayPal s'est chargé mais n'a rien exposé."));
      }
    };

    script.onerror = () => {
      sdkPromise = null;
      reject(
        new Error(
          "Impossible de charger PayPal. Vérifie ta connexion, ou choisis la carte bancaire.",
        ),
      );
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}
