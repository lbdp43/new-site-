import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.enum(['Étienne', 'Guillaume', 'Bastien', 'La Brasserie des Plantes']).default('La Brasserie des Plantes'),
    cover: z.string().optional(),
    category: z.enum(['Plantes', 'Recettes', 'Terroir', 'Fabrication', 'Actualité']),
    readingTime: z.string().default('5 min'),
  }),
});

export const collections = { blog };
