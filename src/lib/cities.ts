import type { CSSProperties } from "react";
import type { City, Country } from "@/types";

export type { Country };

/**
 * ISO 3166 codes of the countries we cover, in display order: Nordics, Baltics,
 * then the autonomous regions (Aland, Faroe Islands, Greenland). Keep in sync
 * with the server's CountryEnum.
 */
export const COUNTRIES: Country[] = ["FI", "SE", "NO", "DK", "IS", "EE", "LV", "LT", "AX", "FO", "GL"];

const isCountry = (c: string | undefined): c is Country => !!c && (COUNTRIES as string[]).includes(c);

/** An item's country. Rows from before multi-country support have none: they're Finnish. */
export const countryOf = (item: { country?: Country }): Country => item.country ?? "FI";

/** Countries that actually appear in a list, in COUNTRIES order. */
export function countriesIn(items: { country?: Country }[]): Country[] {
  const seen = new Set(items.map(countryOf));
  return COUNTRIES.filter((c) => seen.has(c));
}

/** Country name in the UI language ("FI" -> "Finland" / "Suomi"). */
export function countryLabel(code: Country, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * City dropdown options per country (the main cities). English names, as the
 * geocoder returns them with lang=en; Finnish ones match the stored values
 * ('Jyvaskyla'). A detected or saved city that isn't listed is added to the
 * dropdown, and "Other..." allows typing any town.
 */
export const CITY_OPTIONS: Record<Country, City[]> = {
  FI: ["Helsinki", "Espoo", "Vantaa", "Tampere", "Turku", "Oulu", "Jyvaskyla", "Lahti", "Kuopio", "Pori",
    "Joensuu", "Lappeenranta", "Hämeenlinna", "Vaasa", "Seinäjoki", "Rovaniemi", "Kouvola", "Kotka"],
  SE: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg", "Norrköping", "Lund", "Umeå"],
  NO: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Kristiansand", "Tromsø"],
  DK: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg"],
  IS: ["Reykjavík", "Kópavogur", "Hafnarfjörður", "Akureyri"],
  EE: ["Tallinn", "Tartu", "Narva", "Pärnu"],
  LV: ["Riga", "Daugavpils", "Liepāja", "Jelgava"],
  LT: ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"],
  AX: ["Mariehamn"],
  FO: ["Tórshavn"],
  GL: ["Nuuk"],
};

/** Which country each city appears in (first one wins if a name repeats). */
export function cityCountries(items: { city: City; country?: Country }[]): Map<City, Country> {
  const out = new Map<City, Country>();
  for (const i of items) if (!out.has(i.city)) out.set(i.city, countryOf(i));
  return out;
}

/**
 * The Finnish cities from before City became free text, in display order
 * (capital region first). Older rows store them in ASCII ('Jyvaskyla').
 */
const KNOWN: City[] = ["Helsinki", "Vantaa", "Espoo", "Tampere", "Turku", "Lahti", "Oulu", "Jyvaskyla", "Kuopio"];

/** Old ASCII values -> how they should read on screen. New cities are stored as typed. */
export const cityLabel = (c: City): string => (c === "Jyvaskyla" ? "Jyväskylä" : c);

/** Fixed marker / legend colours for the known cities. */
const KNOWN_COLOR: Record<string, string> = {
  Helsinki: "#ff4f96", Vantaa: "#ffc93c", Espoo: "#2dd4bf",
  Tampere: "#f97316", Turku: "#3b82f6", Lahti: "#22c55e",
  Oulu: "#a16207", Jyvaskyla: "#ef4444", Kuopio: "#64748b",
};

/** Colours for every other city, picked by a hash of the name so a city keeps its colour. */
const PALETTE = ["#e11d48", "#7c3aed", "#0891b2", "#65a30d", "#d97706", "#db2777", "#4f46e5", "#0d9488", "#b45309", "#9333ea"];

/** Marker / legend / chip colour of a city. */
export function cityColor(c: City): string {
  const known = KNOWN_COLOR[c];
  if (known) return known;
  let h = 0;
  for (const ch of c) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}

/** Capital-region cities have their own hand-tuned chip styles in globals.css. */
const STYLED = new Set(["Helsinki", "Vantaa", "Espoo"]);

/**
 * className + style for a city chip (`.chip`) or calendar pill (`.ev`). Every
 * other city uses the generic `.city` rule, coloured through `--c`.
 */
export function cityChip(c: City): { className: string; style?: CSSProperties } {
  if (STYLED.has(c)) return { className: c.toLowerCase() };
  return { className: "city", style: { "--c": cityColor(c) } as CSSProperties };
}

/** Cities that actually appear in a list: the known ones in order, then the rest A-Z. */
export function citiesIn(items: { city: City }[]): City[] {
  const seen = new Set(items.map((i) => i.city));
  const known = KNOWN.filter((c) => seen.has(c));
  const rest = [...seen].filter((c) => !KNOWN.includes(c)).sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}

/** Accent- and case-insensitive key (accented "Jyvaskyla" -> "jyvaskyla"). */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/** A geocoder's town name, mapped to the dropdown spelling if the country lists it. */
function cityName(name: string, country: Country): City {
  const n = fold(name);
  return CITY_OPTIONS[country].find((c) => fold(c) === n) ?? name.trim();
}

/** Rough centres of the known cities, only for the offline fallback in detectLocation. */
const CENTER: Record<string, [number, number]> = {
  Helsinki: [24.94, 60.17], Vantaa: [25.04, 60.29], Espoo: [24.66, 60.21],
  Tampere: [23.76, 61.50], Turku: [22.27, 60.45], Lahti: [25.66, 60.98],
  Oulu: [25.47, 65.01], Jyvaskyla: [25.75, 62.24], Kuopio: [27.68, 62.89],
};

/** Straight-line km between two lng/lat points (equirectangular is plenty here). */
function km([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
  const x = (lng2 - lng1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  const y = lat2 - lat1;
  return Math.sqrt(x * x + y * y) * 111.32;
}

/**
 * Offline guess: the nearest known city within 40 km, but only when it's
 * clearly nearest (the runner-up is at least twice as far). In the capital
 * region the centres are a few km apart, so a point like Otaniemi (Espoo) sits
 * closer to central Helsinki; there this returns null rather than a wrong city.
 */
export function nearestCity(lng: number, lat: number): City | null {
  const ranked = KNOWN.map((c) => ({ c, d: km([lng, lat], CENTER[c]!) })).sort((a, b) => a.d - b.d);
  const [first, second] = ranked;
  if (!first || first.d > 40) return null;
  if (second && second.d < first.d * 2) return null;
  return first.c;
}

/** Photon puts Aland under Finland; we list it as its own region. */
function photonCountry(code: string | undefined, state: string | undefined): string | undefined {
  if (code === "FI" && state && fold(state).includes("aland")) return "AX";
  return code;
}

/**
 * detectLocation result: where a point is (city may be missing when the
 * geocoder names no town), a point outside every covered country, or "we
 * couldn't tell" (geocoder down and the offline guess was ambiguous).
 */
export type LocationGuess = { country: Country; city?: City } | "unsupported" | "unknown";

/**
 * Which covered country and city a point is in. Asks Photon (free OpenStreetMap
 * reverse geocoder, the same service the address search uses). When Photon is
 * down (it's free and rate-limits with 503s), falls back to nearestCity, which
 * only knows the bigger Finnish cities.
 */
export async function detectLocation(lng: number, lat: number, signal?: AbortSignal): Promise<LocationGuess> {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return "unknown";
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&lang=en&limit=1`, { signal });
    if (res.ok) {
      type Props = { countrycode?: string; state?: string; city?: string; town?: string; village?: string };
      const data = (await res.json()) as { features?: { properties?: Props }[] };
      const p = data.features?.[0]?.properties;
      if (p?.countrycode) {
        const country = photonCountry(p.countrycode.toUpperCase(), p.state);
        if (!isCountry(country)) return "unsupported";
        const named = p.city ?? p.town ?? p.village;
        return named ? { country, city: cityName(named, country) } : { country };
      }
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    // network error: fall through to the offline guess
  }
  const guess = nearestCity(lng, lat);
  return guess ? { country: "FI", city: guess } : "unknown";
}
