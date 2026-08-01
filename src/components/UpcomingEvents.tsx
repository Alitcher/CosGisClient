"use client";

import { splitDate, eventEndsOn } from "@/lib/data";
import { useEventStore } from "@/lib/eventsStore";

export default function UpcomingEvents() {
  const { events } = useEventStore();
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const upcoming = events
    .filter((e) => eventEndsOn(e) >= todayISO)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="grid up-grid">
      {upcoming.map((e) => {
        const { day, mon } = splitDate(e.date);
        return (
          <div className="card ev-card" key={e.id}>
            <div className="ev-date"><span className="d">{day}</span><span className="m">{mon}</span></div>
            <h4>{e.name}</h4>
            <div className="ev-meta">📍 {e.venue} <span className={`chip ${e.city.toLowerCase()}`}>{e.city}</span></div>
            {e.description && <p className="muted" style={{ fontSize: 13 }}>{e.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
