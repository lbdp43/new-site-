import * as React from 'react';
import {
  ContainerAnimated,
  ContainerScroll,
  ContainerStagger,
  ContainerSticky,
  GalleryCol,
  GalleryContainer,
} from './ui/animated-gallery';

export interface BlogHeroItem {
  href: string;
  cover: string;
  title: string;
  category: string;
}

interface Props {
  /** Articles à afficher en 3 colonnes parallaxe (minimum 9 pour un rendu riche). */
  items: BlogHeroItem[];
}

/**
 * BlogHeroGallery — hero immersif pour /blog.
 * Staggered text au-dessus + galerie 3D parallaxe qui se redresse au scroll.
 */
export default function BlogHeroGallery({ items }: Props) {
  // Répartit en 3 colonnes (le plus de photos dans le 2e colonne pour le centre visuel)
  const cols: BlogHeroItem[][] = [[], [], []];
  items.forEach((it, i) => cols[i % 3].push(it));

  return (
    <div className="relative bg-white">
      {/* En-tête éditorial staggered */}
      <ContainerStagger className="relative z-20 -mb-16 md:-mb-24 place-self-center px-6 pt-16 md:pt-24 text-center">
        <ContainerAnimated>
          <div className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold-600 font-medium mb-4">
            Journal
          </div>
        </ContainerAnimated>
        <ContainerAnimated>
          <h1 className="font-display text-5xl md:text-7xl text-forest-900 leading-[1.05]">
            Chroniques
          </h1>
        </ContainerAnimated>
        <ContainerAnimated>
          <h1
            className="font-display text-5xl md:text-7xl text-forest-600 italic leading-[1.05] -mt-1"
            style={{ fontFamily: 'Sunshine Script, Dancing Script, cursive', fontStyle: 'normal' }}
          >
            de la Brasserie
          </h1>
        </ContainerAnimated>
        <ContainerAnimated className="my-6">
          <p className="leading-normal text-ink-700 max-w-xl mx-auto">
            Nos rencontres avec les plantes, les recettes que nous aimons,
            les coulisses de notre travail. Un article, une histoire,
            sans calendrier forcé.
          </p>
        </ContainerAnimated>
        <ContainerAnimated>
          <a
            href="#blog-grid"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 text-sm font-medium transition-colors"
          >
            Voir tous les articles
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </a>
        </ContainerAnimated>
      </ContainerStagger>

      {/* Halo doré en fond */}
      <div
        className="pointer-events-none absolute z-10 h-[70vh] w-full"
        style={{
          background: 'linear-gradient(to right, rgba(205,182,132,0.35), rgba(10,107,67,0.25), rgba(205,182,132,0.35))',
          filter: 'blur(100px)',
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      />

      {/* Galerie 3D scroll */}
      <ContainerScroll className="relative h-[280vh]">
        <ContainerSticky className="h-svh">
          <GalleryContainer className="max-w-7xl mx-auto px-4 md:px-6">
            <GalleryCol yRange={['-10%', '2%']} className="-mt-2">
              {cols[0].map((item) => (
                <BlogCard key={item.href} item={item} />
              ))}
            </GalleryCol>
            <GalleryCol className="mt-[-50%]" yRange={['15%', '5%']}>
              {cols[1].map((item) => (
                <BlogCard key={item.href} item={item} />
              ))}
            </GalleryCol>
            <GalleryCol yRange={['-10%', '2%']} className="-mt-2">
              {cols[2].map((item) => (
                <BlogCard key={item.href} item={item} />
              ))}
            </GalleryCol>
          </GalleryContainer>
        </ContainerSticky>
      </ContainerScroll>
    </div>
  );
}

function BlogCard({ item }: { item: BlogHeroItem }) {
  return (
    <a
      href={item.href}
      className="group relative block aspect-video rounded-xl overflow-hidden shadow-[0_10px_30px_-12px_rgba(15,94,61,0.25)] bg-forest-100 transition-shadow hover:shadow-[0_14px_40px_-10px_rgba(205,182,132,0.45)]"
    >
      <img
        src={item.cover}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        loading="lazy"
      />
      {/* Overlay foncé pour garantir la lisibilité du titre blanc */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
        <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-gold-300 mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {item.category}
        </div>
        <h3
          className="font-display text-sm md:text-base leading-tight line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          style={{ color: '#ffffff' }}
        >
          {item.title}
        </h3>
      </div>
    </a>
  );
}
