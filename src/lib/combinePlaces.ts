import type { Place } from "@/types";

/**
 * Admin "Combine selected" for spots: the same place added twice -> ONE spot. The oldest
 * row is kept; themes, photos and facilities from all rows are merged, and empty text
 * fields (address, description, opening hours, booking link, price details) are filled in
 * from the others. Returns the update for the kept row and the ids to set to draft.
 */
export function combinePlaces(places: Place[]): { keepId: string; patch: Partial<Place>; draftIds: string[] } | null {
  if (places.length < 2) return null;
  const sorted = [...places].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  const keep = sorted[0];
  const firstOf = <K extends "address" | "description" | "openingHours" | "bookingUrl" | "priceNote">(k: K) =>
    keep[k] || sorted.find((p) => p[k])?.[k];
  const photos = [...new Map(sorted.flatMap((p) => p.photos).map((ph) => [ph.url, ph])).values()];
  const facilities = [...new Set(sorted.flatMap((p) => p.facilities ?? []))];
  const patch: Partial<Place> = {
    themes: [...new Set(sorted.flatMap((p) => p.themes.map((t) => t.trim())).filter(Boolean))].slice(0, 30),
    photos,
    ...(facilities.length ? { facilities } : {}),
  };
  for (const k of ["address", "description", "openingHours", "bookingUrl", "priceNote"] as const) {
    const v = firstOf(k);
    if (v && v !== keep[k]) patch[k] = v;
  }
  return { keepId: keep.id, patch, draftIds: sorted.slice(1).map((p) => p.id) };
}
