"use client";

import { useLocale, useTranslations } from "next-intl";
import { splitDate, eventEndsOn, fmtTimes } from "@/lib/data";
import { localText } from "@/lib/localText";
import { cityChip, cityLabel, countryLabel, countryOf } from "@/lib/cities";
import { useEventStore } from "@/lib/eventsStore";
import EventThumb from "./EventThumb";
import ShareButton from "./ShareButton";
import Icon from "./Icon";
import { Link } from "@/i18n/navigation";
import CountryFlag from "./CountryFlag";
import TransitBadges from "./TransitBadges";
import { priceLabel, isFree } from "@/lib/price";
import AgeTag from "./AgeTag";
import RepeatTag from "./RepeatTag";
import { asNext, isCommunity } from "@/lib/recurrence";
import type { Event } from "@/types";
import TicketIcon from "@/components/TicketIcon";

/**
 * Event cards, soonest first. kind "convention": cons and one-off events (home page,
 * 4 cards). kind "community": repeating local meetups, each shown at its next meeting
 * with how it repeats. `limit` 0 = all (the Local community page).
 */
export default function UpcomingEvents({ kind = "convention", limit = 4, query = "" }: { kind?: "convention" | "community"; limit?: number; query?: string }) {
  const { events } = useEventStore();
  const locale = useLocale();
  const tp = useTranslations("Price");
  const tc = useTranslations("Common");
  const tCal = useTranslations("Calendar");
  const tCom = useTranslations("Community");
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const q = query.trim().toLowerCase();
  const sorted = events
    .filter((e) => isCommunity(e) === (kind === "community"))
    .map((e) => asNext(e, todayISO))
    .filter((e): e is Event => !!e && eventEndsOn(e) >= todayISO)
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q))
    .sort((a, b) => a.date.localeCompare(b.date));
  // Home: 4 cards; the 4th one only shows on tablets (2x2 grid), see .home-4 in globals.css
  const upcoming = limit ? sorted.slice(0, limit) : sorted;
  if (kind === "community" && upcoming.length === 0) return <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>{tCom("empty")}</div>;

  return (
    <div className={`grid up-grid${limit === 4 ? " home-4" : ""}`}>
      {upcoming.map((e) => {
        const { day, mon } = splitDate(e.date);
        const times = fmtTimes(e.startTime, e.endTime);
        const txt = localText(e, locale);
        return (
          <div className={`card ev-card${e.date <= todayISO ? " is-today" : ""}`} key={e.id}>
            <div className="ev-card-head">
              <div className="ev-when">
                <div className="ev-date"><span className="d">{day}</span><span className="m">{mon}</span></div>
                {times && <div className="ev-time">{times}</div>}
              </div>
              {e.date <= todayISO && (
                // eslint-disable-next-line @next/next/no-img-element
                <span className="today-badge"><img src="/today.svg" width={34} height={34} alt="" /><span>{tCal("today")}</span></span>
              )}
              <EventThumb event={e} size={56} />
            </div>
            <h4><Link className="title-link" href={`/events/${e.id}`}>{txt.name}</Link></h4>
            {e.recurrence && <div className="repeat-row"><RepeatTag event={e} />{e.recurrence.note && <span className="muted">{e.recurrence.note}</span>}</div>}
            <div className="ev-meta">{e.venue} <span className={`chip ${cityChip(e.city, countryOf(e)).className}`} style={cityChip(e.city, countryOf(e)).style}><CountryFlag country={countryOf(e)} height={15} />{cityLabel(e.city)}, {countryLabel(countryOf(e), locale)}</span></div>
            <TransitBadges transit={e.transit} />
            {txt.description && <p className="muted card-desc" style={{ fontSize: 13 }}>{txt.description}</p>}
            <div className="ev-actions"><div className="tag-row"><span className={`price-tag${isFree(e) ? " free" : ""}`}><TicketIcon size={20} />{priceLabel(e, tp)}</span><AgeTag item={e} /></div><div className="flex gap-sm"><Link className="icon-btn" href={`/map?lng=${e.lng}&lat=${e.lat}&z=16`} title={tc("showOnMap")}><Icon name="map" /></Link><ShareButton title={txt.name} path={`/events/${e.id}`} /></div></div>
          </div>
        );
      })}
    </div>
  );
}
