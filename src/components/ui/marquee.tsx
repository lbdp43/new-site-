import * as React from 'react';

/**
 * Marquee — défilement horizontal (ou vertical) infini, en CSS pur.
 * Adapté depuis https://21st.dev/community/components/cnippet_dev/team
 *
 * Usage :
 *   <Marquee pauseOnHover className="[--duration:40s] [--gap:1.5rem]">
 *     {items.map(i => <Card key={i.id} />)}
 *   </Marquee>
 *
 * Props :
 *   - pauseOnHover : met en pause quand la souris survole
 *   - reverse      : inverse le sens
 *   - vertical     : défilement vertical (sinon horizontal)
 *   - repeat       : nombre de duplications (2 par défaut pour boucle seamless)
 */

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean;
  reverse?: boolean;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className = '',
  pauseOnHover = false,
  reverse = false,
  vertical = false,
  repeat = 2,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={[
        'group flex overflow-hidden p-2',
        vertical ? 'flex-col' : 'flex-row',
        '[--duration:40s] [--gap:1.5rem] [gap:var(--gap)]',
        // Classe CSS explicite qui gère le :hover (plus fiable que la variante arbitraire)
        pauseOnHover ? 'marquee-pause-on-hover' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={[
            'flex shrink-0 justify-around [gap:var(--gap)]',
            vertical
              ? 'flex-col animate-marquee-vertical'
              : 'flex-row animate-marquee',
            reverse ? '[animation-direction:reverse]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden={i > 0}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

export default Marquee;
