import type { Place } from "@/types";

/** Lowercase, accents removed, so "toolo" finds "Töölönlahti". */
export const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Does a place match a search? Looks at name, address, city, themes and description. */
export function placeMatches(p: Place, q: string): boolean {
  const needle = fold(q.trim());
  if (!needle) return true;
  return [p.name, p.address, p.city, p.description, ...p.themes].some((v) => v && fold(v).includes(needle));
}
