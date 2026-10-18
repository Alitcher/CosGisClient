import type { City, Country } from "@/types";
import { countryOf } from "./cities";

/**
 * Filters of a home page section (conventions, local community, hot spots), picked in
 * the Filters panel: any number of countries, cities, age groups and prices.
 * An empty list = no restriction.
 */
export type AgeGroup = "kids" | "teens" | "adults";
export type PriceKind = "free" | "paid";
export type SectionFilter = { country: Country[]; city: City[]; age: AgeGroup[]; price: PriceKind[] };
export type FilterKey = keyof SectionFilter;
export const EMPTY_SECTION_FILTER: SectionFilter = { country: [], city: [], age: [], price: [] };
export const AGE_GROUPS: readonly AgeGroup[] = ["kids", "teens", "adults"];
export const PRICE_KINDS: readonly PriceKind[] = ["free", "paid"];

/** Age span of each group, in years (both ends included). */
const GROUPS: Record<AgeGroup, [number, number]> = { kids: [0, 12], teens: [13, 17], adults: [18, 99] };

/** What a filter needs to know about an item. `free` = shows as free (price tag). */
export type Filterable = { city: City; country?: Country; ageMin?: number | null; ageMax?: number | null; free: boolean };

/**
 * True when the item suits the age group: its suggested range overlaps the group.
 * No age set = all ages, so it suits every group.
 */
export function suitsAge(item: { ageMin?: number | null; ageMax?: number | null }, group: AgeGroup): boolean {
  const [lo, hi] = GROUPS[group];
  return (item.ageMin ?? 0) <= hi && (item.ageMax ?? 99) >= lo;
}

/** Does the item match one option of one group? */
export function matchesOption(item: Filterable, key: FilterKey, option: string): boolean {
  switch (key) {
    case "country": return countryOf(item) === option;
    case "city": return item.city === option;
    case "age": return suitsAge(item, option as AgeGroup);
    case "price": return (item.free ? "free" : "paid") === option;
  }
}

/** Matches every group (any picked option within a group). `skip` leaves one group out, for option counts. */
export function matchesSection(item: Filterable, f: SectionFilter, skip?: FilterKey): boolean {
  return (Object.keys(f) as FilterKey[]).every(
    (k) => k === skip || f[k].length === 0 || (f[k] as string[]).some((o) => matchesOption(item, k, o)),
  );
}

/** How many options are picked in total (the number on the Filters button). */
export const activeSectionFilters = (f: SectionFilter) => f.country.length + f.city.length + f.age.length + f.price.length;
