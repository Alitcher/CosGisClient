"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEventStore } from "@/lib/eventsStore";
import { eventEndsOn } from "@/lib/data";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-based

/** Small left/right arrow drawn as SVG (no special characters in the markup). */
function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d={dir === "left" ? "M7.5 2.5 4 6l3.5 3.5" : "M4.5 2.5 8 6 4.5 9.5"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Compact calendar docked inside the map. Starts on the current month; the
 * arrows move back and forward. Days with an event (every day of a multi-day
 * event) get a dot; today is highlighted.
 */
export default function MiniCalendar() {
  const t = useTranslations("MiniCalendar");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const { events } = useEventStore();

  const now = new Date();
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate());
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const move = (delta: number) =>
    setView(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (((m + delta) % 12) + 12) % 12 }));

  const { y, m } = view;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Monday = 0
  const prevTail = new Date(y, m, 0).getDate();
  const monthStart = iso(y, m, 1);
  const monthEnd = iso(y, m, daysInMonth);

  // Day numbers in this month that have at least one event.
  const eventDays = useMemo(() => {
    const days = new Set<number>();
    for (const e of events) {
      const from = e.date > monthStart ? e.date : monthStart;
      const to = eventEndsOn(e) < monthEnd ? eventEndsOn(e) : monthEnd;
      if (from > to) continue;
      for (let d = Number(from.slice(8, 10)); d <= Number(to.slice(8, 10)); d++) days.add(d);
    }
    return days;
  }, [events, monthStart, monthEnd]);

  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(y, m, 1));
  // Narrow weekday names in the UI language, Monday first (2024-01-01 was a Monday).
  const dow = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 1 + i)),
  );

  const cells: { key: string; label: number; cls: string }[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ key: `p${i}`, label: prevTail - firstDow + 1 + i, cls: "mc-cell dim" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = "mc-cell";
    if (eventDays.has(d)) cls += " has-ev";
    if (iso(y, m, d) === today) cls += " today";
    cells.push({ key: `d${d}`, label: d, cls });
  }

  return (
    <div className="mini-cal">
      <div className="mc-head">
        <div className="mc-title">{title}</div>
        <div className="mc-nav">
          <button type="button" aria-label={tc("previousMonth")} onClick={() => move(-1)}><Chevron dir="left" /></button>
          <button type="button" aria-label={tc("nextMonth")} onClick={() => move(1)}><Chevron dir="right" /></button>
        </div>
      </div>
      <div className="mc-grid">
        {dow.map((d, i) => (
          <div key={`dow${i}`} className="dow">{d}</div>
        ))}
        {cells.map((c) => (
          <div key={c.key} className={c.cls}>{c.label}</div>
        ))}
      </div>
      <div className="mc-foot">
        <span>{t("conDay")}</span>
        <Link href="/calendar">{t("fullCalendar")}</Link>
      </div>
    </div>
  );
}
