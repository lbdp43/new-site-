import { useState, useMemo } from 'react';
import { useCart } from '../../lib/cart-store';

/**
 * Coffret DIY — sélection de 3 bouteilles parmi le catalogue, ajoutées au
 * panier comme 3 lignes individuelles avec metadata `_coffret_diy` pour que
 * l'admin WooCommerce sache emballer ensemble.
 *
 * Aucune modification WordPress requise : les 3 lignes sont des produits
 * standards, juste taggés. Stock, TVA, emails, EasyBee, WooPayments = tout
 * continue de fonctionner normalement.
 */

export interface CoffretProduct {
  slug: string;
  name: string;
  range: string;
  priceMin: number;
  image: string;
  alcohol: number;
  tagline?: string;
  wcId: number;
  /** Contenance par défaut à ajouter au panier pour le coffret (ex: 50). */
  defaultSize?: number;
  /** Nom de l'attribut variation contenance. "Contenance" par défaut. */
  wcSizeAttribute?: string;
}

interface Props {
  products: CoffretProduct[];
  /** Taille du coffret = nombre de bouteilles. Par défaut 3. */
  size?: number;
  /** Langue de l'interface. */
  lang?: 'fr' | 'en';
}

const L = {
  fr: {
    kicker: 'Composez votre coffret',
    heading: 'Choisissez vos 3 bouteilles',
    subtitle: 'Vous sélectionnez, nous emballons. Un coffret cadeau prêt à offrir, avec les 3 liqueurs que vous préférez.',
    selectBottle: 'Cliquez pour ajouter',
    selected: 'Sélectionnée',
    remove: 'Retirer',
    slotEmpty: 'Bouteille',
    slot: 'Bouteille',
    of: 'sur',
    total: 'Total du coffret',
    totalBottles: 'bouteilles',
    addToCart: 'Ajouter ce coffret au panier',
    adding: 'Ajout au panier…',
    selectMore: 'Choisissez encore',
    complete: '✓ Coffret complet',
    alcoholSuffix: '% vol.',
    priceFrom: 'À partir de',
    success: 'Coffret ajouté au panier !',
    error: 'Erreur lors de l\'ajout. Réessayez.',
    format: (n: number) => `${n.toFixed(2).replace('.', ',')} €`,
  },
  en: {
    kicker: 'Build your own gift box',
    heading: 'Choose your 3 bottles',
    subtitle: 'You pick, we pack. A ready-to-give gift box with the three liqueurs you love most.',
    selectBottle: 'Click to add',
    selected: 'Selected',
    remove: 'Remove',
    slotEmpty: 'Bottle',
    slot: 'Bottle',
    of: 'of',
    total: 'Gift box total',
    totalBottles: 'bottles',
    addToCart: 'Add gift box to cart',
    adding: 'Adding to cart…',
    selectMore: 'Pick',
    complete: '✓ Box complete',
    alcoholSuffix: '% vol.',
    priceFrom: 'From',
    success: 'Gift box added to cart!',
    error: 'Add to cart failed. Please retry.',
    format: (n: number) => `€${n.toFixed(2)}`,
  },
} as const;

