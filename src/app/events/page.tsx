"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { splitDate } from "@/lib/data";
import { useEventStore } from "@/lib/eventsStore";
import type { City } from "@/types";

const CITIES: (City | "All cities")[] = ["All cities", "Helsinki", "Vantaa", "Espoo"];

export default function EventsPage() {
  const { events } = useEventStore();
  const [city, setCity] = useState<(typeof CITIES)[number]>("All cities");
  const [q, setQ] = useState("");

  const list = events
    .filter((e) => (city === "All cities" ? true : e.city === city))
    .filter(
      (e) =>
        e.name.toLowerCase().includes(q.toLowerCase()) ||
        e.venue.toLowerCase().includes(q.toLowerCase()),
    )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <Nav />
      <div className="ev-shell">
        <div className="ev-top">
          <div>
            <h1>All conventions</h1>
            <p>{list.length} event{list.length === 1 ? "" : "s"} · sorted by date</p>
          </div>
          <Link className="btn ghost" href="/calendar">📅 Calendar view</Link>
        </div>

        <div className="toolbar">
          <div className="search">
            🔍 <input type="text" placeholder="Search conventions, venues…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="seg">
            {CITIES.map((c) => (
              <button key={c} className={city === c ? "on" : ""} type="button" onClick={() => setCity(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="ev-rows">
          {list.map((e) => {
            const { day, mon, year } = splitDate(e.date);
            return (
              <div className="card row" key={e.id}>
                <div className="r-date">
                  <div className="d">{day}</div>
                  <div className="m">{mon}</div>
                  <div className="y">{year}</div>
                </div>
                <div className="r-main">
                  <h3>{e.name}</h3>
                  <div className="meta">
                    <span>📍 <b>{e.venue}</b></span>
                    <span className={`chip ${e.city.toLowerCase()}`}>{e.city}</span>
                  </div>
                </div>
                <div className="r-cta">
                  <Link className="icon-btn" href="/map" title="View on map">🗺️</Link>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>
              No conventions match your filters.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
