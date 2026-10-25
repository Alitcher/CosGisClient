"use client";

import { useLocale, useTranslations } from "next-intl";
import { splitDate, fmtTimes, eventEndsOn } from "@/lib/data";
import { localText } from "@/lib/localText";
import { cityChip, cityLabel, countryLabel, countryOf } from "@/lib/cities";
import EventThumb from "./EventThumb";
import ShareButton from "./ShareButton";
import Icon from "./Icon";
import { Link } from "@/i18n/navigation";
import CountryFlag from "./CountryFlag";
import TransitBadges from "./TransitBadges";
import { priceLabel, isFree } from "@/lib/price";
import AgeTag from "./AgeTag";
import RepeatTag from "./RepeatTag";
import TicketIcon from "./TicketIcon";
import type { Event } from "@/types";

/**
 * One event card: date and time, picture, name, repeat tag, venue and city, transit,
 * description, price, age, map and share buttons. Used on the home page sections, the
 * Local community page and the calendar's hover card. `todayISO` marks events happening today.
 */
export default function EventCard({ event: e, todayISO, className = "" }: { event: Event; todayISO: string; className?: string }) {
  const locale = useLocale();
  const tp = useTranslations("Price");
  const tc = useTranslations("Common");
  const tCal = useTranslations("Calendar");
  const { day, mon } = splitDate(e.date, locale);
  const times = fmtTimes(e.startTime, e.endTime);
  const txt = localText(e, locale);
  const chip = cityChip(e.city, countryOf(e));
  // Happening today = today is between its first and last day (the calendar also shows past events).
  const isToday = e.date <= todayISO && eventEndsOn(e) >= todayISO;
  return (
    <div className={`card ev-card${isToday ? " is-today" : ""}${className ? ` ${className}` : ""}`}>
      <div className="ev-card-head">
        <div className="ev-when">
          <div className="ev-date"><span className="d">{day}</span><span className="m">{mon}</span></div>
          {times && <div className="ev-time">{times}</div>}
        </div>
        {isToday && (
          // eslint-disable-next-line @next/next/no-img-element
          <span className="today-badge"><img src="/today.svg" width={34} height={34} alt="" /><span>{tCal("today")}</span></span>
        )}
        <EventThumb event={e} size={56} />
      </div>
      <h4><Link className="title-link" href={`/events/${e.id}`}>{txt.name}</Link></h4>
      {e.recurrence && <div className="repeat-row"><RepeatTag event={e} />{e.recurrence.note && <span className="muted">{e.recurrence.note}</span>}</div>}
      <div className="ev-meta">{e.venue} <span className={`chip ${chip.className}`} style={chip.style}><CountryFlag country={countryOf(e)} height={15} />{cityLabel(e.city)}, {countryLabel(countryOf(e), locale)}</span></div>
      <TransitBadges transit={e.transit} />
      {txt.description && <p className="muted card-desc" style={{ fontSize: 13 }}>{txt.description}</p>}
      <div className="ev-actions"><div className="tag-row"><span className={`price-tag${isFree(e) ? " free" : ""}`}><TicketIcon size={20} />{priceLabel(e, tp)}</span><AgeTag item={e} /></div><div className="flex gap-sm"><Link className="icon-btn" href={`/map?lng=${e.lng}&lat=${e.lat}&z=16`} title={tc("showOnMap")}><Icon name="map" /></Link><ShareButton title={txt.name} path={`/events/${e.id}`} event={e} /></div></div>
    </div>
  );
}
