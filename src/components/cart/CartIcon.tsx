import { useEffect } from "react";
import { ensureCartLoaded, formatMoney, useCart } from "../../lib/cart-store";

export default function CartIcon() {
  const { itemCount, total, minorUnit, currencySymbol } = useCart();

  useEffect(() => {
    ensureCartLoaded();
  }, []);

  const label = itemCount > 0
    ? `Panier — ${itemCount} article${itemCount > 1 ? "s" : ""}`
    : "Panier vide";

  return (
    <a
      href="/panier"
      aria-label={label}
      className="relative inline-flex items-center gap-2 px-3 py-2 rounded-full text-ink-700 hover:text-forest-800 transition-colors"
    >
      <span className="relative">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {itemCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-forest-800 text-cream-50 text-[10px] font-medium flex items-center justify-center"
          >
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </span>
      <span className="hidden md:inline text-xs font-medium tabular-nums">
        {formatMoney(total, minorUnit, currencySymbol)}
      </span>
    </a>
  );
}
