"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useEventStore } from "@/lib/eventsStore";
import { usePlaceStore } from "@/lib/placesStore";
import { fmtRange, placeTypeLabel } from "@/lib/data";
import { cityLabel } from "@/lib/cities";
import { useCityFromCoords } from "@/lib/useCityFromCoords";
import CitySelect from "./CitySelect";
import EventThumb from "./EventThumb";
import {
  apiListPendingEvents,
  apiListPendingPlaces,
  apiApproveEvent,
  apiApprovePlace,
  apiDeleteEvent,
  apiDeletePlace,
  apiSyncLinkedEvents,
} from "@/lib/api";
import { isPracticeType, FACILITIES, type Event, type Place, type City, type Status, type PlaceType, type Booking, type Price, type Facility } from "@/types";

type Tab = "events" | "spots" | "pending";

/** A row in the Pending tab — either a pending event or a pending place. Keeps
 *  the full record so the admin can open it in the edit drawer before approving. */
type PendingItem = { id: string; name: string; meta: string; lng: number; lat: number } & (
  | { kind: "event"; event: Event }
  | { kind: "place"; place: Place }
);

type EventForm = {
  id: string | null;
  name: string; venue: string; city: City; date: string; endDate: string;
  startTime: string; endTime: string;
  lng: string; lat: string; description: string; url: string; image: string; status: Status;
};
type PlaceForm = {
  id: string | null;
  name: string; type: PlaceType; city: City; address: string;
  lng: string; lat: string; themes: string; photo: string;
  description: string; openingHours: string; status: Status;
  // practice places only
  booking: Booking | ""; price: Price | ""; priceNote: string; facilities: Facility[];
  youthFriendly: "" | "yes" | "no"; bookingUrl: string;
};

const EMPTY_EVENT: EventForm = { id: null, name: "", venue: "", city: "Helsinki", date: "", endDate: "", startTime: "", endTime: "", lng: "", lat: "", description: "", url: "", image: "", status: "live" };
const EMPTY_PLACE: PlaceForm = { id: null, name: "", type: "cafe", city: "Helsinki", address: "", lng: "", lat: "", themes: "", photo: "", description: "", openingHours: "", status: "live", booking: "", price: "", priceNote: "", facilities: [], youthFriendly: "", bookingUrl: "" };

function fail(action: string, err: unknown) {
  alert(`Couldn't ${action}.\nIs the API server running? (:8787)\n\n${(err as Error).message}`);
}

