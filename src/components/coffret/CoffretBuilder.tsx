import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../lib/cart-store';
import { coffretTrios, type CoffretTrio } from '../../data/coffret-trios';

/**
 * CoffretBuilder — configurateur de coffret sur-mesure
 *
 * UX issue du design handoff "Bouteille empilable" variante 1 (Chute & rebond) :
 * - Colonne gauche : zone d'empilement avec animation de chute (Framer Motion
 *   spring) + récap sticky en bas (total + CTA)
 * - Colonne droite : grille des 18 liqueurs cliquables
 * - Persistance du stack dans localStorage (reprise si l'utilisateur revient)
 * - Pas de limite stricte — la "taille cible" reste 3 (pour le branding coffret
 *   + la metadata `_coffret_diy` WC), mais on peut empiler plus pour offrir
 *   un coffret plus grand.
 *
 * DA LBDP :
 * - fonds cream-50 parchemin + forest-900 jewel-tone pour la pile
 * - accent gold-500 signature
 * - fonts : Joane (display) / Barlow Condensed (body)
 */

export interface CoffretProduct {
  slug: string;
  name: string;
  range: string;
  priceMin: number;
  image: string;
  /** Photo du format empilable 20cl — utilisée dans la pile. */
  stackImage?: string;
  alcohol: number;
  tagline?: string;
  wcId: number;
  defaultSize?: number;
  wcSizeAttribute?: string;
}

interface Props {
  products: CoffretProduct[];
  /** Taille "cible" du coffret (default 3) — utilisé pour la metadata WC
   *  et pour afficher "Plus que X bouteilles". L'utilisateur peut empiler plus. */
  size?: number;
  lang?: 'fr' | 'en';
  preselect?: string;
  allowGiftMessage?: boolean;
}

const STORAGE_KEY = 'lbdp-coffret-v2';

/** Item dans la pile : produit + uid unique pour permettre doublons + anim key. */
interface StackItem extends CoffretProduct {
  uid: number;
}

