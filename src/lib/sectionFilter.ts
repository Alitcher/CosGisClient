import type { City, Country } from "@/types";
import { countryOf } from "./cities";

/**
 * Filters above each home page section (conventions, local community, hot spots):
 * country, city, age group and price. Empty string = no restriction.
 */
export type AgeGroup = "kids" | "teens" | "adults";
export type SectionFilter = { country: Country | ""; city: City; age: AgeGroup | ""; price: "free" | "paid" | "" };
export const EMPTY_SECTION_FILTER: SectionFilter = { country: "", city: "", age: "", price: "" };

/** Age span of each group, in years (both ends included). */
const GROUPS: Record<AgeGroup, [number, number]> = { kids: [0, 12], teens: [13, 17], adults: [18, 99] };

/**
 * True when the item suits the age group: its suggested range overlaps the group.
 * No age set = all ages, so it suits every group.
 */
export function suitsAge(item: { ageMin?: number | null; ageMax?: number | null }, group: AgeGroup): boolean {
  const [lo, hi] = GROUPS[group];
  return (item.ageMin ?? 0) <= hi && (item.ageMax ?? 99) >= lo;
}

/** Country, city and age checks shared by events and places; `isFree` decides the price check. */
export function matchesSection(
  item: { city: City; country?: Country; ageMin?: number | null; ageMax?: number | null },
  f: SectionFilter,
  isFree: boolean,
): boolean {
  if (f.country && countryOf(item) !== f.country) return false;
  if (f.city && item.city !== f.city) return false;
  if (f.age && !suitsAge(item, f.age)) return false;
  if (f.price === "free" && !isFree) return false;
  if (f.price === "paid" && isFree) return false;
  return true;
}

/** How many filters are set (for the "Clear" button). */
export const activeSectionFilters = (f: SectionFilter) => [f.country, f.city, f.age, f.price].filter(Boolean).length;
