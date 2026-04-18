import { useEffect, useState } from "react";
import { ensureCartLoaded, formatMoney, useCart } from "../../lib/cart-store";

export default function CartPage() {
  const {
    cart,
    loading,
    error,
    initialized,
    itemCount,
    minorUnit,
    currencySymbol,
    updateItem,
    removeItem,
    applyCoupon,
  } = useCart();

  useEffect(() => {
    ensureCartLoaded();
  }, []);

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      await applyCoupon(couponCode.trim());
      setCouponCode("");
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Code invalide.");
    }
  }

  // État chargement initial
  if (!initialized && loading) {
    return (
      <div className="py-24 text-center text-ink-500">Chargement du panier…</div>
    );
  }

  // Erreur globale (réseau, API non disponible, etc.)
  if (error && !cart) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <h1 className="font-display text-3xl text-forest-900 mb-4">Panier indisponible</h1>
        <p className="text-ink-700 mb-6">{error}</p>
        <a
          href="/boutique"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 font-medium"
        >
          Retour à la boutique
        </a>
      </div>
    );
  }

  // Panier vide
  if (itemCount === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-cream-100 items-center justify-center mb-6 text-forest-700">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h1 className="font-display text-3xl text-forest-900 mb-3">Votre panier est vide</h1>
        <p className="text-ink-700 mb-8">
          Découvrez nos liqueurs et infusions artisanales.
        </p>
        <a
          href="/boutique"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 font-medium"
        >
          Retour à la boutique
        </a>
      </div>
    );
  }

  // Panier rempli
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2">
        <div className="hidden md:grid grid-cols-[1fr_120px_150px_100px_40px] gap-4 pb-3 border-b border-forest-100 text-xs uppercase tracking-wider text-forest-600 font-medium">
          <span>Produit</span>
          <span>Prix</span>
          <span>Quantité</span>
          <span className="text-right">Sous-total</span>
          <span />
        </div>

        <ul className="divide-y divide-forest-100/80">
          {cart?.items.map((item) => {
            const image = item.images[0];
            const subtotal = formatMoney(item.totals.line_total, minorUnit, currencySymbol);
            const unit = formatMoney(item.prices.price, minorUnit, currencySymbol);
            return (
              <li key={item.key} className="py-5 md:grid md:grid-cols-[1fr_120px_150px_100px_40px] md:gap-4 md:items-center">
                <div className="flex items-center gap-4 mb-3 md:mb-0">
                  {image && (
                    <img
                      src={image.thumbnail || image.src}
                      alt={image.alt || item.name}
                      width={72}
                      height={72}
                      className="w-16 h-16 rounded-lg object-cover bg-cream-100 border border-forest-100/60"
                    />
                  )}
                  <div>
                    <div className="font-display text-lg text-forest-900 leading-tight">{item.name}</div>
                    {item.variation && item.variation.length > 0 && (
                      <div className="text-xs text-ink-500 mt-0.5">
                        {item.variation.map((v) => v.value).join(" · ")}
                      </div>
                    )}
                    <div className="text-xs text-ink-500 mt-0.5 md:hidden">Unité : {unit}</div>
                  </div>
                </div>

                <div className="hidden md:block text-sm text-ink-700 tabular-nums">{unit}</div>

                <div>
                  <QuantityInput
                    value={item.quantity}
                    onChange={(q) => {
                      if (q === 0) return removeItem(item.key);
                      return updateItem(item.key, q);
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="text-right text-sm font-medium text-forest-900 tabular-nums mt-2 md:mt-0">
                  {subtotal}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="mt-2 md:mt-0 justify-self-end text-ink-400 hover:text-red-700 transition-colors"
                  aria-label={`Retirer ${item.name} du panier`}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <a
            href="/boutique"
            className="inline-flex items-center gap-2 text-forest-800 hover:text-forest-900 text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Continuer mes achats
          </a>

          <form onSubmit={handleApplyCoupon} className="flex items-stretch gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Code promo"
              className="px-4 py-2.5 rounded-full border border-forest-200 bg-white text-sm focus:outline-none focus:border-forest-600 min-w-[160px]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full border border-forest-700/40 hover:border-forest-700 text-forest-900 text-sm font-medium transition-colors"
              disabled={loading || !couponCode.trim()}
            >
              Appliquer
            </button>
          </form>
        </div>
        {couponError && <p className="mt-3 text-sm text-red-700">{couponError}</p>}
      </div>

      {/* Récapitulatif commande */}
      <aside className="lg:sticky lg:top-28 self-start">
        <div className="rounded-2xl bg-cream-50 border border-forest-100 p-6 shadow-cream-lg">
          <h2 className="font-display text-xl text-forest-900 mb-5">Récapitulatif</h2>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between text-ink-700">
              <dt>Sous-total</dt>
              <dd className="tabular-nums">
                {cart && formatMoney(cart.totals.total_items, minorUnit, currencySymbol)}
              </dd>
            </div>

            {cart && Number(cart.totals.total_shipping) > 0 ? (
              <div className="flex justify-between text-ink-700">
                <dt>Livraison</dt>
                <dd className="tabular-nums">
                  {formatMoney(cart.totals.total_shipping, minorUnit, currencySymbol)}
                </dd>
              </div>
            ) : cart?.needs_shipping ? (
              <div className="flex justify-between text-ink-500 italic">
                <dt>Livraison</dt>
                <dd>Calculée à l'étape suivante</dd>
              </div>
            ) : null}

            {cart && Number(cart.totals.total_tax) > 0 && (
              <div className="flex justify-between text-ink-500">
                <dt>dont TVA</dt>
                <dd className="tabular-nums">
                  {formatMoney(cart.totals.total_tax, minorUnit, currencySymbol)}
                </dd>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-forest-100 text-forest-900 font-display text-xl">
              <dt>Total</dt>
              <dd className="tabular-nums">
                {cart && formatMoney(cart.totals.total_price, minorUnit, currencySymbol)}
              </dd>
            </div>
          </dl>

          <a
            href="/commande"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 font-medium transition-colors"
          >
            Valider la commande
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>

          <p className="mt-4 text-xs text-ink-500 text-center">
            Paiement sécurisé via Stripe — Visa, Mastercard, Apple Pay, Google Pay.
          </p>
        </div>
      </aside>
    </div>
  );
}

function QuantityInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (q: number) => Promise<void> | void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-forest-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled}
        className="px-3 py-2 text-forest-800 hover:bg-cream-100 disabled:opacity-40"
        aria-label="Diminuer la quantité"
      >
        −
      </button>
      <span className="px-4 text-sm font-medium text-forest-900 tabular-nums min-w-[2ch] text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        disabled={disabled}
        className="px-3 py-2 text-forest-800 hover:bg-cream-100 disabled:opacity-40"
        aria-label="Augmenter la quantité"
      >
        +
      </button>
    </div>
  );
}
