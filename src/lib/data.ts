import type { Event, Place } from "@/types";

/**
 * Placeholder data so the UI renders before the live API is wired up.
 * Shapes match the client contract in src/types.ts (and the server's
 * @anime-con/shared schemas). Replace with fetches to the events/places
 * services later.
 */

export const events: Event[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Tracon Hel",
    venue: "Messukeskus",
    city: "Helsinki",
    date: "2026-07-11",
    lng: 24.9354,
    lat: 60.2012,
    description: "Anime, manga & cosplay weekend at the Helsinki Expo Centre.",
    status: "live",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Yukicon Summer",
    venue: "Vantaa Energia Areena",
    city: "Vantaa",
    date: "2026-08-23",
    lng: 25.0116,
    lat: 60.2931,
    description: "Community-run con with artist alley, panels and concerts.",
    status: "live",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Tsukicon Mini",
    venue: "Kaapelitehdas",
    city: "Helsinki",
    date: "2026-09-14",
    lng: 24.9043,
    lat: 60.164,
    description: "One-day autumn meetup at the Cable Factory.",
    status: "live",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Cosvision",
    venue: "Dipoli",
    city: "Espoo",
    date: "2026-10-04",
    lng: 24.827,
    lat: 60.1849,
    description: "Cosplay-focused day with workshops and a masquerade.",
    status: "live",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Hellocon",
    venue: "Messukeskus",
    city: "Helsinki",
    date: "2026-11-15",
    lng: 24.9354,
    lat: 60.2012,
    description: "Late-autumn pop-culture convention.",
    status: "live",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Desucon Frostbite",
    venue: "Vantaa Energia Areena",
    city: "Vantaa",
    date: "2026-12-06",
    lng: 25.0116,
    lat: 60.2931,
    description: "Cosy winter edition of the beloved Desucon series.",
    status: "live",
  },
];

/** Distinct venues for the map markers. */
export const venues = [
  { name: "Messukeskus", city: "Helsinki", color: "#ff4f96", lng: 24.9354, lat: 60.2012 },
  { name: "Vantaa Energia Areena", city: "Vantaa", color: "#ffc93c", lng: 25.0116, lat: 60.2931 },
  { name: "Kaapelitehdas", city: "Helsinki", color: "#ff4f96", lng: 24.9043, lat: 60.164 },
  { name: "Dipoli", city: "Espoo", color: "#2dd4bf", lng: 24.827, lat: 60.1849 },
] as const;

export const places: Place[] = [
  {
    id: "a1111111-1111-4111-8111-111111111111",
    name: "Café Sakura",
    type: "cafe",
    city: "Helsinki",
    address: "Iso Roobertinkatu 12, Helsinki",
    lng: 24.9402,
    lat: 60.1641,
    themes: ["pastel", "japanese garden", "kawaii"],
    photos: [{ url: "https://picsum.photos/seed/sakura/600/400", caption: "Pastel interior" }],
    description: "Cosy pastel café that happily welcomes cosplayers for photos.",
    openingHours: "10:00–20:00",
    status: "live",
  },
  {
    id: "a2222222-2222-4222-8222-222222222222",
    name: "Neon Ramen Bar",
    type: "restaurant",
    city: "Helsinki",
    address: "Kaisaniemenkatu 4, Helsinki",
    lng: 24.9465,
    lat: 60.1718,
    themes: ["cyberpunk", "neon", "night city"],
    photos: [{ url: "https://picsum.photos/seed/ramen/600/400", caption: "Neon counter" }],
    description: "Neon-lit ramen spot with a cyberpunk vibe — great for night shoots.",
    openingHours: "16:00–23:00",
    status: "live",
  },
  {
    id: "a3333333-3333-4333-8333-333333333333",
    name: "Kamppi Center",
    type: "mall",
    city: "Helsinki",
    address: "Urho Kekkosen katu 1, Helsinki",
    lng: 24.9316,
    lat: 60.1686,
    themes: ["modern", "indoor backdrops"],
    photos: [{ url: "https://picsum.photos/seed/kamppi/600/400", caption: "Atrium" }],
    description: "Spacious indoor mall with bright atriums and friendly staff.",
    openingHours: "08:00–22:00",
    status: "live",
  },
  {
    id: "a4444444-4444-4444-8444-444444444444",
    name: "Studio Hikari",
    type: "studio",
    city: "Vantaa",
    address: "Tikkurila, Vantaa",
    lng: 25.0432,
    lat: 60.2925,
    themes: ["chroma key", "fantasy sets", "studio lighting"],
    photos: [{ url: "https://picsum.photos/seed/hikari/600/400", caption: "Studio set" }],
    description: "Bookable photo studio with cosplay-friendly sets and lighting.",
    openingHours: "By appointment",
    status: "live",
  },
  {
    id: "a5555555-5555-4555-8555-555555555555",
    name: "Töölönlahti Park",
    type: "outdoor",
    city: "Helsinki",
    address: "Töölönlahti, Helsinki",
    lng: 24.9356,
    lat: 60.1798,
    themes: ["nature", "lakeside", "spring blossoms"],
    photos: [{ url: "https://picsum.photos/seed/toolo/600/400", caption: "Lakeside path" }],
    description: "Scenic lakeside park popular for outdoor cosplay shoots.",
    openingHours: "Always open",
    status: "live",
  },
  {
    id: "a6666666-6666-4666-8666-666666666666",
    name: "Maid Café Mochi",
    type: "cafe",
    city: "Espoo",
    address: "Leppävaara, Espoo",
    lng: 24.8138,
    lat: 60.2192,
    themes: ["maid cafe", "kawaii", "tea party"],
    photos: [{ url: "https://picsum.photos/seed/mochi/600/400", caption: "Maid café" }],
    description: "Themed maid café that loves hosting cosplayers and events.",
    openingHours: "12:00–19:00",
    status: "live",
  },
];

/** Format an ISO date (YYYY-MM-DD) into { day, mon, year }. */
export function splitDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const mon = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][Number(m) - 1];
  return { day: d, mon, year: y };
}

/**
 * Human date range. Single day → "11 Jul 2026". Multi-day, collapsed sensibly:
 * same month → "11–13 Jul 2026", same year → "30 Aug – 1 Sep 2026",
 * else → "30 Dec 2026 – 2 Jan 2027".
 */
export function fmtRange(start: string, end?: string): string {
  const s = splitDate(start);
  if (!end || end <= start) return `${s.day} ${s.mon} ${s.year}`;
  const e = splitDate(end);
  if (s.year === e.year && s.mon === e.mon) return `${s.day}–${e.day} ${s.mon} ${s.year}`;
  if (s.year === e.year) return `${s.day} ${s.mon} – ${e.day} ${e.mon} ${s.year}`;
  return `${s.day} ${s.mon} ${s.year} – ${e.day} ${e.mon} ${e.year}`;
}

/** The day an event is considered "over" for upcoming/past filtering. */
export function eventEndsOn(e: { date: string; endDate?: string }): string {
  return e.endDate && e.endDate >= e.date ? e.endDate : e.date;
}

export const placeTypeLabel: Record<Place["type"], string> = {
  cafe: "Café",
  restaurant: "Restaurant",
  mall: "Mall",
  studio: "Studio",
  outdoor: "Outdoor",
};
