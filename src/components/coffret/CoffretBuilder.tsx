import { useState, useMemo, useEffect } from 'react';
import { useCart } from '../../lib/cart-store';
import { coffretTrios, type CoffretTrio } from '../../data/coffret-trios';

/**
 * Coffret DIY — sélection de N bouteilles parmi le catalogue, ajoutées au
 * panier comme N lignes individuelles avec metadata `_coffret_diy`.
 *
 * Architecture volontairement simple :
 * - En haut : visualisation du coffret en construction (3 bouteilles empilées)
 * - Milieu : total + CTA
 * - Bas : grille de sélection (toutes les bouteilles éligibles, un seul bloc)
 *
 * Aucun plugin WP requis : 3 lignes produit standard + metadata pour l'admin.
 */

export interface CoffretProduct {
  slug: string;
  name: string;
  range: string;
  priceMin: number;
  image: string;
  /** Photo du format empilable (20cl). Utilisée dans la viz coffret.
   *  Fallback sur `image` si non fournie. */
  stackImage?: string;
  alcohol: number;
  tagline?: string;
  wcId: number;
  defaultSize?: number;
  wcSizeAttribute?: string;
}

interface Props {
  products: CoffretProduct[];
  /** Taille du coffret = nombre de bouteilles. Par défaut 3. */
  size?: number;
  /** Langue de l'interface. */
  lang?: 'fr' | 'en';
  /** Slug pré-sélectionné au chargement (ex: quand on vient d'une fiche produit). */
  preselect?: string;
  /** Message cadeau optionnel (activé si true). */
  allowGiftMessage?: boolean;
}

const SUGGESTIONS_LABEL = {
  fr: {
    heading: 'Pas sûr de votre sélection ?',
    subtitle: "Nous avons préparé 6 trios — cliquez pour remplir votre coffret en un geste.",
    pick: 'Choisir ce trio',
  },
  en: {
    heading: 'Not sure what to pick?',
    subtitle: "We've prepared 6 curated trios — click to fill your box in one go.",
    pick: 'Pick this trio',
  },
} as const;

const L = {
  fr: {
    kicker: 'Votre coffret',
    remaining: (n: number) => `${n === 1 ? 'Plus qu\'1 bouteille' : `Plus que ${n} bouteilles`}`,
    complete: 'Coffret complet ✓',
    slotEmpty: (i: number, n: number) => `Bouteille ${i} / ${n}`,
    remove: 'Retirer',
    total: 'Total',
    addToCart: 'Ajouter ce coffret au panier',
    adding: 'Ajout en cours…',
    success: '🎁 Coffret ajouté au panier',
    error: 'Erreur — réessayez',
    giftMessage: 'Message cadeau (optionnel)',
    giftMessagePlaceholder: 'Un mot glissé dans le coffret…',
    giftMessageMax: 'Max. 200 caractères',
    selectHeading: 'Choisissez vos bouteilles',
    selectSubtitle: 'Cliquez pour ajouter, re-cliquez pour retirer',
    alcoholSuffix: '% vol.',
    priceFrom: 'À partir de',
    benefits: [
      'Bouteilles empilables (breveté)',
      'Préparé dans notre atelier en Haute-Loire',
      'Livraison offerte dès 65 €',
    ],
    format: (n: number) => `${n.toFixed(2).replace('.', ',')} €`,
  },
  en: {
    kicker: 'Your gift box',
    remaining: (n: number) => `${n === 1 ? '1 bottle left to pick' : `${n} bottles left to pick`}`,
    complete: 'Box complete ✓',
    slotEmpty: (i: number, n: number) => `Bottle ${i} / ${n}`,
    remove: 'Remove',
    total: 'Total',
    addToCart: 'Add gift box to cart',
    adding: 'Adding…',
    success: '🎁 Gift box added to cart',
    error: 'Error — please retry',
    giftMessage: 'Gift message (optional)',
    giftMessagePlaceholder: 'A word slipped into the box…',
    giftMessageMax: 'Max. 200 characters',
    selectHeading: 'Pick your bottles',
    selectSubtitle: 'Click to add, click again to remove',
    alcoholSuffix: '% vol.',
    priceFrom: 'From',
    benefits: [
      'Stackable bottles (patent)',
      'Prepared in our workshop in Haute-Loire',
      'Free shipping above €65',
    ],
    format: (n: number) => `€${n.toFixed(2)}`,
  },
} as const;