const L = {
  fr: {
    kicker: 'Coffret sur-mesure',
    heading: 'Composez votre coffret',
    subheading: (n: number) =>
      n === 0
        ? "Cliquez sur une bouteille pour commencer à empiler."
        : `Cliquez pour ajouter · ${n} sélectionnée${n > 1 ? 's' : ''}`,
    stackEmpty: "Votre pile est vide.\nChoisissez une bouteille à droite pour commencer.",
    total: 'Total',
    countEmpty: 'aucune bouteille',
    count: (n: number) => `${n} bouteille${n > 1 ? 's' : ''}`,
    clear: 'Tout vider',
    addToCart: 'Ajouter au panier',
    adding: 'Ajout en cours…',
    success: 'Coffret ajouté au panier',
    error: 'Erreur — réessayez',
    yourBox: 'Votre coffret',
    giftMessage: 'Message personnalisé (optionnel)',
    giftPlaceholder: 'Un mot glissé dans le coffret…',
    suggestedHeading: "Pas d'idée ? Nos trios préférés",
    suggestedSub: "Six compositions curées par l'équipe — cliquez pour remplir la pile d'un coup.",
    pickTrio: 'Choisir ce trio',
    picked: '✓ Sélectionné',
    remove: 'Retirer',
    format: (n: number) => `${n.toFixed(2).replace('.', ',')} €`,
  },
  en: {
    kicker: 'Custom gift box',
    heading: 'Build your box',
    subheading: (n: number) =>
      n === 0
        ? 'Click a bottle to start stacking.'
        : `Click to add · ${n} picked`,
    stackEmpty: 'Your stack is empty.\nPick a bottle on the right to start.',
    total: 'Total',
    countEmpty: 'no bottle',
    count: (n: number) => `${n} bottle${n > 1 ? 's' : ''}`,
    clear: 'Clear all',
    addToCart: 'Add to cart',
    adding: 'Adding…',
    success: 'Box added to cart',
    error: 'Error — please retry',
    yourBox: 'Your box',
    giftMessage: 'Personal message (optional)',
    giftPlaceholder: 'A word tucked inside the box…',
    suggestedHeading: 'No idea? Our favourite trios',
    suggestedSub: 'Six curated compositions — click to fill the stack in one go.',
    pickTrio: 'Pick this trio',
    picked: '✓ Picked',
    remove: 'Remove',
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

  const productBySlug = useMemo(
    () => Object.fromEntries(products.map((p) => [p.slug, p])),
    [products]
  );

  // Stack d'items avec uid unique (autorise doublons de même produit)
  const [stack, setStack] = useState<StackItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Array<{ slug: string; uid: number }>;
      return parsed
        .map((x) => {
          const p = productBySlug[x.slug];
          return p ? { ...p, uid: x.uid } : null;
        })
        .filter((x): x is StackItem => x !== null);
    } catch {
      return [];
    }
  });
  const uidRef = useRef(Date.now());

  const [giftMessage, setGiftMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Persistance localStorage (slugs uniquement — on rehydrate les produits)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const minimal = stack.map((s) => ({ slug: s.slug, uid: s.uid }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } catch {
      // storage full ou privé : on abandonne silencieusement
    }
  }, [stack]);

  // Pré-sélection initiale (depuis prop ou URL ?preselect=slug)
  useEffect(() => {
    if (stack.length > 0) return; // déjà quelque chose en pile, on n'écrase pas
    const fromUrl = new URLSearchParams(window.location.search).get('preselect');
    const slug = preselect ?? fromUrl;
    const p = slug ? productBySlug[slug] : null;
    if (p) {
      setStack([{ ...p, uid: ++uidRef.current }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(
    () => stack.reduce((s, item) => s + item.priceMin, 0),
    [stack]
  );

  const addBottle = (p: CoffretProduct) => {
    setStatus('idle');
    setStack((prev) => [...prev, { ...p, uid: ++uidRef.current }]);
  };

  const removeBottle = (uid: number) => {
    setStatus('idle');
    setStack((prev) => prev.filter((x) => x.uid !== uid));
  };

  const clearAll = () => {
    setStatus('idle');
    setStack([]);
    setGiftMessage('');
  };

  const applyTrio = (slugs: string[]) => {
    setStatus('idle');
    const items = slugs
      .map((slug) => productBySlug[slug])
      .filter((p): p is CoffretProduct => !!p)
      .map((p) => ({ ...p, uid: ++uidRef.current }));
    setStack(items);
    // Scroll la pile en vue (elle est à gauche, donc scroll top de la page)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = async () => {
    if (stack.length === 0 || adding) return;
    setAdding(true);
    setStatus('idle');

    try {
      const coffretSize = stack.length;
      for (let i = 0; i < stack.length; i++) {
        const item = stack[i];
        const variation = item.defaultSize
          ? [{ attribute: item.wcSizeAttribute ?? 'Contenance', value: `${item.defaultSize}cl` }]
          : undefined;

        const cartMeta: Record<string, string> = {
          _coffret_diy: String(coffretSize),
          _coffret_position: `${i + 1}/${coffretSize}`,
          _coffret_label:
            lang === 'fr'
              ? `Coffret DIY ${coffretSize} bouteilles`
              : `DIY ${coffretSize}-bottle box`,
        };
        if (giftMessage.trim()) {
          cartMeta._coffret_gift_message = giftMessage.trim().slice(0, 200);
        }

        await addItem({
          id: item.wcId,
          quantity: 1,
          variation,
          cart_item_data: cartMeta,
        });
      }
      setStatus('success');
      setTimeout(() => {
        clearAll();
        setStatus('idle');
      }, 2500);
    } catch {
      setStatus('error');
    } finally {
      setAdding(false);
    }
  };

  // Dimensions bouteille. Les images sont maintenant pré-croppées serrées
  // (scripts/crop-stack-images.mjs → *-20cl-stack.webp), donc l'overlap
  // correspond à la HAUTEUR DU GOULOT (masqué par la bouteille du dessus).
  //
  // Le ratio naturel des images croppées = ~0.82 (légèrement plus haut que large).
  // Le goulot occupe ~22% du haut de l'image.
  const n = stack.length;
  const BOTTLE_W = n <= 3 ? 140 : n <= 6 ? 120 : n <= 10 ? 100 : 88;
  const BOTTLE_H = Math.round(BOTTLE_W / 0.82);
  // Overlap négatif = hauteur du goulot (~22% de la bouteille). La bouteille
  // du dessous voit son goulot caché sous la base de celle du dessus.
  const NECK_OVERLAP = Math.round(BOTTLE_H * 0.22);

  // Hauteur totale pile = bouteille entière du TOP + (n-1) × (corps seulement)
  const bodyHeight = BOTTLE_H - NECK_OVERLAP;
  const stackHeight = n > 0 ? BOTTLE_H + (n - 1) * bodyHeight : 0;
  const containerMinHeight = Math.max(280, stackHeight + 20);

  return (
    <div className="relative">
      {/* Layout 2 colonnes (desktop) / 1 colonne (mobile) */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8 lg:gap-12">
        {/* ═══════════════════════════════════════════════════════
            COLONNE GAUCHE : Pile + récap
           ═══════════════════════════════════════════════════════ */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 text-cream-100 overflow-hidden shadow-2xl">
            {/* ─── Kicker ─── */}
            <div className="px-6 pt-6 pb-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold-400 font-medium">
                {t.kicker}
              </div>
            </div>

            {/* ─── Zone d'empilement ─── */}
            <div
              className="relative px-6 pt-4 pb-8"
              style={{ minHeight: containerMinHeight }}
            >
              {stack.length === 0 ? (
                // État vide : ring + message
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-40 h-10 rounded-full border border-dashed border-cream-100/30 mb-4" />
                  <p className="text-sm text-cream-200/70 font-display italic leading-relaxed whitespace-pre-line max-w-[260px]">
                    {t.stackEmpty}
                  </p>
                </div>
              ) : (
                // Pile avec animation drop-bounce. Les images sont pré-croppées
                // serrées (*-20cl-stack.webp) donc on peut les empiler
                // directement : bouteille du TOP (dernière ajoutée) visible
                // en entier + goulot, les autres avec overlap = hauteur du
                // goulot (masqué par la base de la bouteille du dessus).
                //
                // Ordre DOM inversé : [...stack].reverse() →  stack[N-1]
                // rendu en premier = visuellement en HAUT (la dernière
                // atterrie).
                <div
                  className="relative mx-auto flex flex-col items-center"
                  style={{ width: BOTTLE_W, minHeight: stackHeight }}
                >
                  <AnimatePresence mode="popLayout">
                    {[...stack].reverse().map((item, visualIdx) => {
                      const isTop = visualIdx === 0;
                      const tilt = Math.sin(item.uid * 12.3) * 1.5;
                      return (
                        <motion.div
                          key={item.uid}
                          layout
                          initial={{ y: -280, opacity: 0, rotate: -6 }}
                          animate={{
                            y: 0,
                            opacity: 1,
                            rotate: tilt,
                            transition: {
                              type: 'spring',
                              stiffness: 280,
                              damping: 18,
                              mass: 1,
                            },
                          }}
                          exit={{
                            y: 60,
                            opacity: 0,
                            scale: 0.85,
                            transition: { duration: 0.2 },
                          }}
                          style={{
                            width: BOTTLE_W,
                            // Le top a marginTop:0, les autres chevauchent
                            // pour masquer leur goulot sous la bouteille
                            // du dessus.
                            marginTop: isTop ? 0 : -NECK_OVERLAP,
                            // Z-index décroissant : top le plus haut
                            zIndex: stack.length - visualIdx,
                          }}
                          className="group relative"
                        >
                          <button
                            type="button"
                            onClick={() => removeBottle(item.uid)}
                            className="relative block w-full focus:outline-none"
                            aria-label={`${t.remove} ${item.name}`}
                          >
                            <img
                              src={item.stackImage ?? item.image}
                              alt={item.name}
                              draggable={false}
                              className="block w-full h-auto pointer-events-none select-none"
                              style={{
                                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.4))',
                              }}
                            />
                            {/* × bouton qui apparaît au hover */}
                            <span
                              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-ink-900 text-cream-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                              aria-hidden="true"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </span>
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Ombre au sol (sous la base de la pile) */}
                  <div
                    className="h-3 rounded-full pointer-events-none mt-1"
                    style={{
                      width: BOTTLE_W * 1.15,
                      background:
                        'radial-gradient(ellipse, rgba(0,0,0,0.45), transparent 65%)',
                    }}
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* ─── Récap + CTA ─── */}
            <div
              aria-live="polite"
              className="px-6 py-5 border-t border-cream-100/10 bg-forest-950/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-display text-lg text-cream-50 leading-none">
                    {t.yourBox}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.15em] text-cream-200/60 mt-1">
                    {stack.length === 0 ? t.countEmpty : t.count(stack.length)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cream-200/60 mb-0.5">
                    {t.total}
                  </div>
                  <div className="font-display text-2xl md:text-3xl text-gold-400 leading-none">
                    {t.format(total)}
                  </div>
                </div>
              </div>

              {/* Gift message — visible seulement si pile non vide */}
              {allowGiftMessage && stack.length > 0 && (
                <div className="mb-4">
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-cream-200/60 mb-1.5">
                    {t.giftMessage}
                  </label>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value.slice(0, 200))}
                    placeholder={t.giftPlaceholder}
                    rows={2}
                    maxLength={200}
                    className="w-full px-3 py-2 rounded-lg bg-cream-100/10 border border-cream-100/20 text-cream-50 placeholder-cream-200/40 text-sm resize-none focus:outline-none focus:border-gold-400 transition-colors"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={stack.length === 0}
                  className="px-4 py-2.5 rounded-full text-xs font-medium border border-cream-100/20 text-cream-200/80 hover:bg-cream-100/10 hover:border-cream-100/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {t.clear}
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stack.length === 0 || adding}
                  className="flex-1 px-5 py-3 rounded-full text-sm font-medium bg-gold-500 hover:bg-gold-600 text-forest-950 shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {adding
                    ? t.adding
                    : stack.length === 0
                      ? t.addToCart
                      : `${t.addToCart} · ${t.format(total)}`}
                </button>
              </div>

              {status === 'success' && (
                <div className="mt-3 text-center text-xs text-gold-300 font-medium">
                  ✓ {t.success}
                </div>
              )}
              {status === 'error' && (
                <div className="mt-3 text-center text-xs text-red-300 font-medium">
                  ⚠ {t.error}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════
            COLONNE DROITE : Grille de sélection
           ═══════════════════════════════════════════════════════ */}
        <section>
          <div className="mb-6 pb-4 border-b border-forest-100">
            <h2 className="font-display text-2xl md:text-3xl text-forest-900 leading-tight mb-1">
              {t.heading}
            </h2>
            <p className="text-sm text-ink-500">{t.subheading(stack.length)}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {products.map((p) => {
              const pickedCount = stack.filter((s) => s.slug === p.slug).length;
              const isPicked = pickedCount > 0;

              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => addBottle(p)}
                  title={`${p.name} — ${p.tagline ?? ''}`}
                  className={`
                    relative group text-left rounded-2xl overflow-hidden border transition-all
                    flex flex-col bg-cream-50
                    ${
                      isPicked
                        ? 'border-gold-500 ring-1 ring-gold-500/40 shadow-md'
                        : 'border-forest-100/70 hover:border-forest-400 hover:shadow-md hover:-translate-y-0.5'
                    }
                  `}
                >
                  {/* Image bouteille avec fond dégradé subtil */}
                  <div className="relative aspect-[3/4] bg-gradient-to-b from-cream-50 to-cream-100 flex items-end justify-center p-3">
                    <img
                      src={p.stackImage ?? p.image}
                      alt={p.name}
                      className="h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:-translate-y-1"
                      loading="lazy"
                      draggable={false}
                    />
                    {/* Pastille + (hover) */}
                    <span
                      className={`
                        absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                        font-medium text-sm transition-all
                        ${
                          isPicked
                            ? 'bg-gold-500 text-forest-950 shadow-md'
                            : 'bg-ink-900 text-cream-50 opacity-0 group-hover:opacity-100'
                        }
                      `}
                      aria-hidden="true"
                    >
                      {isPicked ? (
                        <span className="font-display text-[13px] leading-none">
                          {pickedCount > 1 ? `×${pickedCount}` : '✓'}
                        </span>
                      ) : (
                        '+'
                      )}
                    </span>
                  </div>

                  {/* Meta : nom + tagline + prix */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-1.5 border-t border-forest-100/60">
                    <div>
                      <div className="font-display text-base text-forest-900 leading-tight">
                        {p.name}
                      </div>
                      {p.tagline && (
                        <div className="text-[11px] italic text-ink-500 mt-0.5 line-clamp-2 leading-snug">
                          {p.tagline}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-500">
                        {p.alcohol}% vol.
                      </span>
                      <span className="text-gold-700 font-medium tracking-wide">
                        {t.format(p.priceMin)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION BAS : Trios suggérés (sous le configurateur)
         ═══════════════════════════════════════════════════════ */}
      {products.length > 3 && (
        <div className="mt-16 pt-12 border-t border-forest-100">
          <div className="mb-6 text-center">
            <h3 className="font-display text-2xl md:text-3xl text-forest-900 leading-tight mb-2">
              {t.suggestedHeading}
            </h3>
            <p className="text-sm text-ink-500 max-w-xl mx-auto">{t.suggestedSub}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coffretTrios.map((trio: CoffretTrio) => {
              const allExist = trio.slugs.every((s) => productBySlug[s]);
              if (!allExist) return null;
              const trioProducts = trio.slugs.map((s) => productBySlug[s]);
              const trioTotal = trioProducts.reduce(
                (sum, p) => sum + (p?.priceMin ?? 0),
                0
              );
              const isCurrent =
                stack.length === 3 &&
                trio.slugs.every(
                  (s, i) => stack[i] && stack[i].slug === s
                );

              return (
                <button
                  key={trio.id}
                  type="button"
                  onClick={() => applyTrio(trio.slugs)}
                  className={`
                    group text-left rounded-2xl border overflow-hidden transition-all bg-cream-50
                    ${
                      isCurrent
                        ? 'border-gold-500 ring-1 ring-gold-500/40 shadow-md'
                        : 'border-forest-100/70 hover:border-forest-400 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex items-end justify-center gap-1 p-4 h-36 bg-gradient-to-b from-cream-50 to-cream-100 border-b border-forest-100/60">
                    {trioProducts.map((p, i) => (
                      <img
                        key={i}
                        src={p?.stackImage ?? p?.image}
                        alt=""
                        className="h-full w-auto object-contain"
                        loading="lazy"
                        draggable={false}
                      />
                    ))}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-display text-lg text-forest-900 leading-tight">
                        {trio.title[lang]}
                      </div>
                      {trio.badge && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-700 border border-gold-400/30 flex-none">
                          {trio.badge[lang]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500 leading-relaxed mb-3 line-clamp-3">
                      {trio.description[lang]}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-forest-800">
                        {t.format(trioTotal)}
                      </span>
                      <span className="text-xs text-forest-700 group-hover:text-forest-900 inline-flex items-center gap-1">
                        {isCurrent ? t.picked : t.pickTrio}
                        {!isCurrent && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="group-hover:translate-x-0.5 transition-transform"
                          >
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
    </div>
  );
}
