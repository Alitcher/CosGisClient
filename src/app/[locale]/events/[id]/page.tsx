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
import { getEvent } from "@/lib/serverData";
import { localText } from "@/lib/localText";
import { cityChip, cityLabel, countryOf } from "@/lib/cities";
import { fmtRange, fmtTimes } from "@/lib/data";

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
  const when = fmtRange(e.date, e.endDate);
  const description = [`${when} - ${e.venue}, ${cityLabel(e.city)}`, txt.description].filter(Boolean).join(". ").slice(0, 300);
  return {
    title: txt.name,
    description,
    alternates: { canonical: `/${locale}/events/${id}` },
    openGraph: { title: txt.name, description, url: `/${locale}/events/${id}`, type: "website" },
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
  const chip = cityChip(e.city);

  return (
    <>
      <Nav />
      <div className="ev-shell detail">
        <Link className="detail-back" href="/events">{t("allEvents")}</Link>
        <div className="card detail-card">
          <div className="detail-head">
            <EventThumb event={e} size={72} />
            <div>
              <h1>{txt.name}</h1>
              <p className="detail-when">{fmtRange(e.date, e.endDate)}{times && ` | ${times}`}</p>
            </div>
          </div>
          <div className="detail-meta">
            <span>{e.venue}</span>
            <span className={`chip ${chip.className}`} style={chip.style}><CountryFlag country={countryOf(e)} />{cityLabel(e.city)}</span>
          </div>
          {txt.description && <p className="detail-text">{txt.description}</p>}
          <div className="detail-actions">
            <Link className="btn" href={`/map?lng=${e.lng}&lat=${e.lat}&z=16`}>{t("showOnMap")}</Link>
            {e.url && <a className="btn ghost" href={e.url} target="_blank" rel="noopener noreferrer">{t("website")}</a>}
            <ShareButton title={txt.name} path={`/events/${e.id}`} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
