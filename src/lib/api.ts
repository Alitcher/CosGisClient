import type { Event, Place } from "@/types";
import { getAdminToken } from "./adminAuth";

/**
 * REST clients for the backend microservices (cosplay-map-server).
 * Each service has its own database and its own public read API:
 *   - events-service (anime-cons-db)     -> http://localhost:8787/v1/events
 *   - places-service (cosplay-places-db) -> http://localhost:8788/v1/places
 * Base URLs + admin token come from env vars, with dev defaults that match the
 * server's local setup.
 */
const EVENTS_API =
  process.env.NEXT_PUBLIC_EVENTS_API_URL || "http://localhost:8787";
const PLACES_API =
  process.env.NEXT_PUBLIC_PLACES_API_URL || "http://localhost:8788";

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

/* ---------------- Events (events-service) ---------------- */

export type NewEventInput = Omit<Event, "id" | "status" | "createdAt">;

export async function apiListEvents(): Promise<Event[]> {
  return jsonOrThrow(
    await fetch(`${EVENTS_API}/v1/events`, { cache: "no-store" }),
    "GET /v1/events",
  );
}
export async function apiCreateEvent(input: NewEventInput): Promise<Event> {
  return jsonOrThrow(
    await fetch(`${EVENTS_API}/v1/events`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(input),
    }),
    "POST /v1/events",
  );
}
export async function apiUpdateEvent(id: string, patch: Partial<Event>): Promise<Event> {
  return jsonOrThrow(
    await fetch(`${EVENTS_API}/v1/events/${id}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(patch),
    }),
    `PUT /v1/events/${id}`,
  );
}
export async function apiDeleteEvent(id: string): Promise<void> {
  const res = await fetch(`${EVENTS_API}/v1/events/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE /v1/events/${id} -> ${res.status}`);
}
/** Public: suggest an event. Lands in the pending queue for admin approval. */
export type EventSubmissionInput = NewEventInput & { submittedBy?: string };
export async function apiSubmitEvent(input: EventSubmissionInput): Promise<{ ok: boolean; id: string }> {
  return jsonOrThrow(
    await fetch(`${EVENTS_API}/v1/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // public - no admin token
      body: JSON.stringify(input),
    }),
    "POST /v1/submissions (events)",
  );
}

/** Pending event submissions awaiting moderation (admin). */
export async function apiListPendingEvents(): Promise<Event[]> {
  return jsonOrThrow(
    await fetch(`${EVENTS_API}/v1/submissions`, { cache: "no-store", headers: adminHeaders() }),
    "GET /v1/submissions (events)",
  );
}
/** Approve a pending event -> it becomes live. (Reject = apiDeleteEvent.) */
export async function apiApproveEvent(id: string): Promise<Event> {
  return jsonOrThrow(
    await fetch(`${EVENTS_API}/v1/submissions/${id}/approve`, { method: "POST", headers: adminHeaders() }),
    `POST /v1/submissions/${id}/approve`,
  );
}

/* ---------------- Places (places-service) ---------------- */

export type NewPlaceInput = Omit<Place, "id" | "status" | "createdAt">;

export async function apiListPlaces(): Promise<Place[]> {
  return jsonOrThrow(
    await fetch(`${PLACES_API}/v1/places`, { cache: "no-store" }),
    "GET /v1/places",
  );
}
export async function apiCreatePlace(input: NewPlaceInput): Promise<Place> {
  return jsonOrThrow(
    await fetch(`${PLACES_API}/v1/places`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(input),
    }),
    "POST /v1/places",
  );
}
export async function apiUpdatePlace(id: string, patch: Partial<Place>): Promise<Place> {
  return jsonOrThrow(
    await fetch(`${PLACES_API}/v1/places/${id}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(patch),
    }),
    `PUT /v1/places/${id}`,
  );
}
export async function apiDeletePlace(id: string): Promise<void> {
  const res = await fetch(`${PLACES_API}/v1/places/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE /v1/places/${id} -> ${res.status}`);
}
/** Public: suggest a spot. Lands in the pending queue for admin approval. */
export type PlaceSubmissionInput = NewPlaceInput & { submittedBy?: string };
export async function apiSubmitPlace(input: PlaceSubmissionInput): Promise<{ ok: boolean; id: string }> {
  return jsonOrThrow(
    await fetch(`${PLACES_API}/v1/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // public - no admin token
      body: JSON.stringify(input),
    }),
    "POST /v1/submissions (places)",
  );
}

/** Pending place submissions awaiting moderation (admin). */
export async function apiListPendingPlaces(): Promise<Place[]> {
  return jsonOrThrow(
    await fetch(`${PLACES_API}/v1/submissions`, { cache: "no-store", headers: adminHeaders() }),
    "GET /v1/submissions (places)",
  );
}
/** Approve a pending place -> it becomes live. (Reject = apiDeletePlace.) */
export async function apiApprovePlace(id: string): Promise<Place> {
  return jsonOrThrow(
    await fetch(`${PLACES_API}/v1/submissions/${id}/approve`, { method: "POST", headers: adminHeaders() }),
    `POST /v1/submissions/${id}/approve`,
  );
}
