import type { Event, Place } from "@/types";
import { getAdminToken } from "./adminAuth";

/**
 * REST client for the backend (cosplay-map-server). Events and places used to be
 * two services on two ports; they were merged into ONE api-service sharing one
 * database, so a single base URL serves both:
 *   - GET /v1/events   (events + submissions under /v1/events/submissions)
 *   - GET /v1/places   (places + submissions under /v1/places/submissions)
 * Base URL + admin token come from env vars, with a dev default matching the
 * server's local setup. `NEXT_PUBLIC_EVENTS_API_URL` is honored as a fallback so
 * an existing deployment env keeps working.
 */
const API =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_EVENTS_API_URL ||
  "http://localhost:8787";

// The admin token is entered at the /admin login screen and read from
// sessionStorage at call time - it is never embedded in the public bundle.
function adminHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAdminToken()}`,
  };
}

async function jsonOrThrow<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) throw new Error(`${what} -> ${res.status}`);
  return (await res.json()) as T;
}

/* ---------------- Events (api-service /v1/events) ---------------- */

export type NewEventInput = Omit<Event, "id" | "status" | "createdAt">;

export async function apiListEvents(): Promise<Event[]> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events`, { cache: "no-store" }),
    "GET /v1/events",
  );
}
export async function apiCreateEvent(input: NewEventInput): Promise<Event> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(input),
    }),
    "POST /v1/events",
  );
}
export async function apiUpdateEvent(id: string, patch: Partial<Event>): Promise<Event> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events/${id}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(patch),
    }),
    `PUT /v1/events/${id}`,
  );
}
export async function apiDeleteEvent(id: string): Promise<void> {
  const res = await fetch(`${API}/v1/events/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE /v1/events/${id} -> ${res.status}`);
}
/** Public: suggest an event. Lands in the pending queue for admin approval. */
export type EventSubmissionInput = NewEventInput & { submittedBy?: string };
export async function apiSubmitEvent(input: EventSubmissionInput): Promise<{ ok: boolean; id: string }> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // public - no admin token
      body: JSON.stringify(input),
    }),
    "POST /v1/events/submissions",
  );
}

/** Pending event submissions awaiting moderation (admin). */
export async function apiListPendingEvents(): Promise<Event[]> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events/submissions`, { cache: "no-store", headers: adminHeaders() }),
    "GET /v1/events/submissions",
  );
}
/** Approve a pending event -> it becomes live. (Reject = apiDeleteEvent.) */
export async function apiApproveEvent(id: string): Promise<Event> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events/submissions/${id}/approve`, { method: "POST", headers: adminHeaders() }),
    `POST /v1/events/submissions/${id}/approve`,
  );
}

/** Summary returned by the Helsinki Linked Events import. */
export type SyncResult = {
  skipped?: "fresh";
  fetched: number;
  created: number;
  duplicates: number;
  ignored: number;
  lastModified: string | null;
};
/**
 * Admin: import cosplay/manga events from Helsinki's Linked Events API. They land
 * in the pending queue for approval. `force` bypasses the 12h freshness guard
 * (what an admin pressing the button wants). Server: services/linkedevents.ts.
 */
export async function apiSyncLinkedEvents(force = true): Promise<SyncResult> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events/sync/linkedevents${force ? "?force=1" : ""}`, {
      method: "POST",
      headers: adminHeaders(),
    }),
    "POST /v1/events/sync/linkedevents",
  );
}

/* ---------------- Places (api-service /v1/places) ---------------- */

export type NewPlaceInput = Omit<Place, "id" | "status" | "createdAt">;

export async function apiListPlaces(): Promise<Place[]> {
  return jsonOrThrow(
    await fetch(`${API}/v1/places`, { cache: "no-store" }),
    "GET /v1/places",
  );
}
export async function apiCreatePlace(input: NewPlaceInput): Promise<Place> {
  return jsonOrThrow(
    await fetch(`${API}/v1/places`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(input),
    }),
    "POST /v1/places",
  );
}
export async function apiUpdatePlace(id: string, patch: Partial<Place>): Promise<Place> {
  return jsonOrThrow(
    await fetch(`${API}/v1/places/${id}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(patch),
    }),
    `PUT /v1/places/${id}`,
  );
}
export async function apiDeletePlace(id: string): Promise<void> {
  const res = await fetch(`${API}/v1/places/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE /v1/places/${id} -> ${res.status}`);
}
/** Public: suggest a spot. Lands in the pending queue for admin approval. */
export type PlaceSubmissionInput = NewPlaceInput & { submittedBy?: string };
export async function apiSubmitPlace(input: PlaceSubmissionInput): Promise<{ ok: boolean; id: string }> {
  return jsonOrThrow(
    await fetch(`${API}/v1/places/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // public - no admin token
      body: JSON.stringify(input),
    }),
    "POST /v1/places/submissions",
  );
}

/** Pending place submissions awaiting moderation (admin). */
export async function apiListPendingPlaces(): Promise<Place[]> {
  return jsonOrThrow(
    await fetch(`${API}/v1/places/submissions`, { cache: "no-store", headers: adminHeaders() }),
    "GET /v1/places/submissions",
  );
}
/** Approve a pending place -> it becomes live. (Reject = apiDeletePlace.) */
export async function apiApprovePlace(id: string): Promise<Place> {
  return jsonOrThrow(
    await fetch(`${API}/v1/places/submissions/${id}/approve`, { method: "POST", headers: adminHeaders() }),
    `POST /v1/places/submissions/${id}/approve`,
  );
}
