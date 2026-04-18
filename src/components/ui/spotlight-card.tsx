import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * GlowCard — carte avec halo doré qui suit le curseur SUR la carte (pas global).
 *
 * Version simplifiée et clairement visible :
 * - Un pseudo-élément ::after en radial-gradient doré qui apparaît au hover
 * - Suit précisément la position du curseur via CSS custom props (--mx / --my)
 * - Bordure dorée qui s'allume aussi au hover
 * - Zéro dépendance externe, CSS pur
 */

interface GlowCardProps {
  children?: ReactNode;
  className?: string;
  /** Garde la prop pour compatibilité. Ignorée — le halo est toujours doré. */
  glowColor?: 'gold' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
  padding?: 'none' | 'sm' | 'md';
  /** Intensité du halo (0 à 1). Défaut : 1. */
  glowIntensity?: number;
}

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
};

const paddingMap = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
};

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  size = 'md',
  width,
  height,
  customSize = false,
  padding = 'md',
  glowIntensity = 1,
  glowColor = 'gold',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };
    const handleEnter = () => {
      el.style.setProperty('--glow-opacity', String(glowIntensity));
    };
    const handleLeave = () => {
      el.style.setProperty('--glow-opacity', '0');
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerenter', handleEnter);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerenter', handleEnter);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, [glowIntensity]);

  const sizeClasses = customSize ? '' : sizeMap[size];
  const aspectClass = !customSize ? 'aspect-[3/4]' : '';

  const style: React.CSSProperties & Record<string, string> = {
    '--mx': '50%',
    '--my': '50%',
    '--glow-opacity': '0',
  };
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  // Couleur du halo — gold par défaut, emerald alternative
  const glowRgb =
    glowColor === 'emerald'
      ? '10, 107, 67' // forest-500
      : '205, 182, 132'; // gold-500

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .glow-card-wrapper {
              position: relative;
              isolation: isolate;
              transition: border-color 280ms ease, box-shadow 280ms ease;
            }
            .glow-card-wrapper::before {
              content: "";
              position: absolute;
              inset: 0;
              pointer-events: none;
              border-radius: inherit;
              opacity: var(--glow-opacity, 0);
              transition: opacity 280ms ease;
              background: radial-gradient(
                220px circle at var(--mx) var(--my),
                rgba(${glowRgb}, 0.28),
                rgba(${glowRgb}, 0.10) 30%,
                transparent 60%
              );
              z-index: 1;
            }
            .glow-card-wrapper::after {
              content: "";
              position: absolute;
              inset: -1px;
              pointer-events: none;
              border-radius: inherit;
              padding: 1.5px;
              background: radial-gradient(
                200px circle at var(--mx) var(--my),
                rgba(${glowRgb}, 0.9),
                rgba(${glowRgb}, 0.2) 40%,
                transparent 70%
              );
              opacity: var(--glow-opacity, 0);
              transition: opacity 280ms ease;
              -webkit-mask:
                linear-gradient(#000 0 0) content-box,
                linear-gradient(#000 0 0);
              -webkit-mask-composite: xor;
              mask-composite: exclude;
              z-index: 2;
            }
            .glow-card-wrapper > * {
              position: relative;
              z-index: 0;
            }
          `,
        }}
      />
      <div
        ref={cardRef}
        style={style}
        className={[
          'glow-card-wrapper',
          sizeClasses,
          aspectClass,
          'rounded-2xl',
          'border border-forest-100/60',
          paddingMap[padding],
          'bg-white',
          'shadow-[0_2px_10px_-4px_rgba(15,94,61,0.1)]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </>
  );
};

export default GlowCard;
