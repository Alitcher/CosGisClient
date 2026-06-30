/**
 * Address / place autocomplete via Photon (https://photon.komoot.io), a free
 * OpenStreetMap geocoder. No API key. Used by the submit forms so visitors can
 * type a venue, address or postal code and pick from a suggestion list instead
 * of entering raw coordinates.
 *
 * Results are biased toward the Helsinki capital region and limited to Finland.
 */
const PHOTON = "https://photon.komoot.io/api/";

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
  return parts.filter(Boolean).join(", ");
}

/** Query the geocoder. Returns up to ~8 Finnish suggestions, or [] on error. */
export async function geocode(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${PHOTON}?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=60.17&lon=24.94`;
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
    if (p.countrycode && p.countrycode !== "FI") continue; // Finland only
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
  return out;
}
