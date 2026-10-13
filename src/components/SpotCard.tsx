"use client";

import { useLocale, useTranslations } from "next-intl";
import { localText } from "@/lib/localText";
import ShareButton from "./ShareButton";
import TransitBadges from "./TransitBadges";
import { Link } from "@/i18n/navigation";
import Icon from "./Icon";
import { isPracticeType, type Place } from "@/types";
import TicketIcon from "@/components/TicketIcon";
import CountryFlag from "./CountryFlag";
import { cityChip, cityLabel, countryLabel, countryOf } from "@/lib/cities";

/** Booking / price / facilities rows for practice places (Practice tab). */
function PracticeDetails({ place: p }: { place: Place }) {
  const t = useTranslations("Practice");
  const access = [p.booking && t(p.booking), p.price && t(p.price), p.priceNote].filter(Boolean).join(" | ");
  // The server only accepts http(s) links; checked again here before it becomes an href.
  const bookingUrl = p.bookingUrl && /^https?:\/\//i.test(p.bookingUrl) ? p.bookingUrl : undefined;
  return (
    <>
      {access && <div className="spot-meta">{access}</div>}
      {p.youthFriendly && <div className="spot-meta">{t("youthFriendly")}</div>}
      {(p.facilities?.length ?? 0) > 0 && (
        <div className="spot-themes">
          {p.facilities!.map((f) => <span className="theme-tag" key={f}>{t(f)}</span>)}
        </div>
      )}
      {bookingUrl && (
        <a className="spot-meta"href={bookingUrl} target="_blank"rel="noopener noreferrer">{t("bookingLink")}</a>
      )}
    </>
  );
}

/** One place card: photo, name, type, address, themes. Used on the Spots and
 *  Practice pages and in the home page's "Cosplay hot spots" row. Practice
 *  places also show booking, price and facilities. */
export default function SpotCard({ place: p }: { place: Place }) {
  const tc = useTranslations("Common");
  const tType = useTranslations("PlaceTypes");
  const tp = useTranslations("Price");
  const photo = p.photos[0]?.url;
  const locale = useLocale();
  const txt = localText(p, locale);
  return (
    <div className="card spot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img className="spot-photo" src={photo} alt={txt.name} />}
      <div className="spot-body">
        <div className="spot-top">
          <h3><Link className="title-link" href={`/spots/${p.id}`}>{txt.name}</Link></h3>
          <div className="flex gap-sm" style={{ alignItems: "center" }}>
            <span className="spot-type">{tType(p.type)}</span>
            <Link className="icon-btn" href={`/map?lng=${p.lng}&lat=${p.lat}&z=16`} title={tc("showOnMap")}><Icon name="map" /></Link>
            <ShareButton title={txt.name} path={`/spots/${p.id}`} />
          </div>
        </div>
        <div className="spot-where">
          {p.address && <span>{p.address}</span>}
          <span className={`chip ${cityChip(p.city, countryOf(p)).className}`} style={cityChip(p.city, countryOf(p)).style}><CountryFlag country={countryOf(p)} height={15} />{cityLabel(p.city)}, {countryLabel(countryOf(p), locale)}</span>
        </div>
        <TransitBadges transit={p.transit} />
        {txt.description && <p className="muted" style={{ fontSize: 13 }}>{txt.description}</p>}
        {isPracticeType(p.type) && <PracticeDetails place={p} />}
        <div className="spot-themes">
          {p.themes.map((t) => (
            <span className="theme-tag" key={t}>#{t}</span>
          ))}
        </div>
        {/* Entry, bottom-left: "Paid" only when marked paid, otherwise free (the default). */}
        <div className="card-foot"><span className={`price-tag${p.price === "paid" ? "" : " free"}`}><TicketIcon size={20} />{p.price === "paid" ? tp("paid") : tp("free")}</span></div>
      </div>
    </div>
  );
}
