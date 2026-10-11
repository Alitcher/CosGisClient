import type { Event, Place } from "@/types";

/**
 * Server-side data for the per-item pages (/events/[id], /spots/[id]) and their
 * share previews. Runs on the Next server, not in the browser.
 */
const API =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_EVENTS_API_URL ||
  "http://localhost:8787";

/**
 * The site's public address, for absolute links in share previews (Facebook
 * needs full URLs). Set NEXT_PUBLIC_SITE_URL to use a custom domain; on Vercel it
 * falls back to the production domain.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

/** GET a live item by id; null when missing, not live, or the API is down. Cached 5 min. */
async function getLive<T extends { status: string }>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const item = (await res.json()) as T;
    return item.status === "live" ? item : null; // pending/draft items stay private
  } catch {
    return null;
  }
}

export const getEvent = (id: string) => getLive<Event>(`/v1/events/${encodeURIComponent(id)}`);
export const getPlace = (id: string) => getLive<Place>(`/v1/places/${encodeURIComponent(id)}`);

/** Every live item of one kind, for the sitemap. Empty when the API is down. Cached 1 h. */
async function listLive<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } });
    return res.ok ? ((await res.json()) as T[]) : [];
  } catch {
    return [];
  }
}

export const listLiveEvents = () => listLive<Event>("/v1/events");
export const listLivePlaces = () => listLive<Place>("/v1/places");
