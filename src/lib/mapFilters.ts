import type { City, Event, EventCategory, Place } from "@/types";
import { isPracticeType } from "@/types";
import { CITY_COUNTRY, type Country } from "./cities";
import { eventEndsOn } from "./data";

/**
 * Filters for the map page. Empty arrays mean "no restriction" (All).
 * Events are filtered by everything; spots/practice places only by country,
 * city and the layer toggles (they have no date or category).
 */
export type DatePreset = "any" | "7d" | "30d" | "3m" | "custom";

export interface MapFilters {
  layers: { events: boolean; spots: boolean; practice: boolean };
  categories: EventCategory[];
  countries: Country[];
  cities: City[];
  datePreset: DatePreset;
  from: string; // 'YYYY-MM-DD', only used when datePreset is 'custom'
  to: string;
}

export const DEFAULT_FILTERS: MapFilters = {
  layers: { events: true, spots: true, practice: true },
  categories: [],
  countries: [],
  cities: [],
  datePreset: "any",
  from: "",
  to: "",
};

/** Events without a category yet (the server doesn't send one) count as cosplay. */
export const eventCategory = (e: Event): EventCategory => e.category ?? "cosplay";

/** Local 'YYYY-MM-DD' for today. */
export function todayISO(now = new Date()): string {
  return toISO(now);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toISO(new Date(y, m - 1, d + days));
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toISO(new Date(y, m - 1 + months, d));
}

/**
 * The date window an event must overlap. `from` never goes before today: the
 * map only shows upcoming events (past ones live in the Events archive).
 * `to` is null for "no end".
 */
export function dateWindow(f: MapFilters, today: string): { from: string; to: string | null } {
  switch (f.datePreset) {
    case "7d": return { from: today, to: addDays(today, 6) };
    case "30d": return { from: today, to: addDays(today, 29) };
    case "3m": return { from: today, to: addMonths(today, 3) };
    case "custom": return { from: f.from && f.from > today ? f.from : today, to: f.to || null };
    default: return { from: today, to: null };
  }
}

function inPlace(item: { city: City }, f: MapFilters): boolean {
  if (f.countries.length && !f.countries.includes(CITY_COUNTRY[item.city])) return false;
  if (f.cities.length && !f.cities.includes(item.city)) return false;
  return true;
}

/** Upcoming events matching the filters, soonest first. */
export function filterEvents(events: Event[], f: MapFilters, today: string): Event[] {
  if (!f.layers.events) return [];
  const { from, to } = dateWindow(f, today);
  return events
    .filter((e) => eventEndsOn(e) >= from && (to === null || e.date <= to))
    .filter((e) => !f.categories.length || f.categories.includes(eventCategory(e)))
    .filter((e) => inPlace(e, f))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Spots and practice places matching the layer toggles and location filters. */
export function filterPlaces(places: Place[], f: MapFilters): Place[] {
  return places
    .filter((p) => (isPracticeType(p.type) ? f.layers.practice : f.layers.spots))
    .filter((p) => inPlace(p, f));
}

/** How many filter groups differ from the defaults (for the badge on the toggle). */
export function activeFilterCount(f: MapFilters): number {
  const d = DEFAULT_FILTERS.layers;
  return (
    Number(f.layers.events !== d.events || f.layers.spots !== d.spots || f.layers.practice !== d.practice) +
    Number(f.categories.length > 0) +
    Number(f.countries.length > 0) +
    Number(f.cities.length > 0) +
    Number(f.datePreset !== "any")
  );
}
