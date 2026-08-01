"use client";

import { useState } from "react";
import { apiSubmitEvent } from "@/lib/api";
import AddressAutocomplete from "./AddressAutocomplete";
import type { City } from "@/types";

const REGION_CITIES: City[] = ["Helsinki", "Vantaa", "Espoo"];

/**
 * A "Submit event" button + slide-in form for the public. Submissions land in the
 * pending queue (status: pending) and only appear on the map after an admin
 * approves them in the admin dashboard's Pending tab.
 */
type Form = {
  name: string; venue: string; city: City; date: string; endDate: string;
  lng: string; lat: string; description: string; submittedBy: string;
};
const EMPTY: Form = { name: "", venue: "", city: "Helsinki", date: "", endDate: "", lng: "", lat: "", description: "", submittedBy: "" };

export default function SubmitEventDialog({ className = "btn", label = "＋ Submit an event" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  const [locQuery, setLocQuery] = useState("");
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  function close() { setOpen(false); }
  function start() { setF(EMPTY); setLocQuery(""); setSent(false); setOpen(true); }

  async function submit() {
    if (!f.name.trim() || !f.venue.trim() || !f.date) return alert("Name, venue and start date are required.");
    if (f.endDate && f.endDate < f.date) return alert("End date can't be before the start date.");
    const lng = Number(f.lng), lat = Number(f.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || f.lng === "" || f.lat === "")
      return alert("Please add the location's longitude and latitude.\nTip: right-click a spot in Google Maps to copy its coordinates.");
    setBusy(true);
    try {
      await apiSubmitEvent({
        name: f.name.trim(), venue: f.venue.trim(), city: f.city, date: f.date,
        endDate: f.endDate || undefined,
        lng, lat,
        description: f.description.trim() || undefined,
        submittedBy: f.submittedBy.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      alert(`Couldn't submit.\nIs the API server running? (:8787)\n\n${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className={className} type="button" onClick={start}>{label}</button>

      {open && <div className="overlay" onClick={close} />}
      <aside className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-head">
          <h3>Suggest an event</h3>
          <button className="close-x" type="button" onClick={close}>✕</button>
        </div>

        {sent ? (
          <div className="drawer-body">
            <p style={{ fontSize: 40, margin: "10px 0" }}>🎉</p>
            <h4 style={{ marginBottom: 6 }}>Thanks — it&apos;s submitted!</h4>
            <p className="muted">Your event was sent for review. An admin will approve it before it appears on the map.</p>
            <div className="drawer-foot" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <button className="btn" type="button" onClick={close}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <p className="muted" style={{ marginBottom: 14, fontSize: 13 }}>
                Suggest an anime convention. It&apos;s reviewed by an admin before going live.
              </p>
              <div className="field"><label>Event name *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Tracon Hel" /></div>
              <div className="field"><label>Venue *</label><input value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Messukeskus" /></div>
              <div className="field-row">
                <div className="field"><label>City</label><select value={f.city} onChange={(e) => set("city", e.target.value as City)}><option>Helsinki</option><option>Vantaa</option><option>Espoo</option></select></div>
                <div className="field"><label>Start date *</label><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></div>
              </div>
              <div className="field"><label>End date (optional — multi-day)</label><input type="date" value={f.endDate} min={f.date || undefined} onChange={(e) => set("endDate", e.target.value)} /></div>
              <div className="field">
                <label>Location *</label>
                <AddressAutocomplete
                  value={locQuery}
                  onChange={setLocQuery}
                  onSelect={(r) => {
                    set("lng", String(r.lng));
                    set("lat", String(r.lat));
                    if (r.city && REGION_CITIES.includes(r.city as City)) set("city", r.city as City);
                  }}
                  placeholder="Search a venue, address or postcode"
                />
              </div>
              <div className="field-row">
                <div className="field"><label>Longitude *</label><input value={f.lng} onChange={(e) => set("lng", e.target.value)} placeholder="24.9354" /></div>
                <div className="field"><label>Latitude *</label><input value={f.lat} onChange={(e) => set("lat", e.target.value)} placeholder="60.2012" /></div>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>📍 Pick from the search list above and these fill in automatically.</p>
              <div className="field"><label>Description</label><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What is the event about?" /></div>
              <div className="field"><label>Your name (optional)</label><input value={f.submittedBy} onChange={(e) => set("submittedBy", e.target.value)} placeholder="So we can credit you" /></div>
            </div>
            <div className="drawer-foot">
              <button className="btn ghost" type="button" onClick={close}>Cancel</button>
              <button className="btn" type="button" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "📨 Submit for review"}</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
