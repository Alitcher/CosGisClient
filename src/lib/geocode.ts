/**
 * Address / place autocomplete via Photon (https://photon.komoot.io), a free
 * OpenStreetMap geocoder. No API key. Used by the submit forms so visitors can
 * type a venue, address or postal code and pick from a suggestion list instead
 * of entering raw coordinates.
 *
 * The search is limited to a box around the Nordics and Baltics (otherwise
 * "exhibition center" fills the list with China), results are biased toward the
 * capital of the chosen country (Helsinki by default) and filtered to the
 * countries we cover (COUNTRIES in lib/cities).
 */
import { COUNTRIES } from "./cities";
import type { Country } from "@/types";

const PHOTON = "https://photon.komoot.io/api/";
/** minLon,minLat,maxLon,maxLat: Greenland and Iceland in the west to Finland in the east. */
const BBOX = "-75,53,32,84";
/** Where to bias results for each country: its capital (lat, lon). */
const NEAR: Record<Country, [number, number]> = {
  FI: [60.17, 24.94], SE: [59.33, 18.07], NO: [59.91, 10.75], DK: [55.68, 12.57], IS: [64.15, -21.94],
  EE: [59.44, 24.75], LV: [56.95, 24.11], LT: [54.69, 25.28], AX: [60.1, 19.94], FO: [62.01, -6.77], GL: [64.18, -51.72],
};

export type GeoResult = {
  label: string; // human-readable suggestion text
  lng: number;
  lat: number;
  city?: string;
  postcode?: string;
};

type PhotonProps = {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  countrycode?: string;
};
type PhotonFeature = {
  properties?: PhotonProps;
  geometry?: { coordinates?: number[] };
};

function formatLabel(p: PhotonProps): string {
  const place = p.city || p.town || p.village || "";
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const head = p.name || street || place;
  const tail = [p.postcode, place].filter(Boolean).join(" ");
  const parts = [head];
  if (tail && tail !== head) parts.push(tail);
  // Most entries are Finnish; name the country for the rest so "Storgatan 1" is unambiguous.
  if (p.country && p.countrycode?.toUpperCase() !== "FI") parts.push(p.country);
  return parts.filter(Boolean).join(", ");
}

/** Query the geocoder. Returns up to 8 suggestions in covered countries, or [] on error. */
export async function geocode(query: string, signal?: AbortSignal, country: Country = "FI"): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const [lat, lon] = NEAR[country] ?? NEAR.FI;
  const url = `${PHOTON}?q=${encodeURIComponent(q)}&limit=15&lang=en&bbox=${BBOX}&lat=${lat}&lon=${lon}`;
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch {
    return []; // network error or aborted
  }
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const out: GeoResult[] = [];
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    const cc = p.countrycode?.toUpperCase();
    if (cc && !(COUNTRIES as string[]).includes(cc)) continue; // Nordics + Baltics only
    const c = f.geometry?.coordinates;
    if (!c || c.length < 2) continue;
    out.push({
      label: formatLabel(p),
      lng: c[0] as number,
      lat: c[1] as number,
      city: p.city || p.town || p.village,
      postcode: p.postcode,
    });
  }
  return out.slice(0, 8);
}