export default function CoffretBuilder({ products, size = 3, lang = 'fr' }: Props) {
  const t = L[lang];
  const { addItem } = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const productBySlug = useMemo(() => {
    return Object.fromEntries(products.map((p) => [p.slug, p]));
  }, [products]);

  const total = useMemo(() => {
    return selected.reduce((sum, slug) => sum + (productBySlug[slug]?.priceMin ?? 0), 0);
  }, [selected, productBySlug]);

  const remaining = size - selected.length;
  const isComplete = selected.length === size;

  const toggle = (slug: string) => {
    setStatus('idle');
    setSelected((prev) => {
      // Si déjà dans la sélection → retirer
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      // Si moins de N → ajouter
      if (prev.length < size) {
        return [...prev, slug];
      }
      // Sinon ignorer (il faut retirer d'abord)
      return prev;
    });
  };

  const removeSlot = (index: number) => {
    setStatus('idle');
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddToCart = async () => {
    if (!isComplete || adding) return;
    setAdding(true);
    setStatus('idle');
    setErrorMsg(null);

    try {
      // On ajoute les 3 bouteilles dans l'ordre, chacune avec sa metadata coffret.
      // Si on a une variation (contenance), on l'envoie. Sinon on ajoute le produit
      // simple et WC choisit la variation par défaut.
      for (let i = 0; i < selected.length; i++) {
        const slug = selected[i];
        const p = productBySlug[slug];
        if (!p) continue;

        const variation = p.defaultSize
          ? [
              {
                attribute: p.wcSizeAttribute ?? 'Contenance',
                value: `${p.defaultSize}cl`,
              },
            ]
          : undefined;

        await addItem({
          id: p.wcId,
          quantity: 1,
          variation,
          cart_item_data: {
            _coffret_diy: String(size),
            _coffret_position: `${i + 1}/${size}`,
            _coffret_label: lang === 'fr' ? 'Coffret DIY 3 bouteilles' : 'DIY 3-bottle gift box',
          },
        });
      }

      setStatus('success');
      // Reset après 2 secondes pour permettre de refaire un autre coffret
      setTimeout(() => {
        setSelected([]);
        setStatus('idle');
      }, 2500);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(false);
    }
  };

  // Grouper les produits par gamme pour un affichage clair
  const byRange = useMemo(() => {
    const ranges: Record<string, CoffretProduct[]> = {};
    for (const p of products) {
      if (!ranges[p.range]) ranges[p.range] = [];
      ranges[p.range].push(p);
    }
    return ranges;
  }, [products]);

  const rangeOrder = ['brasserie', 'aperitif', 'lumiere-obscure', 'edition-limitee'];
  const rangeLabels: Record<string, { fr: string; en: string }> = {
    brasserie: { fr: 'Brasserie — signature', en: 'Signature range' },
    aperitif: { fr: 'Apéritifs', en: 'Aperitifs' },
    'lumiere-obscure': { fr: 'Lumière Obscure (CBD)', en: 'Lumière Obscure (CBD)' },
    'edition-limitee': { fr: 'Éditions limitées', en: 'Limited editions' },
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
      {/* ==== PANNEAU GAUCHE : sélection produits ==== */}
      <div className="space-y-10">
        {rangeOrder.map((range) =>
          byRange[range] && byRange[range].length > 0 ? (
            <div key={range}>
              <div className="flex items-baseline gap-3 mb-5">
                <h3 className="text-xs uppercase tracking-[0.25em] text-forest-600 font-medium">
                  {rangeLabels[range]?.[lang] ?? range}
                </h3>
                <span className="text-xs text-ink-500">({byRange[range].length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {byRange[range].map((p) => {
                  const isSelected = selected.includes(p.slug);
                  const canSelect = !isSelected && selected.length < size;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => toggle(p.slug)}
                      disabled={!canSelect && !isSelected}
                      className={`
                        relative group text-left rounded-2xl overflow-hidden border transition-all
                        ${isSelected
                          ? 'border-forest-700 ring-2 ring-forest-700 bg-forest-50 shadow-lg'
                          : canSelect
                            ? 'border-forest-100 bg-cream-50 hover:border-forest-400 hover:shadow-md'
                            : 'border-forest-100/50 bg-cream-50/60 opacity-40 cursor-not-allowed'
                        }
                      `}
                      aria-pressed={isSelected}
                    >
                      <div className="relative aspect-square bg-white">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain p-4"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-forest-700 text-cream-50 flex items-center justify-center shadow-md">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="font-display text-sm sm:text-base text-forest-900 leading-tight">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-ink-500 mt-1">
                          {p.alcohol}{t.alcoholSuffix} · {t.priceFrom} {t.format(p.priceMin)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null
        )}
      </div>

      {/* ==== PANNEAU DROITE : récap coffret ==== */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-forest-200/60 bg-cream-50 p-6 sm:p-8 shadow-xl">
          <div className="text-xs uppercase tracking-[0.25em] text-gold-600 font-medium mb-2">
            {t.kicker}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-forest-900 mb-6 leading-tight">
            {selected.length} / {size} {t.totalBottles}
          </h2>

          {/* 3 slots */}
          <div className="space-y-2 mb-6">
            {Array.from({ length: size }).map((_, i) => {
              const slug = selected[i];
              const p = slug ? productBySlug[slug] : null;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    p ? 'bg-white border-forest-200' : 'bg-cream-100/40 border-dashed border-forest-200/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-display flex-none bg-forest-100 text-forest-700">
                    {i + 1}
                  </div>
                  {p ? (
                    <>
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-contain" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-forest-900 truncate">{p.name}</div>
                        <div className="text-xs text-ink-500">{t.format(p.priceMin)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSlot(i)}
                        className="text-ink-400 hover:text-forest-900 p-1"
                        aria-label={t.remove}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-ink-500 italic">
                      {t.slotEmpty} {i + 1}/{size}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex items-baseline justify-between pt-4 border-t border-forest-100 mb-6">
            <span className="text-sm text-ink-700">{t.total}</span>
            <span className="font-display text-2xl text-forest-900">{t.format(total)}</span>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isComplete || adding}
            className={`w-full px-6 py-4 rounded-full font-medium transition-all ${
              isComplete
                ? 'bg-forest-800 hover:bg-forest-900 text-cream-100 shadow-lg hover:shadow-xl'
                : 'bg-cream-100 text-ink-500 cursor-not-allowed'
            }`}
          >
            {adding
              ? t.adding
              : isComplete
                ? t.addToCart
                : `${t.selectMore} ${remaining} ${remaining === 1 ? 'bouteille' : 'bouteilles'}`}
          </button>

          {/* Status */}
          {status === 'success' && (
            <div className="mt-4 p-3 rounded-xl bg-forest-50 border border-forest-200 text-forest-800 text-sm text-center">
              ✓ {t.success}
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
              {t.error} {errorMsg && <div className="text-xs mt-1 opacity-70">{errorMsg}</div>}
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-forest-100 text-xs text-ink-500 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forest-600 flex-none">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {lang === 'en' ? 'Hand-packed gift box included' : 'Coffret cadeau emballé main inclus'}
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forest-600 flex-none">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {lang === 'en' ? 'Free shipping above €65' : 'Livraison offerte dès 65 €'}
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forest-600 flex-none">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {lang === 'en' ? 'Dispatch 2 to 3 business days' : 'Expédition sous 2 à 3 jours ouvrés'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
