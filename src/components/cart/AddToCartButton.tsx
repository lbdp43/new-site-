import { useEffect, useState } from "react";
import { openMiniCart, useCart } from "../../lib/cart-store";

interface Props {
  /** ID numérique WooCommerce (product OU variation). Sans ça, le bouton est désactivé. */
  wcId?: number;
  /** Sélecteur DOM lu au clic pour la taille choisie (pill active). */
  sizeSelectorId?: string;
  /** Nom de l'attribut WC pour la contenance.
   *  D'après la Store API de labrasseriedesplantes.fr, c'est l'attribut local
   *  "Contenance" (et non une taxonomie globale "pa_contenance"). */
  sizeAttribute?: string;
  /** Libellé humain, ex "L'Alchimie Végétale 70cl". */
  productName: string;
  /** Libellé de taille par défaut sélectionné quand le DOM n'a pas encore
   *  initialisé la pill active (rare, mais sécurise l'ajout direct). */
  defaultSize?: string;
}

/**
 * Bouton "Ajouter au panier" — île React rendue sur la fiche produit.
 * Lit la pill de taille active (si présente) dans le DOM statique Astro, puis
 * envoie l'ajout à la Store API.
 */
export default function AddToCartButton({
  wcId,
  sizeSelectorId = "size-selector",
  sizeAttribute = "Contenance",
  productName,
  defaultSize,
}: Props) {
  const { addItem, loading } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Reset le flash "Ajouté" après 2s.
  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2000);
    return () => window.clearTimeout(t);
  }, [added]);

  function readSelectedSize(): string | null {
    const container = document.getElementById(sizeSelectorId);
    if (!container) return defaultSize ?? null;
    const active = container.querySelector<HTMLButtonElement>(".size-pill.bg-forest-800");
    return active?.dataset.size ?? defaultSize ?? null;
  }

  async function handleAdd() {
    setError(null);
    if (!wcId) {
      setError("Ce produit n'est pas encore disponible à la vente en ligne.");
      return;
    }

    const size = readSelectedSize();
    const variation = size
      ? [{ attribute: sizeAttribute, value: size }]
      : undefined;

    setAdding(true);
    try {
      await addItem({ id: wcId, quantity, variation });
      setAdded(true);
      // Ouvre le mini-panier (slide-in à droite) avec le récap du panier.
      openMiniCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'ajout au panier.");
    } finally {
      setAdding(false);
    }
  }

  const disabled = adding || loading || !wcId;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-stretch gap-3">
        {/* Sélecteur quantité */}
        <div className="inline-flex items-center rounded-full border border-forest-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-forest-800 hover:bg-cream-100 disabled:opacity-40"
            aria-label="Diminuer la quantité"
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="px-4 text-sm font-medium text-forest-900 tabular-nums min-w-[2ch] text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="px-3 py-2 text-forest-800 hover:bg-cream-100"
            aria-label="Augmenter la quantité"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {adding ? (
            <>
              <span className="inline-block w-4 h-4 rounded-full border-2 border-cream-100/40 border-t-cream-100 animate-spin" />
              Ajout en cours…
            </>
          ) : added ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Ajouté au panier
            </>
          ) : (
            <>
              Ajouter au panier
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </>
          )}
        </button>

        <a
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-forest-700/40 hover:border-forest-700 text-forest-900 font-medium transition-colors"
        >
          Poser une question
        </a>
      </div>

      {!wcId && (
        <p className="text-xs text-ink-500">
          Ce produit sera bientôt disponible à la commande en ligne. En
          attendant,{" "}
          <a href="/contact" className="underline">contacte-nous</a> pour le
          réserver.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <span className="sr-only" aria-live="polite">
        {added ? `${productName} ajouté au panier` : ""}
      </span>
    </div>
  );
}