export default function CoffretBuilder({
  products,
  size = 3,
  lang = 'fr',
  preselect,
  allowGiftMessage = true,
}: Props) {
  const t = L[lang];
  const { addItem } = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const [giftMessage, setGiftMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const productBySlug = useMemo(
    () => Object.fromEntries(products.map((p) => [p.slug, p])),
    [products]
  );

  // Pré-sélection depuis les props (ou depuis l'URL ?preselect=slug)
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('preselect');
    const slug = preselect ?? fromUrl;
    if (slug && productBySlug[slug]) {
      setSelected([slug]);
    }
  }, [preselect, productBySlug]);

  const total = useMemo(
    () => selected.reduce((s, slug) => s + (productBySlug[slug]?.priceMin ?? 0), 0),
    [selected, productBySlug]
  );

  const remaining = size - selected.length;
  const isComplete = selected.length === size;

  const toggle = (slug: string) => {
    setStatus('idle');
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length < size) return [...prev, slug];
      return prev;
    });
  };

  const removeAt = (i: number) => {
    setStatus('idle');
    setSelected((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleAddToCart = async () => {
    if (!isComplete || adding) return;
    setAdding(true);
    setStatus('idle');

    try {
      for (let i = 0; i < selected.length; i++) {
        const p = productBySlug[selected[i]];
        if (!p) continue;

        const variation = p.defaultSize
          ? [{ attribute: p.wcSizeAttribute ?? 'Contenance', value: `${p.defaultSize}cl` }]
          : undefined;

        const cartMeta: Record<string, string> = {
          _coffret_diy: String(size),
          _coffret_position: `${i + 1}/${size}`,
          _coffret_label: lang === 'fr' ? `Coffret DIY ${size} bouteilles` : `DIY ${size}-bottle gift box`,
        };
        if (giftMessage.trim()) {
          cartMeta._coffret_gift_message = giftMessage.trim().slice(0, 200);
        }

        await addItem({
          id: p.wcId,
          quantity: 1,
          variation,
          cart_item_data: cartMeta,
        });
      }
      setStatus('success');
      setTimeout(() => {
        setSelected([]);
        setGiftMessage('');
        setStatus('idle');
      }, 2500);
    } catch {
      setStatus('error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* ==== TOP : Visualisation du coffret en cours de construction ==== */}
      <div className="relative rounded-3xl bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 text-cream-100 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Stackable bottles visualization */}
            <div className="flex-none">
              <div className="relative w-40 h-48 flex items-end justify-center">
                {/* 3 slots empilés en grille décalée qui évoque l'empilement */}
                {Array.from({ length: size }).map((_, i) => {
                  const slug = selected[i];
                  const p = slug ? productBySlug[slug] : null;
                  // Position : bottom de la stack = indice 0, on empile vers le haut
                  const yOffset = i * -36; // hauteur de chaque bouteille dans la pile
                  return (
                    <div
                      key={i}
                      className={`
                        absolute left-1/2 -translate-x-1/2 w-32 h-44 rounded-xl border-2 transition-all duration-300
                        ${p ? 'bg-white/10 border-gold-400/70 shadow-xl' : 'bg-white/5 border-cream-100/20 border-dashed'}
                      `}
                      style={{
                        bottom: `${i * 28}px`,
                        zIndex: size - i,
                        transform: `translateX(-50%) scale(${1 - i * 0.05})`,
                      }}
                    >
                      {p ? (
                        <img
                          src={p.stackImage ?? p.image}
                          alt=""
                          className="w-full h-full object-contain p-3"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-cream-100/40 text-sm">
                          {i + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Infos coffret + slots nommés */}
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-[0.25em] text-gold-400 mb-2">{t.kicker}</div>
              <h2 className="font-display text-2xl md:text-3xl leading-tight text-cream-100 mb-1">
                {isComplete ? t.complete : t.remaining(remaining)}
              </h2>
              <p className="text-sm text-cream-200/70 mb-5">
                {selected.length} / {size} · {t.format(total)}
              </p>

              {/* Slots : noms des bouteilles choisies */}
              <div className="space-y-1.5 mb-5">
                {Array.from({ length: size }).map((_, i) => {
                  const slug = selected[i];
                  const p = slug ? productBySlug[slug] : null;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-3 text-sm py-1.5 px-3 rounded-lg ${
                        p ? 'bg-cream-100/10 text-cream-100' : 'text-cream-200/50'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold-500/30 text-gold-300 text-[10px] font-medium flex-none">
                          {i + 1}
                        </span>
                        <span className="truncate">{p ? p.name : t.slotEmpty(i + 1, size)}</span>
                      </span>
                      {p && (
                        <button
                          type="button"
                          onClick={() => removeAt(i)}
                          className="text-cream-200/50 hover:text-cream-50 flex-none"
                          aria-label={t.remove}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Gift message */}
              {allowGiftMessage && isComplete && (
                <div className="mb-5">
                  <label className="block text-xs uppercase tracking-wider text-gold-400 mb-2">
                    {t.giftMessage}
                  </label>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value.slice(0, 200))}
                    placeholder={t.giftMessagePlaceholder}
                    rows={2}
                    maxLength={200}
                    className="w-full px-3 py-2 rounded-lg bg-cream-100/5 border border-cream-100/20 text-cream-100 placeholder-cream-200/40 text-sm resize-none focus:outline-none focus:border-gold-400/60 transition-colors"
                  />
                  <div className="text-[10px] text-cream-200/40 mt-1 text-right">
                    {giftMessage.length} / 200
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isComplete || adding}
                className={`w-full px-6 py-3.5 rounded-full font-medium text-sm transition-all ${
                  isComplete
                    ? 'bg-cream-50 hover:bg-cream-100 text-forest-900 shadow-lg hover:shadow-xl'
                    : 'bg-cream-100/10 text-cream-200/40 cursor-not-allowed'
                }`}
              >
                {adding ? t.adding : isComplete ? `${t.addToCart} · ${t.format(total)}` : t.remaining(remaining)}
              </button>

              {/* Status */}
              {status === 'success' && (
                <div className="mt-3 text-center text-sm text-gold-300">{t.success}</div>
              )}
              {status === 'error' && (
                <div className="mt-3 text-center text-sm text-red-300">{t.error}</div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-8 pt-6 border-t border-cream-100/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-cream-200/70">
            {t.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-400 flex-none">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==== MIDDLE : Suggestions (trios curés) ==== */}
      {products.length > 3 && (
        <div>
          <div className="mb-5">
            <h3 className="font-display text-xl md:text-2xl text-forest-900 mb-1">
              {SUGGESTIONS_LABEL[lang].heading}
            </h3>
            <p className="text-sm text-ink-500">{SUGGESTIONS_LABEL[lang].subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coffretTrios.map((trio: CoffretTrio) => {
              // On ne propose que les trios dont les 3 slugs existent dans la liste éligible
              const allExist = trio.slugs.every((s) => productBySlug[s]);
              if (!allExist) return null;
              const trioProducts = trio.slugs.map((s) => productBySlug[s]);
              const trioTotal = trioProducts.reduce((sum, p) => sum + (p?.priceMin ?? 0), 0);
              const isCurrent =
                selected.length === 3 &&
                trio.slugs.every((s) => selected.includes(s));

              return (
                <button
                  key={trio.id}
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setSelected([...trio.slugs]);
                  }}
                  className={`group text-left rounded-2xl border-2 transition-all overflow-hidden ${
                    isCurrent
                      ? 'border-forest-700 bg-forest-50 shadow-lg'
                      : 'border-forest-100 bg-cream-50 hover:border-forest-400 hover:shadow-md'
                  }`}
                >
                  {/* Mini preview des 3 bouteilles (format empilable) */}
                  <div className="flex items-end justify-center gap-1 p-4 bg-white h-32 border-b border-forest-100">
                    {trioProducts.map((p, i) => (
                      <img
                        key={i}
                        src={p?.stackImage ?? p?.image}
                        alt=""
                        className="h-full w-auto object-contain"
                        loading="lazy"
                      />
                    ))}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-display text-base md:text-lg text-forest-900 leading-tight">
                        {trio.title[lang]}
                      </div>
                      {trio.badge && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-600 border border-gold-400/30 flex-none">
                          {trio.badge[lang]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500 leading-relaxed mb-3 line-clamp-3">
                      {trio.description[lang]}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-forest-800">{t.format(trioTotal)}</span>
                      <span className="text-xs text-forest-700 group-hover:text-forest-900 inline-flex items-center gap-1">
                        {isCurrent ? '✓' : SUGGESTIONS_LABEL[lang].pick}
                        {!isCurrent && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-0.5 transition-transform">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==== BOTTOM : Grille de sélection ==== */}
      <div>
        <div className="mb-5">
          <h3 className="font-display text-xl md:text-2xl text-forest-900 mb-1">{t.selectHeading}</h3>
          <p className="text-sm text-ink-500">{t.selectSubtitle}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map((p) => {
            const isSelected = selected.includes(p.slug);
            const canSelect = !isSelected && selected.length < size;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => toggle(p.slug)}
                disabled={!canSelect && !isSelected}
                aria-pressed={isSelected}
                className={`relative group text-left rounded-2xl overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-forest-700 ring-2 ring-forest-700/30 bg-forest-50 shadow-lg scale-[0.98]'
                    : canSelect
                      ? 'border-forest-100 bg-cream-50 hover:border-forest-400 hover:shadow-md'
                      : 'border-forest-100/50 bg-cream-50/60 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="relative aspect-square bg-white">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" loading="lazy" />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-forest-700 text-cream-50 flex items-center justify-center shadow">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="font-display text-xs sm:text-sm text-forest-900 leading-tight truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-ink-500 mt-0.5">
                    {p.alcohol}{t.alcoholSuffix} · {t.format(p.priceMin)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
