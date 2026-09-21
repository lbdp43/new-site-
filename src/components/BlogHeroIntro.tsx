import * as React from 'react';
import { ContainerAnimated, ContainerStagger } from './ui/animated-gallery';

interface Props {
  /** Petit kicker au-dessus du titre (ex: "Actualité"). */
  kicker: string;
  /** Titre principal droit (ex: "Chroniques"). */
  title: string;
  /** Sous-titre en script italique (ex: "de la Brasserie"). */
  scriptSuffix: string;
  /** Paragraphe d'introduction sous le titre. */
  intro: string;
}

/**
 * BlogHeroIntro — hero éditorial léger pour /blog.
 * Staggered entrance (flou → net) sur kicker + titre + script + paragraphe.
 */
export default function BlogHeroIntro({ kicker, title, scriptSuffix, intro }: Props) {
  return (
    <ContainerStagger className="pt-20 md:pt-24 pb-12 text-center px-6">
      <ContainerAnimated>
        <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold-600 font-medium mb-4">
          {kicker}
        </div>
      </ContainerAnimated>
      {/* Le titre est visuellement coupé en deux pour l'effet staggered, mais
          il ne doit former qu'un seul H1 : deux <h1> sur la même page, c'est
          ce que /blog émettait jusqu'au 21/09/2026. La seconde moitié devient
          donc décorative, et le H1 porte le titre complet pour les lecteurs
          d'écran et les moteurs. */}
      <ContainerAnimated>
        <h1 className="font-display text-5xl md:text-7xl text-forest-900 leading-[1.05]">
          <span className="sr-only">{`${title} ${scriptSuffix}`}</span>
          <span aria-hidden="true">{title}</span>
        </h1>
      </ContainerAnimated>
      <ContainerAnimated>
        <div
          aria-hidden="true"
          className="font-display text-5xl md:text-7xl text-forest-600 italic leading-[1.05] -mt-1"
          style={{ fontFamily: 'Sunshine Script, Dancing Script, cursive', fontStyle: 'normal' }}
        >
          {scriptSuffix}
        </div>
      </ContainerAnimated>
      <ContainerAnimated className="my-6">
        <p className="leading-normal text-ink-700 max-w-xl mx-auto">
          {intro}
        </p>
      </ContainerAnimated>
    </ContainerStagger>
  );
}
