"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EventCard from "./EventCard";
import type { Event } from "@/types";
import { useLocale, useTranslations } from "next-intl";
import { localText } from "@/lib/localText";
import { useEventStore } from "@/lib/eventsStore";
import Icon from "./Icon";
import { occurrences } from "@/lib/recurrence";
import { cityChip, cityColor, cityCountries, citiesIn, cityLabel, countryOf } from "@/lib/cities";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const pad = (n: number) => String(n).padStart(2, "0");

export default function MonthCalendar() {
  const t = useTranslations("Calendar");
  const locale = useLocale();
  const tc = useTranslations("Common");
  const { events } = useEventStore();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const todayISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // Hover card: the full event card next to a label (hover or keyboard focus; tap on phones).
  // It stays while the pointer moves onto it, so its map and share buttons can be used.
  const [peek, setPeek] = useState<{ event: Event; rect: DOMRect } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const keepOpen = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  // Not while a share window opened from the card is up (closing the card would close it too).
  const sharing = () => !!document.querySelector(".share-dialog");
  const closeSoon = () => { keepOpen(); closeTimer.current = setTimeout(() => { if (sharing()) closeSoon(); else setPeek(null); }, 180); };
  const openedAtScroll = useRef(0);
  // Mouse: hover opens / leaving closes. Touch and pen: one tap opens (a phone fakes mouse
  // events on a tap, which used to open and close it again at once).
  const isMouse = (ev: React.PointerEvent) => ev.pointerType === "mouse";
  function show(e: Event, dayISO: string, el: HTMLElement) {
    keepOpen();
    // a repeating meetup shows the meeting on this day
    openedAtScroll.current = window.scrollY;
    setPeek({ event: e.recurrence ? { ...e, date: dayISO, endDate: undefined } : e, rect: el.getBoundingClientRect() });
  }
  // Closing the share window (opened from the card) closes the card too.
  useEffect(() => {
    const close = () => setPeek(null);
    window.addEventListener("share-picture-closed", close);
    return () => window.removeEventListener("share-picture-closed", close);
  }, []);
  // Tap outside or Escape closes it (phones have no "mouse leave").
  useEffect(() => {
    if (!peek) return;
    const onDown = (ev: PointerEvent) => {
      const target = ev.target as HTMLElement;
      if (!cardRef.current?.contains(target) && !target.closest(".ev, .share-dialog, .overlay")) setPeek(null);
    };
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape" && !sharing()) setPeek(null); };
    // Close on a real scroll only (phones nudge the page a little when a button is tapped).
    const onScroll = () => { if (!sharing() && Math.abs(window.scrollY - openedAtScroll.current) > 60) setPeek(null); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); window.removeEventListener("scroll", onScroll); };
  }, [peek]);

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

  // events for this month, keyed by day - multi-day events appear on every day
  // they span (start..endDate), repeating community meetups on every meeting day.
  const byDay = new Map<number, typeof events>();
  const monthStart = `${year}-${pad(month + 1)}-01`;
  const monthEnd = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`;
  for (const e of events) {
    for (const dayISO of occurrences(e, monthStart, monthEnd)) {
      const d = Number(dayISO.slice(8, 10));
      const arr = byDay.get(d) ?? [];
      arr.push(e);
      byDay.set(d, arr);
    }
  }

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="cal-shell">
      <div className="cal-toolbar">
        <div className="tb-nav">
          <button type="button" aria-label={tc("previousMonth")} onClick={() => shift(-1)}><Icon name="chevron-left" size={16} /></button>
          <button className="tb-today" type="button" onClick={goToday}>{t("today")}</button>
          <button type="button" aria-label={tc("nextMonth")} onClick={() => shift(1)}><Icon name="chevron-right" size={16} /></button>
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
                {list.slice(0, 2).map((e) => {
                  const dayISO = `${year}-${pad(month + 1)}-${pad(d)}`;
                  return (
                    <button
                      type="button" key={e.id} className={`ev ${cityChip(e.city, countryOf(e)).className}`} style={cityChip(e.city, countryOf(e)).style}
                      onPointerEnter={(ev) => { if (isMouse(ev)) show(e, dayISO, ev.currentTarget); }}
                      onPointerLeave={(ev) => { if (isMouse(ev)) closeSoon(); }}
                      onClick={(ev) => show(e, dayISO, ev.currentTarget)}
                      onKeyUp={(ev) => { if (ev.key === "Tab") show(e, dayISO, ev.currentTarget); }}
                    >
                      <span className="dot" />
                      {localText(e, locale).name}
                    </button>
                  );
                })}
                {list.length > 2 && <div className="ev-more">{t("more", { count: list.length - 2 })}</div>}
              </div>
            );
          })}

          {Array.from({ length: trail }, (_, i) => i + 1).map((d) => (
            <div key={`trail${d}`} className="cell dim"><div className="num">{d}</div></div>
          ))}
        </div>
      </div>

      {peek && typeof document !== "undefined" && createPortal(
        <div
          ref={cardRef}
          className="cal-peek"
          style={peekPosition(peek.rect)}
          onPointerEnter={keepOpen}
          onPointerLeave={(ev) => { if (isMouse(ev)) closeSoon(); }}
        >
          <EventCard event={peek.event} todayISO={todayISO} />
        </div>,
        document.body,
      )}

      <div className="cal-foot">
        {citiesIn(events).map((c) => (
          <div className="lg" key={c}><span className="sw" style={{ background: cityColor(c, cityCountries(events).get(c)) }} /> {cityLabel(c)}</div>
        ))}
        <div className="lg" style={{ marginLeft: "auto", color: "var(--text-2)" }}>
          {t("browseHint")}
        </div>
      </div>
    </div>
  );
}

/**
 * Where the hover card goes: right of the label, or left when there is no room;
 * on narrow screens centred. Kept inside the window (no inner scrolling, so menus can stick out).
 */
function peekPosition(r: DOMRect): React.CSSProperties {
  const vw = window.innerWidth, vh = window.innerHeight, w = Math.min(360, vw - 24), gap = 10;
  let left = r.right + gap;
  if (left + w > vw - 12) left = r.left - w - gap;
  if (left < 12) left = (vw - w) / 2;
  const top = Math.max(12, Math.min(r.top - 20, vh - 12 - 460));
  return { left, top, width: w };
}
