"use client";

import { useState } from "react";
import { apiSubmitPlace } from "@/lib/api";
import AddressAutocomplete from "./AddressAutocomplete";
import type { City, PlaceType } from "@/types";

const REGION_CITIES: City[] = ["Helsinki", "Vantaa", "Espoo"];

/**
 * A "Submit spot" button + slide-in form for the public. Submissions land in the
 * pending queue (status: pending) and only appear on the map after an admin
 * approves them in the admin dashboard's Pending tab.
 */
type Form = {
  name: string; type: PlaceType; city: City; address: string;
  lng: string; lat: string; themes: string; photo: string;
  description: string; openingHours: string; submittedBy: string;
};
const EMPTY: Form = { name: "", type: "cafe", city: "Helsinki", address: "", lng: "", lat: "", themes: "", photo: "", description: "", openingHours: "", submittedBy: "" };

export default function SubmitSpotDialog({ className = "btn", label = "＋ Submit a spot" }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  function close() { setOpen(false); }
  function start() { setF(EMPTY); setSent(false); setOpen(true); }

  async function submit() {
    if (!f.name.trim()) return alert("Spot name is required.");
    const lng = Number(f.lng), lat = Number(f.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || f.lng === "" || f.lat === "")
      return alert("Please add the spot's longitude and latitude.\nTip: right-click a spot in Google Maps to copy its coordinates.");
    setBusy(true);
    try {
      await apiSubmitPlace({
        name: f.name.trim(), type: f.type, city: f.city,
        address: f.address.trim() || undefined,
        lng, lat,
        themes: f.themes.split(",").map((t) => t.trim()).filter(Boolean),
        photos: f.photo.trim() ? [{ url: f.photo.trim() }] : [],
        description: f.description.trim() || undefined,
        openingHours: f.openingHours.trim() || undefined,
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
          <h3>Suggest a spot</h3>
          <button className="close-x" type="button" onClick={close}>✕</button>
        </div>

        {sent ? (
          <div className="drawer-body">
            <p style={{ fontSize: 40, margin: "10px 0" }}>🎉</p>
            <h4 style={{ marginBottom: 6 }}>Thanks — it&apos;s submitted!</h4>
            <p className="muted">Your spot was sent for review. An admin will approve it before it appears on the map.</p>
            <div className="drawer-foot" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <button className="btn" type="button" onClick={close}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <p className="muted" style={{ marginBottom: 14, fontSize: 13 }}>
                Suggest a cosplay-friendly place. It&apos;s reviewed by an admin before going live.
              </p>
              <div className="field"><label>Spot name *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Café Sakura" /></div>
              <div className="field-row">
                <div className="field"><label>Type</label><select value={f.type} onChange={(e) => set("type", e.target.value as PlaceType)}><option value="cafe">Café</option><option value="restaurant">Restaurant</option><option value="mall">Mall</option><option value="studio">Studio</option><option value="outdoor">Outdoor / Park</option></select></div>
                <div className="field"><label>City</label><select value={f.city} onChange={(e) => set("city", e.target.value as City)}><option>Helsinki</option><option>Vantaa</option><option>Espoo</option></select></div>
              </div>
              <div className="field">
                <label>Address *</label>
                <AddressAutocomplete
                  value={f.address}
                  onChange={(v) => set("address", v)}
                  onSelect={(r) => {
                    set("address", r.label);
                    set("lng", String(r.lng));
                    set("lat", String(r.lat));
                    if (r.city && REGION_CITIES.includes(r.city as City)) set("city", r.city as City);
                  }}
                  placeholder="Search an address, place or postcode"
                />
              </div>
              <div className="field-row">
                <div className="field"><label>Longitude *</label><input value={f.lng} onChange={(e) => set("lng", e.target.value)} placeholder="24.9402" /></div>
                <div className="field"><label>Latitude *</label><input value={f.lat} onChange={(e) => set("lat", e.target.value)} placeholder="60.1641" /></div>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>📍 Pick from the search list above and these fill in automatically.</p>
              <div className="field"><label>Themes (comma-separated)</label><input value={f.themes} onChange={(e) => set("themes", e.target.value)} placeholder="pastel, kawaii, neon" /></div>
              <div className="field"><label>Photo URL</label><input value={f.photo} onChange={(e) => set("photo", e.target.value)} placeholder="https://…" /></div>
              <div className="field"><label>Opening hours</label><input value={f.openingHours} onChange={(e) => set("openingHours", e.target.value)} placeholder="10:00–20:00" /></div>
              <div className="field"><label>Description</label><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Why is it good for cosplay shoots?" /></div>
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
