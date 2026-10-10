"use client";

import { splitDate, eventEndsOn, fmtTimes } from "@/lib/data";
import { cityChip, cityLabel, countryOf } from "@/lib/cities";
import { useEventStore } from "@/lib/eventsStore";
import EventThumb from "./EventThumb";
import CountryFlag from "./CountryFlag";

export default function UpcomingEvents() {
  const { events } = useEventStore();
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const upcoming = events
    .filter((e) => eventEndsOn(e) >= todayISO)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4); // 4th one only shows on tablets (2x2 grid), see .home-4 in globals.css

  return (
    <div className="grid up-grid home-4">
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
            <div className="ev-meta">📍 {e.venue} <span className={`chip ${cityChip(e.city).className}`} style={cityChip(e.city).style}><CountryFlag country={countryOf(e)} />{cityLabel(e.city)}</span></div>
            {times && <div className="ev-meta">🕐 {times}</div>}
            {e.description && <p className="muted" style={{ fontSize: 13 }}>{e.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
