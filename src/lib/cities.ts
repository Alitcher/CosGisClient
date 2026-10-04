import type { City } from "@/types";

/** ISO 3166 codes of the countries we cover, in display order (Nordics, then Baltics). */
export type Country = "FI" | "SE" | "NO" | "DK" | "IS" | "EE" | "LV" | "LT";
export const COUNTRIES: Country[] = ["FI", "SE", "NO", "DK", "IS", "EE", "LV", "LT"];

/** Which country each city is in. Add new cities here when City grows past Finland. */
export const CITY_COUNTRY: Record<City, Country> = {
  Helsinki: "FI", Vantaa: "FI", Espoo: "FI", Tampere: "FI", Turku: "FI",
  Lahti: "FI", Oulu: "FI", Jyvaskyla: "FI", Kuopio: "FI",
};

/** Countries that actually appear in a list, in COUNTRIES order. */
export function countriesIn(items: { city: City }[]): Country[] {
  const seen = new Set(items.map((i) => CITY_COUNTRY[i.city]));
  return COUNTRIES.filter((c) => seen.has(c));
}

/** Country name in the UI language ("FI" -> "Finland" / "Suomi" / "ฟินแลนด์"). */
export function countryLabel(code: Country, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Every city the map supports, in display order (capital region first). Keep in
 * sync with City in types.ts, the server's CityEnum, CITY_COLOR in
 * public/map-embed.html, and the .chip/.ev city colours in globals.css.
 */
export const CITIES: City[] = [
  "Helsinki", "Vantaa", "Espoo", "Tampere", "Turku", "Lahti", "Oulu", "Jyvaskyla", "Kuopio",
];

/** Values are ASCII; this is how they should read on screen. */
export const cityLabel = (c: City): string => (c === "Jyvaskyla" ? "Jyväskylä" : c);

/** Marker / legend colour per city. */
export const CITY_COLOR: Record<City, string> = {
  Helsinki: "#ff4f96", Vantaa: "#ffc93c", Espoo: "#2dd4bf",
  Tampere: "#f97316", Turku: "#3b82f6", Lahti: "#22c55e",
  Oulu: "#a16207", Jyvaskyla: "#ef4444", Kuopio: "#64748b",
};

/** Rough city centres, only for the offline fallback in detectCity. */
const CENTER: Record<City, [number, number]> = {
  Helsinki: [24.94, 60.17], Vantaa: [25.04, 60.29], Espoo: [24.66, 60.21],
  Tampere: [23.76, 61.50], Turku: [22.27, 60.45], Lahti: [25.66, 60.98],
  Oulu: [25.47, 65.01], Jyvaskyla: [25.75, 62.24], Kuopio: [27.68, 62.89],
};

/** Cities that actually appear in a list, in CITIES order — for filters/legends. */
export function citiesIn(items: { city: City }[]): City[] {
  const seen = new Set(items.map((i) => i.city));
  return CITIES.filter((c) => seen.has(c));
}

/** Accent- and case-insensitive match of a place name to a City ("Jyväskylä" -> Jyvaskyla). */
function matchCity(name: string | undefined): City | null {
  if (!name) return null;
  const n = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  return CITIES.find((c) => c.toLowerCase() === n) ?? null;
}

/** Straight-line km between two lng/lat points (equirectangular is plenty here). */
function km([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]): number {
  const x = (lng2 - lng1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  const y = lat2 - lat1;
  return Math.sqrt(x * x + y * y) * 111.32;
}

/**
 * Offline guess: the nearest supported city within 40 km, but only when it's
 * clearly nearest (the runner-up is at least twice as far). In the capital
 * region the centres are a few km apart, so a point like Otaniemi (Espoo) sits
 * closer to central Helsinki; there this returns null rather than a wrong city.
 */
export function nearestCity(lng: number, lat: number): City | null {
  const ranked = CITIES.map((c) => ({ c, d: km([lng, lat], CENTER[c]) })).sort((a, b) => a.d - b.d);
  const [first, second] = ranked;
  if (!first || first.d > 40) return null;
  if (second && second.d < first.d * 2) return null;
  return first.c;
}

/** detectCity result: a city, a point outside every supported city, or "we
 *  couldn't tell" (geocoder down and the offline guess was ambiguous). */
export type CityGuess = City | "unsupported" | "unknown";

/**
 * Which supported city a point is in. Asks Photon (free OpenStreetMap reverse
 * geocoder, the same service the address search uses). "unsupported" when
 * Photon names a town we don't list (e.g. Kerava), so it isn't silently filed
 * under a neighbour. When Photon is down (it's free and rate-limits with 503s)
 * or names no town, falls back to nearestCity.
 */
export async function detectCity(lng: number, lat: number, signal?: AbortSignal): Promise<CityGuess> {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return "unknown";
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&lang=en&limit=1`, { signal });
    if (res.ok) {
      const data = (await res.json()) as { features?: { properties?: { city?: string; town?: string } }[] };
      const p = data.features?.[0]?.properties;
      const named = p?.city ?? p?.town;
      if (named) return matchCity(named) ?? "unsupported";
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    // network error: fall through to the offline guess
  }
  const guess = nearestCity(lng, lat);
  if (guess) return guess;
  // Far from every city centre is a clear "not supported"; near several is "can't tell".
  const nearAny = CITIES.some((c) => km([lng, lat], CENTER[c]) <= 40);
  return nearAny ? "unknown" : "unsupported";
}
