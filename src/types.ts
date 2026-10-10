/**
 * Client-owned type contract for the cosplay map.
 *
 * The backend (cosplay-map-server) is the source of truth and validates with
 * Zod. The client is a read-only consumer of the public APIs, so it keeps its
 * own lightweight TypeScript interfaces here. Keep these in sync by hand with
 * the server's `@anime-con/shared` schemas.
 */

// City / town name, free text (the server's CityName). Older Finnish rows are
// ASCII ('Jyvaskyla'); show any city with cityLabel() from lib/cities.
export type City = string;
/** ISO 3166-1 alpha-2 (the server's CountryEnum): Nordics, Baltics, Aland, Faroe Islands, Greenland. */
export type Country = 'FI' | 'SE' | 'NO' | 'DK' | 'IS' | 'EE' | 'LV' | 'LT' | 'AX' | 'FO' | 'GL';
export type Status = 'live' | 'draft' | 'pending';
/** What kind of event: a cosplay con/meetup, or a K-pop/J-pop dance cover event. */
export type EventCategory = 'cosplay' | 'cover';
export const EVENT_CATEGORIES: readonly EventCategory[] = ['cosplay', 'cover'];
export type PlaceType =
  | 'cafe' | 'restaurant' | 'mall' | 'studio' | 'outdoor' // photo spots ('studio' = photo studio)
  | 'dance-studio' | 'practice-space';                     // practice / rehearsal places
export type Booking = 'drop-in' | 'booking-required' | 'classes-only';
export type Price = 'free' | 'paid';
export type Facility = 'mirrors' | 'sound-system' | 'changing-room' | 'big-floor';

/** Types listed on the Practice tab instead of the Spots tab (matches the server). */
export const PRACTICE_TYPES: readonly PlaceType[] = ['dance-studio', 'practice-space'];
export const PHOTO_TYPES: readonly PlaceType[] = ['cafe', 'restaurant', 'mall', 'studio', 'outdoor'];
export const FACILITIES: readonly Facility[] = ['mirrors', 'sound-system', 'changing-room', 'big-floor'];
export const isPracticeType = (t: PlaceType): boolean => PRACTICE_TYPES.includes(t);

/** A dated anime convention. From `GET /v1/events`. */
export interface Event {
  id: string;
  name: string;
  venue: string;
  city: City;
  country?: Country; // missing = 'FI' (see countryOf in lib/cities)
  category?: EventCategory; // client-only for now; missing = 'cosplay' (see eventCategory in lib/mapFilters)
  date: string; // start date, ISO 'YYYY-MM-DD'
  endDate?: string; // last day for multi-day events (>= date)
  lng: number;
  lat: number;
  description?: string;
  url?: string; // link to the event's info page (organizer / Linked Events)
  image?: string; // thumbnail / logo URL
  startTime?: string; // local 'HH:MM' on `date`
  endTime?: string; // local 'HH:MM' on `endDate` (or `date`)
  status: Status;
  createdAt?: string;
}

/** A photo of a place (URL only for now). */
export interface Photo {
  url: string;
  caption?: string;
}

/** A cosplay-friendly place. From `GET /v1/places`. */
export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  city: City;
  country?: Country; // missing = 'FI' (see countryOf in lib/cities)
  address?: string;
  lng: number;
  lat: number;
  themes: string[];
  photos: Photo[];
  description?: string;
  openingHours?: string;
  // ---- practice places only (dance-studio / practice-space) ----
  booking?: Booking;
  price?: Price;
  priceNote?: string;
  facilities?: Facility[];
  youthFriendly?: boolean; // admin-set; under-18s may use it
  bookingUrl?: string;
  status: Status;
  createdAt?: string;
}

/* ---- GeoJSON shapes returned by the services (lng/lat → coordinates) ---- */

export interface Feature<P> {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: P;
}

export interface FeatureCollection<P> {
  type: 'FeatureCollection';
  features: Feature<P>[];
}

export type EventProperties = Omit<Event, 'lng' | 'lat'>;
export type PlaceProperties = Omit<Place, 'lng' | 'lat'>;
