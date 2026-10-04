"use client";

import { splitDate, eventEndsOn, fmtTimes } from "@/lib/data";
import { cityLabel } from "@/lib/cities";
import { useEventStore } from "@/lib/eventsStore";
import EventThumb from "./EventThumb";

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
        const times = fmtTimes(e.startTime, e.endTime);
        return (
          <div className="card ev-card" key={e.id}>
            <div className="ev-card-head">
              <div className="ev-date"><span className="d">{day}</span><span className="m">{mon}</span></div>
              <EventThumb event={e} size={56} />
            </div>
            <h4>{e.name}</h4>
            <div className="ev-meta">📍 {e.venue} <span className={`chip ${e.city.toLowerCase()}`}>{cityLabel(e.city)}</span></div>
            {times && <div className="ev-meta">🕐 {times}</div>}
            {e.description && <p className="muted" style={{ fontSize: 13 }}>{e.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