export default function AdminDashboard() {
  const { events, addEvent, updateEvent, deleteEvent, refreshEvents } = useEventStore();
  const { places, addPlace, updatePlace, deletePlace, refreshPlaces } = usePlaceStore();

  const [tab, setTab] = useState<Tab>("events");
  const [open, setOpen] = useState(false);
  const [drawerKind, setDrawerKind] = useState<Exclude<Tab, "pending">>("events");
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);
  const [placeForm, setPlaceForm] = useState<PlaceForm>(EMPTY_PLACE);
  const [query, setQuery] = useState("");

  // ---- pending moderation state ----
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const keyOf = (it: PendingItem) => `${it.kind}:${it.id}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Load pending on mount (for the tab badge count) and whenever the tab opens.
  // Fails silently — like the live stores — so an offline server doesn't spam alerts.
  async function loadPending() {
    try {
      const [ev, pl] = await Promise.all([apiListPendingEvents(), apiListPendingPlaces()]);
      setPendingItems([
        ...ev.map((e): PendingItem => ({
          kind: "event", event: e, id: e.id, name: e.name, lng: e.lng, lat: e.lat,
          meta: `📍 ${[e.venue, e.city].filter(Boolean).join(", ")} · ${fmtRange(e.date, e.endDate)}`,
        })),
        ...pl.map((p): PendingItem => ({
          kind: "place", place: p, id: p.id, name: p.name, lng: p.lng, lat: p.lat,
          meta: `📍 ${p.address ?? p.city} · ${placeTypeLabel[p.type]}`,
        })),
      ]);
      setSelected(new Set());
    } catch (err) {
      console.error("loadPending failed", err);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPending(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === "pending") loadPending(); }, [tab]);

  function toggleSelect(k: string) {
    setSelected((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  }
  function toggleAll() {
    setSelected((s) => (s.size === pendingItems.length ? new Set() : new Set(pendingItems.map(keyOf))));
  }

  // Run approve/reject over a batch, then refresh pending + live lists (so approved
  // items appear on the map and the queue shrinks).
  async function runOnItems(items: PendingItem[], action: "approve" | "reject") {
    if (items.length === 0) return;
    setBusy(true);
    try {
      for (const it of items) {
        if (action === "approve") {
          if (it.kind === "event") await apiApproveEvent(it.id); else await apiApprovePlace(it.id);
        } else {
          if (it.kind === "event") await apiDeleteEvent(it.id); else await apiDeletePlace(it.id);
        }
      }
      await Promise.all([loadPending(), refreshEvents(), refreshPlaces()]);
    } catch (err) {
      fail(action === "approve" ? "approve the request(s)" : "reject the request(s)", err);
    } finally {
      setBusy(false);
    }
  }
  // Import cosplay/manga events from Helsinki's Linked Events API into the pending
  // queue (server: api-service services/linkedevents.ts). Same thing the daily cron
  // does; this is the on-demand admin button.
  async function runImport() {
    setBusy(true);
    try {
      const r = await apiSyncLinkedEvents(); // force=true: bypass the 12h freshness guard
      await loadPending();
      alert(
        r.skipped
          ? "Already up to date — nothing new from Helsinki right now."
          : `Imported ${r.created} new event(s) from Helsinki (fetched ${r.fetched}, ${r.duplicates} already had).\nThey're in the pending queue below for approval.`,
      );
    } catch (err) {
      fail("import from Helsinki", err);
    } finally {
      setBusy(false);
    }
  }

  const selectedItems = () => pendingItems.filter((it) => selected.has(keyOf(it)));
  const approveOne = (it: PendingItem) => runOnItems([it], "approve");
  const rejectOne = (it: PendingItem) => { if (confirm(`Reject "${it.name}"? This deletes the submission.`)) runOnItems([it], "reject"); };
  const approveSelected = () => runOnItems(selectedItems(), "approve");
  const rejectSelected = () => { const items = selectedItems(); if (items.length && confirm(`Reject ${items.length} selected? This deletes them.`)) runOnItems(items, "reject"); };
  const approveAll = () => runOnItems(pendingItems, "approve");
  const rejectAll = () => { if (pendingItems.length && confirm(`Reject ALL ${pendingItems.length} pending? This deletes them.`)) runOnItems(pendingItems, "reject"); };

  // ---- open drawer ----
  function addNew() {
    if (tab === "events") setEventForm(EMPTY_EVENT);
    else setPlaceForm(EMPTY_PLACE);
    setDrawerKind(tab === "spots" ? "spots" : "events");
    setOpen(true);
  }
  function editEvent(e: Event) {
    setEventForm({ id: e.id, name: e.name, venue: e.venue, city: e.city, date: e.date, endDate: e.endDate ?? "", startTime: e.startTime ?? "", endTime: e.endTime ?? "", lng: String(e.lng), lat: String(e.lat), description: e.description ?? "", url: e.url ?? "", image: e.image ?? "", status: e.status });
    setDrawerKind("events");
    setOpen(true);
  }
  function editPlace(p: Place) {
    setPlaceForm({ id: p.id, name: p.name, type: p.type, city: p.city, address: p.address ?? "", lng: String(p.lng), lat: String(p.lat), themes: p.themes.join(", "), photo: p.photos[0]?.url ?? "", description: p.description ?? "", openingHours: p.openingHours ?? "", status: p.status,
      booking: p.booking ?? "", price: p.price ?? "", priceNote: p.priceNote ?? "", facilities: p.facilities ?? [],
      youthFriendly: p.youthFriendly == null ? "" : p.youthFriendly ? "yes" : "no", bookingUrl: p.bookingUrl ?? "" });
    setDrawerKind("spots");
    setOpen(true);
  }
  const editPending = (it: PendingItem) => (it.kind === "event" ? editEvent(it.event) : editPlace(it.place));
  // A pending item keeps "Pending" as an option in the drawer, so an admin can fix a
  // submission and leave it in the queue, or set it Live to approve in one go.
  const isPendingId = (id: string | null) => !!id && pendingItems.some((it) => it.id === id);

  // ---- save ----
  async function saveEvent() {
    const f = eventForm;
    if (!f.name.trim() || !f.venue.trim() || !f.date) return alert("Name, venue and start date are required.");
    if (f.endDate && f.endDate < f.date) return alert("End date can't be before the start date.");
    if (!f.endDate && f.startTime && f.endTime && f.endTime < f.startTime) return alert("End time can't be before the start time on a one-day event.");
    const data = {
      name: f.name.trim(), venue: f.venue.trim(), city: f.city, date: f.date, lng: Number(f.lng) || 0, lat: Number(f.lat) || 0, description: f.description.trim(),
      ...(f.endDate ? { endDate: f.endDate } : {}), ...(f.startTime ? { startTime: f.startTime } : {}), ...(f.endTime ? { endTime: f.endTime } : {}),
      ...(f.url.trim() ? { url: f.url.trim() } : {}), ...(f.image.trim() ? { image: f.image.trim() } : {}),
    };
    try {
      if (f.id) await updateEvent(f.id, { ...data, status: f.status });
      else await addEvent(data);
      if (isPendingId(f.id)) await loadPending();
      setOpen(false);
    } catch (err) { fail("save the event", err); }
  }
  async function savePlace() {
    const f = placeForm;
    if (!f.name.trim()) return alert("Name is required.");
    const data = {
      name: f.name.trim(), type: f.type, city: f.city, address: f.address.trim(),
      lng: Number(f.lng) || 0, lat: Number(f.lat) || 0,
      themes: f.themes.split(",").map((t) => t.trim()).filter(Boolean),
      photos: f.photo.trim() ? [{ url: f.photo.trim() }] : [],
      description: f.description.trim(), openingHours: f.openingHours.trim(),
      // Empty selects are sent as "not given" (undefined), so the API leaves the saved value as is.
      ...(isPracticeType(f.type) && {
        booking: f.booking || undefined,
        price: f.price || undefined,
        priceNote: f.priceNote.trim(),
        facilities: f.facilities,
        youthFriendly: f.youthFriendly === "" ? undefined : f.youthFriendly === "yes",
        bookingUrl: f.bookingUrl.trim() || undefined,
      }),
    };
    try {
      if (f.id) await updatePlace(f.id, { ...data, status: f.status });
      else await addPlace(data);
      if (isPendingId(f.id)) await loadPending();
      setOpen(false);
    } catch (err) { fail("save the spot", err); }
  }

  // ---- stats ----
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const eventsThisMonth = events.filter((e) => e.date.startsWith(monthPrefix)).length;

  const eq = query.toLowerCase();
  const visEvents = events.filter((e) => e.name.toLowerCase().includes(eq) || e.venue.toLowerCase().includes(eq));
  const visPlaces = places.filter((p) => p.name.toLowerCase().includes(eq) || (p.address ?? "").toLowerCase().includes(eq));

  const setE = <K extends keyof EventForm>(k: K, v: EventForm[K]) => setEventForm((f) => ({ ...f, [k]: v }));
  const setP = <K extends keyof PlaceForm>(k: K, v: PlaceForm[K]) => setPlaceForm((f) => ({ ...f, [k]: v }));
  // City follows the coordinates (see useCityFromCoords); still editable by hand.
  const eventCityDetect = useCityFromCoords(eventForm.lng, eventForm.lat, (c) => setE("city", c));
  const placeCityDetect = useCityFromCoords(placeForm.lng, placeForm.lat, (c) => setP("city", c));

  const danger = { color: "#e5484d" } as const;
  const allChecked = pendingItems.length > 0 && selected.size === pendingItems.length;

  return (
    <>
      <nav className="nav">
        <div className="nav-inner admin-bar">
          <Link className="brand" href="/">
            <span className="brand-logo">⛩️</span>
            <span className="brand-text">CosoraAtlas<small>Admin panel</small></span>
          </Link>
          <span className="admin-badge">🔒 ADMIN</span>
          <div className="admin-right">
            <Link className="view-site" href="/">↗ View site</Link>
            <ThemeToggle />
            <div className="who"><span className="avatar">🦊</span><span className="hide-sm">admin</span></div>
          </div>
        </div>
      </nav>

      <div className="admin-shell">
        <div className="admin-head">
          <div>
            <h1>{tab === "pending" ? "Pending requests ⏳" : `Manage ${tab === "events" ? "events" : "spots"} ✏️`}</h1>
            <p>{tab === "pending"
              ? "Approve or reject community submissions and imported events. Approved items go live on the map."
              : `Add, edit and remove ${tab === "events" ? "conventions" : "cosplay-friendly places"}. Saved to the server database.`}</p>
          </div>
          {tab !== "pending" && <button className="btn" type="button" onClick={addNew}>＋ Add {tab === "events" ? "event" : "spot"}</button>}
        </div>

        {/* tab switch */}
        <div className="view-switch" style={{ margin: "0 0 18px", display: "inline-flex" }}>
          <button className={tab === "events" ? "on" : ""} type="button" onClick={() => setTab("events")}>🎌 Events</button>
          <button className={tab === "spots" ? "on" : ""} type="button" onClick={() => setTab("spots")}>📸 Spots</button>
          <button className={tab === "pending" ? "on" : ""} type="button" onClick={() => setTab("pending")}>⏳ Pending{pendingItems.length ? ` (${pendingItems.length})` : ""}</button>
        </div>

        {tab !== "pending" && (
          <div className="grid stats">
            {tab === "events" ? (
              <>
                <div className="card stat-card"><span className="ic">🎌</span><span className="n">{events.length}</span><span className="l">Total events</span></div>
                <div className="card stat-card"><span className="ic">🗓️</span><span className="n">{eventsThisMonth}</span><span className="l">This month</span></div>
                <div className="card stat-card"><span className="ic">📍</span><span className="n">{new Set(events.map((e) => e.venue)).size}</span><span className="l">Venues</span></div>
                <div className="card stat-card"><span className="ic">🏙️</span><span className="n">{new Set(events.map((e) => e.city)).size}</span><span className="l">Cities</span></div>
              </>
            ) : (
              <>
                <div className="card stat-card"><span className="ic">📸</span><span className="n">{places.length}</span><span className="l">Total spots</span></div>
                <div className="card stat-card"><span className="ic">☕</span><span className="n">{places.filter((p) => p.type === "cafe").length}</span><span className="l">Cafés</span></div>
                <div className="card stat-card"><span className="ic">🍜</span><span className="n">{places.filter((p) => p.type === "restaurant").length}</span><span className="l">Restaurants</span></div>
                <div className="card stat-card"><span className="ic">🏙️</span><span className="n">{new Set(places.map((p) => p.city)).size}</span><span className="l">Cities</span></div>
              </>
            )}
          </div>
        )}

        {tab !== "pending" && (
          <div className="a-toolbar">
            <div className="a-search">🔍 <input placeholder={`Search ${tab}…`} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          </div>
        )}

        {/* EVENTS table */}
        {tab === "events" && (
          <div className="card table-card">
            <table>
              <thead><tr><th>Event</th><th className="hide-sm">Venue</th><th className="hide-sm">Date</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {visEvents.map((e) => {
                  return (
                    <tr key={e.id}>
                      <td><div className="ev-name-cell"><EventThumb event={e} size={36} /><div><div className="ev-name">{e.name}</div><div className="ev-sub">{cityLabel(e.city)}</div></div></div></td>
                      <td className="hide-sm">{e.venue}</td>
                      <td className="hide-sm">{fmtRange(e.date, e.endDate)}</td>
                      <td><span className={`status ${e.status}`}>{e.status === "live" ? "● Live" : e.status === "draft" ? "◌ Draft" : "⏳ Pending"}</span></td>
                      <td><div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <a className="mini-btn" href={`/map?lng=${e.lng}&lat=${e.lat}&z=16`} target="_blank" rel="noopener noreferrer" title="Show on map">🗺️</a>
                        <button className="mini-btn" type="button" title="Edit" onClick={() => editEvent(e)}>✏️</button>
                        <button className="mini-btn del" type="button" title="Delete" onClick={async () => { try { await deleteEvent(e.id); } catch (err) { fail("delete the event", err); } }}>🗑️</button>
                      </div></td>
                    </tr>
                  );
                })}
                {visEvents.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-2)" }}>No events.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* SPOTS table */}
        {tab === "spots" && (
          <div className="card table-card">
            <table>
              <thead><tr><th>Spot</th><th className="hide-sm">Type</th><th className="hide-sm">City</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {visPlaces.map((p) => (
                  <tr key={p.id}>
                    <td><div className="ev-name">{p.name}</div><div className="ev-sub">{p.address ?? p.city}</div></td>
                    <td className="hide-sm">{placeTypeLabel[p.type]}</td>
                    <td className="hide-sm">{cityLabel(p.city)}</td>
                    <td><span className={`status ${p.status}`}>{p.status === "live" ? "● Live" : p.status === "draft" ? "◌ Draft" : "⏳ Pending"}</span></td>
                    <td><div className="row-actions" style={{ justifyContent: "flex-end" }}>
                      <a className="mini-btn" href={`/map?lng=${p.lng}&lat=${p.lat}&z=16`} target="_blank" rel="noopener noreferrer" title="Show on map">🗺️</a>
                      <button className="mini-btn" type="button" title="Edit" onClick={() => editPlace(p)}>✏️</button>
                      <button className="mini-btn del" type="button" title="Delete" onClick={async () => { try { await deletePlace(p.id); } catch (err) { fail("delete the spot", err); } }}>🗑️</button>
                    </div></td>
                  </tr>
                ))}
                {visPlaces.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-2)" }}>No spots.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* PENDING moderation */}
        {tab === "pending" && (
          <div className="card table-card">
            <div className="a-toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--border, #2a2a35)" }}>
              <span style={{ color: "var(--text-2)" }}>{pendingItems.length} pending · {selected.size} selected</span>
              <button className="btn ghost" type="button" disabled={busy} title="Fetch cosplay/manga events from Helsinki's open data into the queue" onClick={runImport}>🔄 Import from Helsinki</button>
              <div style={{ flex: 1 }} />
              <button className="btn ghost" type="button" disabled={busy || selected.size === 0} onClick={approveSelected}>✓ Approve selected</button>
              <button className="btn ghost" type="button" style={danger} disabled={busy || selected.size === 0} onClick={rejectSelected}>✕ Reject selected</button>
              <button className="btn" type="button" disabled={busy || pendingItems.length === 0} onClick={approveAll}>✓✓ Approve all</button>
              <button className="btn ghost" type="button" style={danger} disabled={busy || pendingItems.length === 0} onClick={rejectAll}>🗑️ Reject all</button>
            </div>
            <table>
              <thead><tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" /></th>
                <th>Name</th><th className="hide-sm">Kind</th><th className="hide-sm">Details</th><th style={{ textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>
                {pendingItems.map((it) => {
                  const k = keyOf(it);
                  return (
                    <tr key={k}>
                      <td><input type="checkbox" checked={selected.has(k)} onChange={() => toggleSelect(k)} aria-label={`Select ${it.name}`} /></td>
                      <td><div className="ev-name">{it.name}</div><div className="ev-sub">{it.kind === "event" ? "🎌 event" : "📸 spot"}</div></td>
                      <td className="hide-sm">{it.kind === "event" ? "Event" : "Spot"}</td>
                      <td className="hide-sm">{it.meta}</td>
                      <td><div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <a className="mini-btn" href={`/map?lng=${it.lng}&lat=${it.lat}&z=16`} target="_blank" rel="noopener noreferrer" title="Show on map">🗺️</a>
                        <button className="mini-btn" type="button" title="Edit" disabled={busy} onClick={() => editPending(it)}>✏️</button>
                        <button className="mini-btn" type="button" title="Approve" disabled={busy} onClick={() => approveOne(it)}>✓</button>
                        <button className="mini-btn del" type="button" title="Reject" disabled={busy} onClick={() => rejectOne(it)}>✕</button>
                      </div></td>
                    </tr>
                  );
                })}
                {pendingItems.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-2)" }}>🎉 No pending requests.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-head">
          <h3>{drawerKind === "events" ? (eventForm.id ? "Edit event" : "Add event") : (placeForm.id ? "Edit spot" : "Add spot")}</h3>
          <button className="close-x" type="button" onClick={() => setOpen(false)}>✕</button>
        </div>

        {drawerKind === "events" ? (
          <>
            <div className="drawer-body">
              <div className="field"><label>Event name</label><input value={eventForm.name} onChange={(e) => setE("name", e.target.value)} placeholder="e.g. Tracon Hel" /></div>
              <div className="field"><label>Venue</label><input value={eventForm.venue} onChange={(e) => setE("venue", e.target.value)} placeholder="e.g. Messukeskus" /></div>
              <div className="field-row">
                <div className="field"><label>Start date</label><input type="date" value={eventForm.date} onChange={(e) => setE("date", e.target.value)} /></div>
                <div className="field"><label>End date (optional)</label><input type="date" value={eventForm.endDate} min={eventForm.date || undefined} onChange={(e) => setE("endDate", e.target.value)} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>Start time (optional)</label><input type="time" value={eventForm.startTime} onChange={(e) => setE("startTime", e.target.value)} /></div>
                <div className="field"><label>End time (optional)</label><input type="time" value={eventForm.endTime} onChange={(e) => setE("endTime", e.target.value)} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>Longitude</label><input value={eventForm.lng} onChange={(e) => setE("lng", e.target.value)} placeholder="24.9354" /></div>
                <div className="field"><label>Latitude</label><input value={eventForm.lat} onChange={(e) => setE("lat", e.target.value)} placeholder="60.2012" /></div>
              </div>
              <CitySelect value={eventForm.city} onChange={(c) => setE("city", c)} detect={eventCityDetect} />
              <div className="field"><label>Description</label><textarea rows={3} value={eventForm.description} onChange={(e) => setE("description", e.target.value)} /></div>
              <div className="field"><label>Link (optional)</label><input type="url" value={eventForm.url} onChange={(e) => setE("url", e.target.value)} placeholder="https://… event page" /></div>
              <div className="field">
                <label>Thumbnail / logo URL (optional)</label>
                <div className="thumb-input">
                  <EventThumb event={{ name: eventForm.name, image: eventForm.image.trim() || undefined }} size={44} />
                  <input type="url" value={eventForm.image} onChange={(e) => setE("image", e.target.value)} placeholder="https://… .png / .jpg" />
                </div>
              </div>
              {eventForm.id && (
                <div className="field"><label>Status</label><select value={eventForm.status} onChange={(e) => setE("status", e.target.value as Status)}>{isPendingId(eventForm.id) && <option value="pending">Pending (keep in queue)</option>}<option value="live">Live</option><option value="draft">Draft</option></select></div>
              )}
            </div>
            <div className="drawer-foot">
              <button className="btn ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn" type="button" onClick={saveEvent}>💾 Save event</button>
            </div>
          </>
        ) : (
          <>
            <div className="drawer-body">
              <div className="field"><label>Spot name</label><input value={placeForm.name} onChange={(e) => setP("name", e.target.value)} placeholder="e.g. Café Sakura" /></div>
              <div className="field"><label>Type</label><select value={placeForm.type} onChange={(e) => setP("type", e.target.value as PlaceType)}><optgroup label="Photo spots (Spots tab)"><option value="cafe">Café</option><option value="restaurant">Restaurant</option><option value="mall">Mall</option><option value="studio">Photo studio</option><option value="outdoor">Outdoor / Park</option></optgroup><optgroup label="Practice places (Practice tab)"><option value="dance-studio">Dance studio</option><option value="practice-space">Practice space (hall, youth centre)</option></optgroup></select></div>
              <div className="field"><label>Address</label><input value={placeForm.address} onChange={(e) => setP("address", e.target.value)} placeholder="Street, City" /></div>
              <div className="field-row">
                <div className="field"><label>Longitude</label><input value={placeForm.lng} onChange={(e) => setP("lng", e.target.value)} placeholder="24.9402" /></div>
                <div className="field"><label>Latitude</label><input value={placeForm.lat} onChange={(e) => setP("lat", e.target.value)} placeholder="60.1641" /></div>
              </div>
              <CitySelect value={placeForm.city} onChange={(c) => setP("city", c)} detect={placeCityDetect} />
              <div className="field"><label>Themes (comma-separated)</label><input value={placeForm.themes} onChange={(e) => setP("themes", e.target.value)} placeholder="pastel, kawaii, neon" /></div>
              <div className="field"><label>Photo URL</label><input value={placeForm.photo} onChange={(e) => setP("photo", e.target.value)} placeholder="https://…" /></div>
              <div className="field"><label>Opening hours</label><input value={placeForm.openingHours} onChange={(e) => setP("openingHours", e.target.value)} placeholder="10:00–20:00" /></div>
              <div className="field"><label>Description</label><textarea rows={3} value={placeForm.description} onChange={(e) => setP("description", e.target.value)} /></div>
              {isPracticeType(placeForm.type) && (
                <>
                  <div className="field-row">
                    <div className="field"><label>Access</label><select value={placeForm.booking} onChange={(e) => setP("booking", e.target.value as PlaceForm["booking"])}><option value="">—</option><option value="drop-in">Drop-in</option><option value="booking-required">Booking needed</option><option value="classes-only">Classes only</option></select></div>
                    <div className="field"><label>Price</label><select value={placeForm.price} onChange={(e) => setP("price", e.target.value as PlaceForm["price"])}><option value="">—</option><option value="free">Free</option><option value="paid">Paid</option></select></div>
                  </div>
                  <div className="field"><label>Price details</label><input value={placeForm.priceNote} onChange={(e) => setP("priceNote", e.target.value)} placeholder="15 €/h, free for under 18s" /></div>
                  <div className="field">
                    <label>Facilities</label>
                    <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                      {FACILITIES.map((x) => (
                        <label key={x} style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 400 }}>
                          <input type="checkbox" checked={placeForm.facilities.includes(x)} onChange={() => setP("facilities", placeForm.facilities.includes(x) ? placeForm.facilities.filter((y) => y !== x) : [...placeForm.facilities, x])} /> {x}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="field"><label>Under-18s welcome? (check the venue&apos;s own rules)</label><select value={placeForm.youthFriendly} onChange={(e) => setP("youthFriendly", e.target.value as PlaceForm["youthFriendly"])}><option value="">Not verified</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                  <div className="field"><label>Booking / info link</label><input value={placeForm.bookingUrl} onChange={(e) => setP("bookingUrl", e.target.value)} placeholder="https://…" /></div>
                </>
              )}
              {placeForm.id && (
                <div className="field"><label>Status</label><select value={placeForm.status} onChange={(e) => setP("status", e.target.value as Status)}>{isPendingId(placeForm.id) && <option value="pending">Pending (keep in queue)</option>}<option value="live">Live</option><option value="draft">Draft</option></select></div>
              )}
            </div>
            <div className="drawer-foot">
              <button className="btn ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn" type="button" onClick={savePlace}>💾 Save spot</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
