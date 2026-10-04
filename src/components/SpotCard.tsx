"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isPracticeType, type Place } from "@/types";

/** Booking / price / facilities rows for practice places (Practice tab). */
function PracticeDetails({ place: p }: { place: Place }) {
  const t = useTranslations("Practice");
  const access = [p.booking && t(p.booking), p.price && t(p.price), p.priceNote].filter(Boolean).join(" · ");
  // The server only accepts http(s) links; checked again here before it becomes an href.
  const bookingUrl = p.bookingUrl && /^https?:\/\//i.test(p.bookingUrl) ? p.bookingUrl : undefined;
  return (
    <>
      {access && <div className="spot-meta">🎟️ {access}</div>}
      {p.youthFriendly && <div className="spot-meta">🧒 {t("youthFriendly")}</div>}
      {(p.facilities?.length ?? 0) > 0 && (
        <div className="spot-themes">
          {p.facilities!.map((f) => <span className="theme-tag" key={f}>{t(f)}</span>)}
        </div>
      )}
      {bookingUrl && (
        <a className="spot-meta" href={bookingUrl} target="_blank" rel="noopener noreferrer">🔗 {t("bookingLink")}</a>
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
  const photo = p.photos[0]?.url;
  return (
    <div className="card spot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img className="spot-photo" src={photo} alt={p.name} />}
      <div className="spot-body">
        <div className="spot-top">
          <h3>{p.name}</h3>
          <div className="flex gap-sm" style={{ alignItems: "center" }}>
            <span className="spot-type">{tType(p.type)}</span>
            <Link className="icon-btn" href={`/map?lng=${p.lng}&lat=${p.lat}&z=16`} title={tc("showOnMap")}>🗺️</Link>
          </div>
        </div>
        <div className="spot-meta">📍 {p.address ?? p.city}</div>
        {p.description && <p className="muted" style={{ fontSize: 13 }}>{p.description}</p>}
        {isPracticeType(p.type) && <PracticeDetails place={p} />}
        <div className="spot-themes">
          {p.themes.map((t) => (
            <span className="theme-tag" key={t}>#{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
