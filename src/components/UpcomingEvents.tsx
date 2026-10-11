"use client";

import { useLocale, useTranslations } from "next-intl";
import { splitDate, eventEndsOn, fmtTimes } from "@/lib/data";
import { localText } from "@/lib/localText";
import { cityChip, cityLabel, countryOf } from "@/lib/cities";
import { useEventStore } from "@/lib/eventsStore";
import EventThumb from "./EventThumb";
import ShareButton from "./ShareButton";
import { Link } from "@/i18n/navigation";
import CountryFlag from "./CountryFlag";
import TransitBadges from "./TransitBadges";
import { priceLabel, isFree } from "@/lib/price";

export default function UpcomingEvents() {
  const { events } = useEventStore();
  const locale = useLocale();
  const tp = useTranslations("Price");
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
        const txt = localText(e, locale);
        return (
          <div className="card ev-card" key={e.id}>
            <div className="ev-card-head">
              <div className="ev-when">
                <div className="ev-date"><span className="d">{day}</span><span className="m">{mon}</span></div>
                {times && <div className="ev-time">{times}</div>}
              </div>
              <EventThumb event={e} size={56} />
            </div>
            <h4><Link className="title-link" href={`/events/${e.id}`}>{txt.name}</Link></h4>
            <div className="ev-meta">{e.venue} <span className={`chip ${cityChip(e.city, countryOf(e)).className}`} style={cityChip(e.city, countryOf(e)).style}><CountryFlag country={countryOf(e)} />{cityLabel(e.city)}</span></div>
            <TransitBadges transit={e.transit} />
            {txt.description && <p className="muted" style={{ fontSize: 13 }}>{txt.description}</p>}
            <div className="ev-actions"><span className={`price-tag${isFree(e) ? " free" : ""}`}>{priceLabel(e, tp)}</span><ShareButton title={txt.name} path={`/events/${e.id}`} /></div>
          </div>
        );
      })}
    </div>
  );
}
