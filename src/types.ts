/**
 * Client-owned type contract for the cosplay map.
 *
 * The backend (cosplay-map-server) is the source of truth and validates with
 * Zod. The client is a read-only consumer of the public APIs, so it keeps its
 * own lightweight TypeScript interfaces here. Keep these in sync by hand with
 * the server's `@anime-con/shared` schemas.
 */

export type City = 'Helsinki' | 'Vantaa' | 'Espoo';
export type Status = 'live' | 'draft' | 'pending';
export type PlaceType = 'cafe' | 'restaurant' | 'mall' | 'studio' | 'outdoor';

/** A dated anime convention. From `GET /v1/events`. */
export interface Event {
  id: string;
  name: string;
  venue: string;
  city: City;
  date: string; // ISO 'YYYY-MM-DD'
  lng: number;
  lat: number;
  description?: string;
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
  address?: string;
  lng: number;
  lat: number;
  themes: string[];
  photos: Photo[];
  description?: string;
  openingHours?: string;
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
