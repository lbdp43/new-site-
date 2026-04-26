import { useEffect, useRef } from "react";
import { useCart, formatMoney, useMiniCart, closeMiniCart } from "../../lib/cart-store";

/**
 * MiniCartDrawer — panneau latéral droit qui glisse depuis la bordure.
 *
 * Apparaît automatiquement après un ajout au panier (déclenché depuis
 * `cart-store.addItem` via `openMiniCart()`). Peut aussi être ouvert
 * manuellement par un clic sur l'icône panier dans le header.
 *
 * Monté une fois dans le Layout (sur toutes les pages) pour être disponible
 * partout. Reste invisible (translate-x-full) tant qu'il n'est pas ouvert.
 */
export default function MiniCartDrawer() {
  const { cart, itemCount, total, minorUnit, currencySymbol, removeItem, updateItem } = useCart();
  const isOpen = useMiniCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fermeture sur ESC.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMiniCart();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Verrouille le scroll body quand drawer ouvert.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const items = cart?.items ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!isOpen}
        onClick={closeMiniCart}
        className={`fixed inset-0 z-[90] bg-forest-950/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mini-panier"
        className={`fixed top-0 right-0 z-[91] h-screen w-full max-w-md bg-cream-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-forest-100/60 shrink-0">
          <h2 className="font-display text-xl text-forest-900">
            Votre panier
            {itemCount > 0 && (
              <span className="ml-2 text-sm text-ink-500 font-normal">({itemCount})</span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeMiniCart}
            className="p-2 -mr-2 rounded-full hover:bg-cream-100 text-ink-700"
            aria-label="Fermer le mini-panier"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Liste des items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-ink-500 py-16">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p className="text-sm mb-6">Votre panier est vide</p>
              <a
                href="/boutique"
                onClick={closeMiniCart}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 text-sm font-medium"
              >
                Découvrir la boutique
              </a>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const img = item.images?.[0];
                const linePrice = formatMoney(item.totals.line_total, minorUnit, currencySymbol);
                const variation = (item.variation ?? [])
                  .map((v) => v.value)
                  .join(" · ");

                return (
                  <li key={item.key} className="flex gap-3 py-3 border-b border-forest-100/60 last:border-0">
                    {img && (
                      <a
                        href={`/boutique/${item.key.split(":")[0] ?? ""}`}
                        onClick={closeMiniCart}
                        className="flex-none w-16 h-16 rounded-lg overflow-hidden bg-white border border-forest-100"
                      >
                        <img
                          src={img.thumbnail}
                          alt={img.alt || item.name}
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain p-1"
                        />
                      </a>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-forest-900 leading-tight">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key).catch(() => {})}
                          className="flex-none text-ink-400 hover:text-red-700 -mt-0.5 -mr-1 p-1"
                          aria-label={`Retirer ${item.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      {variation && (
                        <div className="text-xs text-ink-500 mt-0.5">{variation}</div>
                      )}
                      <div className="flex items-center justify-between mt-2 gap-3">
                        <div className="inline-flex items-center rounded-full border border-forest-200 bg-white text-xs">
                          <button
                            type="button"
                            onClick={() => item.quantity > 1 && updateItem(item.key, item.quantity - 1).catch(() => {})}
                            className="px-2.5 py-1 text-forest-800 hover:bg-cream-100 disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            aria-label="Diminuer"
                          >−</button>
                          <span className="px-2 text-forest-900 tabular-nums min-w-[2ch] text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItem(item.key, item.quantity + 1).catch(() => {})}
                            className="px-2.5 py-1 text-forest-800 hover:bg-cream-100"
                            aria-label="Augmenter"
                          >+</button>
                        </div>
                        <span className="text-sm font-medium text-forest-900 tabular-nums">{linePrice}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer avec total + CTAs */}
        {items.length > 0 && (
          <div className="border-t border-forest-100 bg-white shrink-0 px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-700">Sous-total</span>
              <span className="font-display text-xl text-forest-900 tabular-nums">
                {formatMoney(total, minorUnit, currencySymbol)}
              </span>
            </div>
            <p className="text-xs text-ink-500">
              Livraison et taxes calculées au paiement.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/commande"
                onClick={closeMiniCart}
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 font-medium transition-colors"
              >
                Passer la commande
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <a
                href="/panier"
                onClick={closeMiniCart}
                className="inline-flex items-center justify-center w-full px-5 py-2.5 text-sm text-forest-700 hover:text-forest-900 font-medium"
              >
                Voir le panier
              </a>
              <button
                type="button"
                onClick={closeMiniCart}
                className="inline-flex items-center justify-center w-full px-5 py-2 text-xs text-ink-500 hover:text-ink-700"
              >
                Continuer mes achats
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
