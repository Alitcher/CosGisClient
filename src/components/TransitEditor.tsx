"use client";

import { useState } from "react";
import { apiLookupTransit } from "@/lib/api";
import { TRANSIT_KINDS, type TransitKind, type TransitStop } from "@/types";

/**
 * Admin field for nearby public transport. The admin either types the stops by
 * hand or presses "Look up stops", which replaces the list with the nearest
 * stops (Digitransit in Finland, OpenStreetMap elsewhere; see the server's
 * services/transit.ts); the result can then be edited before saving.
 *
 * `value` null = never checked (nothing is sent on save), [] = checked, nothing close.
 */
export default function TransitEditor({ value, onChange, lat, lng }: {
  value: TransitStop[] | null;
  onChange: (v: TransitStop[] | null) => void;
  lat: string;
  lng: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const list = value ?? [];
  const hasCoords = lat.trim() !== "" && lng.trim() !== "" && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

  async function lookup() {
    setLoading(true);
    setError("");
    try {
      onChange(await apiLookupTransit(Number(lat), Number(lng)));
    } catch (err) {
      setError(`Lookup failed, try again or fill it in by hand. (${(err as Error).message})`);
    } finally {
      setLoading(false);
    }
  }

  const setRow = (i: number, patch: Partial<TransitStop>) => onChange(list.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const removeRow = (i: number) => onChange(list.filter((_, j) => j !== i));
  const addRow = () => onChange([...list, { kind: "bus", name: "", distance: 100 }]);

  return (
    <div className="field">
      <label>Nearby public transport</label>
      <div className="transit-edit">
        {list.map((s, i) => (
          <div className="transit-row" key={i}>
            <select value={s.kind} onChange={(e) => setRow(i, { kind: e.target.value as TransitKind })} aria-label="Kind">
              {TRANSIT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <input value={s.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="Stop name" aria-label="Stop name" />
            <input type="number" min={0} max={5000} step={10} value={s.distance} onChange={(e) => setRow(i, { distance: Math.max(0, Math.round(Number(e.target.value) || 0)) })} aria-label="Distance in metres" />
            <span className="transit-unit">m</span>
            <button className="mini-btn del" type="button" title="Remove" onClick={() => removeRow(i)}>x</button>
          </div>
        ))}
        <p className="field-note">
          {value === null ? "Not checked yet." : list.length === 0 ? "Checked: nothing close." : "Shown on the site as badges, nearest first."}
        </p>
        <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
          <button className="btn ghost" type="button" onClick={addRow}>+ Add stop</button>
          <button className="btn ghost" type="button" disabled={!hasCoords || loading} title={hasCoords ? "" : "Set the coordinates first"} onClick={lookup}>
            {loading ? "Looking up..." : "Look up stops"}
          </button>
        </div>
        {error && <p className="field-note warn">{error}</p>}
      </div>
    </div>
  );
}
