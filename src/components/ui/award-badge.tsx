import React, { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

/**
 * AwardBadge
 *
 * Badge médaille interactif inspiré de
 * https://21st.dev/community/components/shugar/award-badge/default
 *
 * Adaptation : au lieu de Product Hunt, ce composant met en valeur les
 * distinctions spiritueux de la Brasserie des Plantes (World Drinks Awards,
 * Concours de Lyon, Concours de Paris, etc.). Micro-interactions 3D,
 * overlays iridescents, fonds personnalisables par type.
 */

export type AwardType =
  | 'world-best'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'custom';

interface AwardBadgeProps {
  /** Type de distinction. */
  type: AwardType;
  /** Titre principal (ex : "Meilleur Digestif du Monde"). */
  title: string;
  /** Organisme / concours (ex : "World Drinks Awards 2025"). */
  issuer: string;
  /** Produit concerné (optionnel, petite ligne au-dessus). */
  product?: string;
  /** Lien externe (page officielle du concours). */
  link?: string;
  /** Taille du badge. */
  size?: 'sm' | 'md' | 'lg';
  /** Classe additionnelle sur le conteneur. */
  className?: string;
}

const identityMatrix =
  '1, 0, 0, 0, ' + '0, 1, 0, 0, ' + '0, 0, 1, 0, ' + '0, 0, 0, 1';

const maxRotate = 0.25;
const minRotate = -0.25;
const maxScale = 1;
const minScale = 0.97;

/**
 * Palette de fond par type.
 * Reprise des codes couleurs des médailles classiques spiritueux.
 */
const palette: Record<AwardType, { bg: string; border: string; label: string; ribbon: string }> = {
  'world-best': {
    bg: '#f7e6b5', // or lumineux
    border: '#b08d3d',
    label: '#5a4418',
    ribbon: '#b08d3d',
  },
  gold: {
    bg: '#f3e3ac',
    border: '#b08d3d',
    label: '#5a4418',
    ribbon: '#b08d3d',
  },
  silver: {
    bg: '#e6e8ec',
    border: '#8e9399',
    label: '#3d4147',
    ribbon: '#8e9399',
  },
  bronze: {
    bg: '#f1cfa6',
    border: '#915c2b',
    label: '#4a2f18',
    ribbon: '#915c2b',
  },
  custom: {
    bg: '#f3e3ac',
    border: '#b08d3d',
    label: '#5a4418',
    ribbon: '#b08d3d',
  },
};

const sizeMap = {
  sm: { wrapper: 'w-[220px]', viewBox: '0 0 260 54' },
  md: { wrapper: 'w-[220px] sm:w-[280px]', viewBox: '0 0 260 54' },
  lg: { wrapper: 'w-[260px] sm:w-[320px]', viewBox: '0 0 260 54' },
};

export const AwardBadge = ({
  type,
  title,
  issuer,
  product,
  link,
  size = 'md',
  className = '',
}: AwardBadgeProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [firstOverlayPosition, setFirstOverlayPosition] = useState<number>(0);
  const [matrix, setMatrix] = useState<string>(identityMatrix);
  const [currentMatrix, setCurrentMatrix] = useState<string>(identityMatrix);
  const [disableInOutOverlayAnimation, setDisableInOutOverlayAnimation] =
    useState<boolean>(true);
  const [disableOverlayAnimation, setDisableOverlayAnimation] =
    useState<boolean>(false);
  const [isTimeoutFinished, setIsTimeoutFinished] = useState<boolean>(false);
  const enterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout3 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = palette[type];
  const sz = sizeMap[size];

  const getDimensions = () => {
    const left = ref?.current?.getBoundingClientRect()?.left || 0;
    const right = ref?.current?.getBoundingClientRect()?.right || 0;
    const top = ref?.current?.getBoundingClientRect()?.top || 0;
    const bottom = ref?.current?.getBoundingClientRect()?.bottom || 0;
    return { left, right, top, bottom };
  };

  const getMatrix = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale - ((maxScale - minScale) * Math.abs(xCenter - clientX)) / (xCenter - left || 1),
      maxScale - ((maxScale - minScale) * Math.abs(yCenter - clientY)) / (yCenter - top || 1),
      maxScale -
        ((maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY))) /
          ((xCenter - left || 1) + (yCenter - top || 1)),
    ];

    const rotate = {
      x1: 0.25 * ((yCenter - clientY) / (yCenter || 1) - (xCenter - clientX) / (xCenter || 1)),
      x2: maxRotate - ((maxRotate - minRotate) * Math.abs(right - clientX)) / ((right - left) || 1),
      x3: 0,
      y0: 0,
      y2: maxRotate - ((maxRotate - minRotate) * (top - clientY)) / ((top - bottom) || 1),
      y3: 0,
      z0: -(maxRotate - ((maxRotate - minRotate) * Math.abs(right - clientX)) / ((right - left) || 1)),
      z1: 0.2 - ((0.2 + 0.6) * (top - clientY)) / ((top - bottom) || 1),
      z3: 0,
    };
    return (
      `${scale[0]}, ${rotate.y0}, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `${rotate.x3}, ${rotate.y3}, ${rotate.z3}, 1`
    );
  };

  const getOppositeMatrix = (_matrix: string, clientY: number, onMouseEnter?: boolean) => {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onMouseEnter ? 0.7 : 4;
    const multiplier = onMouseEnter ? -1 : 1;

    return _matrix
      .split(', ')
      .map((item, index) => {
        if (index === 2 || index === 4 || index === 8) {
          return String((-parseFloat(item) * multiplier) / weakening);
        } else if (index === 0 || index === 5 || index === 10) {
          return '1';
        } else if (index === 6) {
          return String(
            (multiplier * (maxRotate - ((maxRotate - minRotate) * (top - oppositeY)) / ((top - bottom) || 1))) /
              weakening
          );
        } else if (index === 9) {
          return String(
            (maxRotate - ((maxRotate - minRotate) * (top - oppositeY)) / ((top - bottom) || 1)) /
              weakening
          );
        }
        return item;
      })
      .join(', ');
  };

  const onMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    if (leaveTimeout1.current) clearTimeout(leaveTimeout1.current);
    if (leaveTimeout2.current) clearTimeout(leaveTimeout2.current);
    if (leaveTimeout3.current) clearTimeout(leaveTimeout3.current);

    setDisableOverlayAnimation(true);

    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setDisableInOutOverlayAnimation(false);
    enterTimeout.current = setTimeout(() => setDisableInOutOverlayAnimation(true), 350);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFirstOverlayPosition(
          (Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5
        );
      });
    });

    const m = getMatrix(e.clientX, e.clientY);
    const oppositeMatrix = getOppositeMatrix(m, e.clientY, true);

    setMatrix(oppositeMatrix);
    setIsTimeoutFinished(false);
    setTimeout(() => setIsTimeoutFinished(true), 200);
  };

  const onMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setTimeout(
      () =>
        setFirstOverlayPosition(
          (Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5
        ),
      150
    );

    if (isTimeoutFinished) {
      setCurrentMatrix(getMatrix(e.clientX, e.clientY));
    }
  };

  const onMouseLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    const oppositeMatrix = getOppositeMatrix(matrix, e.clientY);
    if (enterTimeout.current) clearTimeout(enterTimeout.current);

    setCurrentMatrix(oppositeMatrix);
    setTimeout(() => setCurrentMatrix(identityMatrix), 200);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisableInOutOverlayAnimation(false);
        leaveTimeout1.current = setTimeout(
          () => setFirstOverlayPosition(-firstOverlayPosition / 4),
          150
        );
        leaveTimeout2.current = setTimeout(() => setFirstOverlayPosition(0), 300);
        leaveTimeout3.current = setTimeout(() => {
          setDisableOverlayAnimation(false);
          setDisableInOutOverlayAnimation(true);
        }, 500);
      });
    });
  };

  useEffect(() => {
    if (isTimeoutFinished) setMatrix(currentMatrix);
  }, [currentMatrix, isTimeoutFinished]);

  const overlayAnimations = [...Array(10).keys()]
    .map(
      (e) => `
    @keyframes overlayAnimation${e + 1} {
      0%   { transform: rotate(${e * 10}deg); }
      50%  { transform: rotate(${(e + 1) * 10}deg); }
      100% { transform: rotate(${e * 10}deg); }
    }
    `
    )
    .join(' ');

  const content = (
    <>
      <style>{overlayAnimations}</style>
      <div
        style={{
          transform: `perspective(700px) matrix3d(${matrix})`,
          transformOrigin: 'center center',
          transition: 'transform 200ms ease-out',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={sz.viewBox} className="w-full h-auto">
          <defs>
            <filter id={`blur-${type}`}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id={`mask-${type}`}>
              <rect width="260" height="54" fill="white" rx="10" />
            </mask>
          </defs>

          <rect width="260" height="54" rx="10" fill={colors.bg} />
          <rect
            x="4"
            y="4"
            width="252"
            height="46"
            rx="8"
            fill="transparent"
            stroke={colors.border}
            strokeWidth="1"
          />

          {/* Médaille stylisée (laurier) */}
          <g transform="translate(10, 8)">
            <circle cx="18" cy="19" r="16" fill={colors.ribbon} opacity="0.12" />
            <circle
              cx="18"
              cy="19"
              r="13"
              fill="none"
              stroke={colors.ribbon}
              strokeWidth="1.2"
            />
            {/* branche gauche */}
            <path
              d="M7 19 c0 4 2 8 4 10 M7 19 c-1 -1 -2 -3 -2 -4 M11 24 c-2 0 -4 -1 -4 -1 M11 29 c-2 0 -4 -2 -4 -2"
              stroke={colors.ribbon}
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            {/* branche droite */}
            <path
              d="M29 19 c0 4 -2 8 -4 10 M29 19 c1 -1 2 -3 2 -4 M25 24 c2 0 4 -1 4 -1 M25 29 c2 0 4 -2 4 -2"
              stroke={colors.ribbon}
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            {/* étoile centrale */}
            <path
              d="M18 12 l2 5.5 l6 0 l-5 3.5 l2 5.5 l-5 -3.5 l-5 3.5 l2 -5.5 l-5 -3.5 l6 0 z"
              fill={colors.ribbon}
            />
          </g>

          {/* Texte */}
          <text
            fontFamily='"Barlow Condensed", Helvetica, Arial, sans-serif'
            fontSize="8.5"
            fontWeight="700"
            letterSpacing="1.2"
            fill={colors.label}
            x="52"
            y="18"
          >
            {issuer.toUpperCase()}
          </text>
          <text
            fontFamily='"Joane", "Cormorant Garamond", Georgia, serif'
            fontSize="14"
            fontWeight="500"
            fill={colors.label}
            x="52"
            y="35"
          >
            {title}
          </text>
          {product && (
            <text
              fontFamily='"Barlow Condensed", Helvetica, Arial, sans-serif'
              fontSize="7.5"
              fontStyle="italic"
              fontWeight="500"
              fill={colors.label}
              opacity="0.75"
              x="52"
              y="46"
            >
              {product}
            </text>
          )}

          {/* Overlays iridescents */}
          <g style={{ mixBlendMode: 'overlay' }} mask={`url(#mask-${type})`}>
            {[
              'hsl(358, 100%, 62%)',
              'hsl(30, 100%, 50%)',
              'hsl(60, 100%, 50%)',
              'hsl(96, 100%, 50%)',
              'hsl(233, 85%, 47%)',
              'hsl(271, 85%, 47%)',
              'hsl(300, 20%, 35%)',
              'transparent',
              'transparent',
              'white',
            ].map((fill, idx) => (
              <g
                key={idx}
                style={{
                  transform: `rotate(${firstOverlayPosition + idx * 10}deg)`,
                  transformOrigin: 'center center',
                  transition: !disableInOutOverlayAnimation
                    ? 'transform 200ms ease-out'
                    : 'none',
                  animation: disableOverlayAnimation
                    ? 'none'
                    : `overlayAnimation${idx + 1} 5s infinite`,
                  willChange: 'transform',
                }}
              >
                <polygon
                  points="0,0 260,54 260,0 0,54"
                  fill={fill}
                  filter={`url(#blur-${type})`}
                  opacity="0.5"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </>
  );

  const commonClasses = `block ${sz.wrapper} h-auto cursor-pointer ${className}`;

  if (!link) {
    return (
      <div
        ref={ref as unknown as React.RefObject<HTMLDivElement>}
        className={commonClasses}
        onMouseMove={onMouseMove as unknown as React.MouseEventHandler<HTMLDivElement>}
        onMouseLeave={onMouseLeave as unknown as React.MouseEventHandler<HTMLDivElement>}
        onMouseEnter={onMouseEnter as unknown as React.MouseEventHandler<HTMLDivElement>}
      >
        {content}
      </div>
    );
  }

  return (
    <a
      ref={ref}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={commonClasses}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      {content}
    </a>
  );
};

export default AwardBadge;
