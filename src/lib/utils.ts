import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Helper de concaténation de classes Tailwind, compatible shadcn/21st.dev.
 *
 * Combine `clsx` (conditions + tableaux + objets) et `tailwind-merge`
 * (dédoublonnage des classes Tailwind conflictuelles — ex. `p-2 p-4` → `p-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
