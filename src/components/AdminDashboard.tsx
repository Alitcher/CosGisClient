"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useEventStore } from "@/lib/eventsStore";
import { splitDate } from "@/lib/data";
import type { Event, City, Status } from "@/types";

type FormState = {
  id: string | null;
  name: string;
  venue: string;
  city: City;
  date: string;
  lng: string;
  lat: string;
  description: string;
  status: Status;
};

const EMPTY: FormState = {
  id: null,
  name: "",
  venue: "",
  city: "Helsinki",
  date: "",
  lng: "",
  lat: "",
  description: "",
  status: "live",
};

export default function AdminDashboard() {
  const { events, addEvent, updateEvent, deleteEvent } = useEventStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function openAdd() {
    setForm(EMPTY);
    setOpen(true);
  }
  function openEdit(e: Event) {
    setForm({
      id: e.id,
      name: e.name,
      venue: e.venue,
      city: e.city,
      date: e.date,
      lng: String(e.lng),
      lat: String(e.lat),
      description: e.description ?? "",
      status: e.status,
    });
    setOpen(true);
  }
  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function save() {
    if (!form.name.trim() || !form.venue.trim() || !form.date) {
      alert("Name, venue and date are required.");
      return;
    }
    const data: Omit<Event, "id"> = {
      name: form.name.trim(),
      venue: form.venue.trim(),
      city: form.city,
      date: form.date,
      lng: Number(form.lng) || 0,
      lat: Number(form.lat) || 0,
      description: form.description.trim() || undefined,
      status: form.status,
    };
    if (form.id) updateEvent(form.id, data);
    else addEvent({ id: crypto.randomUUID(), ...data });
    setOpen(false);
  }

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = events.filter((e) => e.date.startsWith(thisMonthPrefix)).length;
  const venueCount = new Set(events.map((e) => e.venue)).size;

  const visible = events.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.venue.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <nav className="nav">
        <div className="nav-inner admin-bar">
          <Link className="brand" href="/">
            <span className="brand-logo">⛩️</span>
            <span className="brand-text">
              CosplayMap<small>Admin panel</small>
            </span>
          </Link>
          <span className="admin-badge">🔒 ADMIN</span>
          <div className="admin-right">
            <Link className="view-site" href="/">↗ View site</Link>
            <ThemeToggle />
            <div className="who">
              <span className="avatar">🦊</span>
              <span className="hide-sm">admin</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="admin-shell">
        <div className="admin-head">
          <div>
            <h1>Manage events ✏️</h1>
            <p>Add, edit and remove conventions. Changes show up across the site instantly.</p>
          </div>
          <button className="btn" type="button" onClick={openAdd}>
            ＋ Add event
          </button>
        </div>

        <div className="grid stats">
          <div className="card stat-card"><span className="ic">🎌</span><span className="n">{events.length}</span><span className="l">Total events</span></div>
          <div className="card stat-card"><span className="ic">🗓️</span><span className="n">{thisMonth}</span><span className="l">This month</span></div>
          <div className="card stat-card"><span className="ic">📍</span><span className="n">{venueCount}</span><span className="l">Venues</span></div>
          <div className="card stat-card"><span className="ic">📨</span><span className="n">0</span><span className="l">Pending submissions</span></div>
        </div>

        <div className="a-toolbar">
          <div className="a-search">🔍 <input placeholder="Search events or venues…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        </div>

        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th className="hide-sm">Venue</th>
                <th className="hide-sm">Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const { day, mon, year } = splitDate(e.date);
                return (
                  <tr key={e.id}>
                    <td><div className="ev-name">{e.name}</div><div className="ev-sub">{e.city}</div></td>
                    <td className="hide-sm">{e.venue}</td>
                    <td className="hide-sm">{day} {mon} {year}</td>
                    <td>
                      <span className={`status ${e.status}`}>
                        {e.status === "live" ? "● Live" : e.status === "draft" ? "◌ Draft" : "⏳ Pending"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="mini-btn" type="button" title="Edit" onClick={() => openEdit(e)}>✏️</button>
                        <button className="mini-btn del" type="button" title="Delete" onClick={() => deleteEvent(e.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-2)" }}>No events. Click “＋ Add event”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-head">
          <h3>{form.id ? "Edit event" : "Add event"}</h3>
          <button className="close-x" type="button" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="drawer-body">
          <div className="field"><label>Event name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Tracon Hel" /></div>
          <div className="field"><label>Venue</label><input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Messukeskus" /></div>
          <div className="field-row">
            <div className="field">
              <label>City</label>
              <select value={form.city} onChange={(e) => set("city", e.target.value as City)}>
                <option>Helsinki</option><option>Vantaa</option><option>Espoo</option>
              </select>
            </div>
            <div className="field"><label>Date</label><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
          </div>
          <div className="field-row">
            <div className="field"><label>Longitude</label><input value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="24.9354" /></div>
            <div className="field"><label>Latitude</label><input value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="60.2012" /></div>
          </div>
          <div className="field"><label>Description</label><textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short blurb…" /></div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
              <option value="live">Live</option><option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn ghost" type="button" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" type="button" onClick={save}>💾 Save event</button>
        </div>
      </aside>
    </>
  );
}
