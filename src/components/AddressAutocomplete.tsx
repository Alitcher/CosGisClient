"use client";

import { useEffect, useRef, useState } from "react";
import { geocode, type GeoResult } from "@/lib/geocode";

/**
 * Type-ahead address / place / postcode search with a clickable suggestion list,
 * like the Google Maps search box. Debounced; calls onSelect with coordinates
 * when the user picks a suggestion.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  onSelect: (result: GeoResult) => void;
  placeholder?: string;
}) {
  const [items, setItems] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNext = useRef(false); // don't re-search the text we just filled in

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return; }
    const q = value.trim();
    if (q.length < 2) { setItems([]); setOpen(false); return; }
    const ctrl = new AbortController();
    setBusy(true);
    const timer = setTimeout(async () => {
      const res = await geocode(q, ctrl.signal);
      setItems(res);
      setOpen(res.length > 0);
      setActive(-1);
      setBusy(false);
    }, 300);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [value]);

  function choose(r: GeoResult) {
    skipNext.current = true;
    onSelect(r);
    onChange(r.label);
    setOpen(false);
    setItems([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(items[active]!); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => { if (items.length > 0) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {busy && <span style={{ position: "absolute", right: 10, top: 10, fontSize: 12, opacity: 0.6 }}>...</span>}
      {open && items.length > 0 && (
        <ul
          style={{
            position: "absolute", zIndex: 50, left: 0, right: 0, top: "calc(100% + 4px)",
            margin: 0, padding: 4, listStyle: "none", maxHeight: 240, overflowY: "auto",
            background: "var(--surface)", color: "var(--text-0)",
            border: "2px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.18)",
          }}
        >
          {items.map((r, i) => (
            <li
              key={`${r.lat},${r.lng},${i}`}
              onMouseDown={(e) => { e.preventDefault(); choose(r); }}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 14,
                color: "var(--text-0)",
                background: i === active ? "var(--surface-2)" : "transparent",
              }}
            >
              📍 {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
