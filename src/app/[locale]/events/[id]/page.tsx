import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EventThumb from "@/components/EventThumb";
import CountryFlag from "@/components/CountryFlag";
import ShareButton from "@/components/ShareButton";
import TransitBadges from "@/components/TransitBadges";
import { priceLabel, isFree } from "@/lib/price";
import AgeTag from "@/components/AgeTag";
import RepeatTag from "@/components/RepeatTag";
import YearSchedule from "@/components/YearSchedule";
import { nextOccurrence } from "@/lib/recurrence";
import { getEvent, SITE_URL } from "@/lib/serverData";
import { alternatesFor, localePath, eventJsonLd, jsonLdString } from "@/lib/seo";
import { localText } from "@/lib/localText";
import { cityChip, cityLabel, countryOf } from "@/lib/cities";
import { fmtRange, fmtTimes } from "@/lib/data";
import TicketIcon from "@/components/TicketIcon";

type Props = { params: Promise<{ locale: string; id: string }> };

/**
 * One event's own page. Its main job is the share preview: Facebook, Discord etc.
 * read the title/description/image below (the image is opengraph-image.tsx).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const e = await getEvent(id);
  if (!e) return {};
  const txt = localText(e, locale);
  const when = fmtRange(e.date, e.endDate, locale);
  const description = [`${when} - ${e.venue}, ${cityLabel(e.city)}`, txt.description].filter(Boolean).join(". ").slice(0, 300);
  return {
    title: txt.name,
    description,
    alternates: alternatesFor(locale, `/events/${id}`),
    openGraph: { title: txt.name, description, url: localePath(locale, `/events/${id}`), type: "website" },
    twitter: { card: "summary_large_image", title: txt.name, description },
  };
}

export default async function EventPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const e = await getEvent(id);
  if (!e) notFound();
  const t = await getTranslations("Detail");
  const txt = localText(e, locale);
  const times = fmtTimes(e.startTime, e.endTime);
  const tp = await getTranslations("Price");
  const price = priceLabel(e, tp);
  const chip = cityChip(e.city, countryOf(e));
  // Repeating meetup: show the next meeting (Helsinki date decides "today").
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date());
  const next = e.recurrence ? nextOccurrence(e, today) : null;
  const tr = await getTranslations("Repeat");

  return (
    <>
      {/* Event details for Google's event results (schema.org). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(eventJsonLd(e, txt.name, txt.description, SITE_URL + localePath(locale, `/events/${e.id}`))) }} />
      <Nav />
      <div className="ev-shell detail">
        <Link className="detail-back" href="/events">{t("allEvents")}</Link>
        <div className="card detail-card">
          <div className="detail-head">
            <EventThumb event={e} size={72} />
            <div>
              <h1>{txt.name}</h1>
              <p className="detail-when">{e.recurrence ? (next ? tr("next", { date: fmtRange(next, undefined, locale) }) : fmtRange(e.date, undefined, locale)) : fmtRange(e.date, e.endDate, locale)}{times && ` | ${times}`}</p>
              {e.recurrence && <div className="repeat-row"><RepeatTag event={e} />{e.recurrence.note && <span className="muted">{e.recurrence.note}</span>}</div>}
            </div>
          </div>
          <div className="detail-meta">
            <span>{e.venue}</span>
            <span className={`chip ${chip.className}`} style={chip.style}><CountryFlag country={countryOf(e)} />{cityLabel(e.city)}</span>
          </div>
          <TransitBadges transit={e.transit} />
          {txt.description && <p className="detail-text">{txt.description}</p>}
          <YearSchedule event={e} today={today} />
          <p className="detail-price"><span className={`price-tag${isFree(e) ? " free" : ""}`}><TicketIcon size={20} />{price}</span><AgeTag item={e} />{e.priceNote && <span className="muted">{e.priceNote}</span>}</p>
          <div className="detail-actions">
            <Link className="btn" href={`/map?lng=${e.lng}&lat=${e.lat}&z=16`}>{t("showOnMap")}</Link>
            {e.url && <a className="btn ghost" href={e.url} target="_blank" rel="noopener noreferrer">{t("website")}</a>}
            <ShareButton title={txt.name} path={`/events/${e.id}`} event={e} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
