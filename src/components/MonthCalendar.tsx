"use client";

import { useState } from "react";
import { useEventStore } from "@/lib/eventsStore";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const pad = (n: number) => String(n).padStart(2, "0");
const cityClass = (c: string) => c.toLowerCase();

export default function MonthCalendar() {
  const { events } = useEventStore();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function goToday() {
    setView({ year: today.getFullYear(), month: today.getMonth() });
  }

  const { year, month } = view;
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const lead = Array.from({ length: firstDow }, (_, i) => prevDays - firstDow + 1 + i);
  const total = firstDow + daysInMonth;
  const trail = (7 - (total % 7)) % 7;

  // events for this month, keyed by day — multi-day events appear on every day
  // they span (start..endDate), not just their first day.
  const byDay = new Map<number, typeof events>();
  for (const e of events) {
    const end = e.endDate && e.endDate >= e.date ? e.endDate : e.date;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayISO = `${year}-${pad(month + 1)}-${pad(d)}`;
      if (e.date <= dayISO && dayISO <= end) {
        const arr = byDay.get(d) ?? [];
        arr.push(e);
        byDay.set(d, arr);
      }
    }
  }

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="cal-shell">
      <div className="cal-toolbar">
        <div className="tb-nav">
          <button type="button" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
          <button className="tb-today" type="button" onClick={goToday}>Today</button>
          <button type="button" aria-label="Next month" onClick={() => shift(1)}>›</button>
        </div>
        <h1>{MONTHS[month]} <span>{year}</span></h1>
      </div>

      <div className="cal">
        <div className="cal-dow">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="cal-body">
          {lead.map((d) => (
            <div key={`lead${d}`} className="cell dim"><div className="num">{d}</div></div>
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const col = (firstDow + d - 1) % 7;
            const weekend = col >= 5;
            const list = byDay.get(d) ?? [];
            return (
              <div key={`d${d}`} className={`cell${weekend ? " weekend" : ""}${isToday(d) ? " today" : ""}`}>
                <div className="num">{d}</div>
                {list.slice(0, 2).map((e) => (
                  <span key={e.id} className={`ev ${cityClass(e.city)}`}>
                    <span className="dot" />
                    {e.name}
                  </span>
                ))}
                {list.length > 2 && <div className="ev-more">+{list.length - 2} more</div>}
              </div>
            );
          })}

          {Array.from({ length: trail }, (_, i) => i + 1).map((d) => (
            <div key={`trail${d}`} className="cell dim"><div className="num">{d}</div></div>
          ))}
        </div>
      </div>

      <div className="cal-foot">
        <div className="lg"><span className="sw" style={{ background: "var(--pink)" }} /> Helsinki</div>
        <div className="lg"><span className="sw" style={{ background: "var(--gold)" }} /> Vantaa</div>
        <div className="lg"><span className="sw" style={{ background: "var(--cyan)" }} /> Espoo</div>
        <div className="lg" style={{ marginLeft: "auto", color: "var(--text-2)" }}>
          ‹ › to browse past &amp; future months
        </div>
      </div>
    </div>
  );
}
