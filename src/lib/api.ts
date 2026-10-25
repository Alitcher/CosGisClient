import type { Event, Place, TransitStop } from "@/types";
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
/**
 * An event or spot picture through the server relay (/v1/img), so a canvas may draw it and
 * still save a PNG (most picture sites send no CORS headers). Server: image.controller.ts.
 */
export const imageRelayUrl = (src: string) => `${API}/v1/img?url=${encodeURIComponent(src)}`;

/**
 * Local admin only (API on localhost): where saves go. "local" = this computer only,
 * "both" = this computer + the live site (the server mirrors writes to production, see
 * server repositories/mirror.ts). Remembered in this browser; default "local".
 */
export type WriteTarget = "local" | "both";
export const apiIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API);
const WRITE_TARGET_KEY = "adminWriteTarget";
export function getWriteTarget(): WriteTarget {
  try { return localStorage.getItem(WRITE_TARGET_KEY) === "both" ? "both" : "local"; } catch { return "local"; }
}
export function setWriteTarget(target: WriteTarget): void {
  try { localStorage.setItem(WRITE_TARGET_KEY, target); } catch { /* storage blocked: stays "local" */ }
}

/** While set, admin writes are one action in Admin > History (see asOneAction). */
let historyAction: { group: string; label: string } | null = null;

function adminHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAdminToken()}`,
    ...(historyAction ? { "X-History-Group": historyAction.group, "X-History-Label": encodeURIComponent(historyAction.label) } : {}),
    ...(apiIsLocal ? { "X-Write-Target": getWriteTarget() } : {}),
  };
}

/**
 * Run several admin writes as ONE line in Admin > History (one undo), e.g. a combine or
 * "Approve all". Without it every request is its own line.
 */
export async function asOneAction<T>(label: string, fn: () => Promise<T>): Promise<T> {
  historyAction = { group: crypto.randomUUID(), label: label.slice(0, 200) };
  try {
    return await fn();
  } finally {
    historyAction = null;
  }
}

/* ---------------- Admin history (api-service /v1/admin/history) ---------------- */

/** One admin action and the rows it changed (newest first from the API). */
export type HistoryGroup = {
  group: string; at: string; actor: string; label: string; undone: boolean;
  rows: { table: "events" | "places"; id: string; name: string; change: "created" | "edited" | "deleted" }[];
};
export async function apiListHistory(limit = 100): Promise<HistoryGroup[]> {
  return jsonOrThrow(await fetch(`${API}/v1/admin/history?limit=${limit}`, { headers: adminHeaders() }), "GET /v1/admin/history");
}
/** undo / redo one action, or jump: make the data look like right after it. 409 = later changes touch the same rows. */
export async function apiHistoryAction(group: string, action: "undo" | "redo" | "jump"): Promise<void> {
  const res = await fetch(`${API}/v1/admin/history/${encodeURIComponent(group)}/${action}`, { method: "POST", headers: adminHeaders() });
  if (res.ok) return;
  // The server explains a refusal, e.g. which later changes are in the way.
  const body = (await res.json().catch(() => null)) as { error?: string; conflicts?: string[] } | null;
  const why = [body?.error, body?.conflicts?.length ? `In the way: ${body.conflicts.join(", ")}` : ""].filter(Boolean).join("\n");
  throw new ApiError(why || `POST /v1/admin/history/${action} -> ${res.status}`, res.status);
}

/** A failed API call; `status` is the HTTP status (409 = duplicate submission). */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function jsonOrThrow<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) throw new ApiError(`${what} -> ${res.status}`, res.status);
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
// `transit` is admin-only; the server drops it from submissions.
export type EventSubmissionInput = Omit<NewEventInput, "transit"> & { submittedBy?: string };
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

/** Summary returned by an event import (conit.fi / Oulu also send lists of unresolved rows). */
export type SyncResult = {
  skipped?: "fresh";
  fetched: number;
  created: number;
  duplicates: number;
  series?: number; // Linked Events: repeating meetups imported or refreshed as one community event
  ignored: number;
  lastModified?: string | null;
};

/** Event import feeds the admin can run by hand (server routes /v1/events/sync/<route>). */
export const IMPORT_SOURCES = [
  { route: "linkedevents", label: "Helsinki (Linked Events)" },
  { route: "linkedevents-espoo", label: "Espoo (Linked Events)" },
  { route: "conit", label: "conit.fi (Finnish conventions)" },
  { route: "oulucomics", label: "Oulu Comics Center" },
] as const;
export type ImportRoute = (typeof IMPORT_SOURCES)[number]["route"];

/** Admin: run one import feed now (force=1 skips its 12h freshness guard). New events land as pending. */
export async function apiSyncSource(route: ImportRoute): Promise<SyncResult> {
  return jsonOrThrow(
    await fetch(`${API}/v1/events/sync/${route}?force=1`, { method: "POST", headers: adminHeaders() }),
    `POST /v1/events/sync/${route}`,
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
// `youthFriendly` is admin-only; the server drops it from submissions.
export type PlaceSubmissionInput = Omit<NewPlaceInput, "youthFriendly" | "transit"> & { submittedBy?: string };
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

/* ---------------- Transit (admin) ---------------- */

/** Nearest metro/train/tram/bus stops around a point (Digitransit in Finland, else OpenStreetMap). Only a
 *  suggestion: nothing is saved until the event/place itself is saved. */
export async function apiLookupTransit(lat: number, lng: number): Promise<TransitStop[]> {
  const r = await jsonOrThrow<{ transit: TransitStop[] }>(
    await fetch(`${API}/v1/admin/transit/lookup`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ lat, lng }) }),
    "POST /v1/admin/transit/lookup",
  );
  return r.transit;
}
