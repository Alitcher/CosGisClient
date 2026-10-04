"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { usePlaceStore } from "@/lib/placesStore";
import SubmitSpotDialog from "@/components/SubmitSpotDialog";

export default function SpotsPage() {
  const t = useTranslations("Spots");
  const tc = useTranslations("Common");
  const tType = useTranslations("PlaceTypes");
  const { places } = usePlaceStore();

  return (
    <>
      <Nav />
      <div className="spots-shell">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="section-title">{t("title")}</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>{t("intro")}</p>
        <div style={{ margin: "18px 0 6px" }}>
          <SubmitSpotDialog className="btn" label={tc("submitSpot")} />
        </div>

        <div className="grid spots-grid">
          {places.map((p) => (
            <div className="card spot" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="spot-photo" src={p.photos[0]?.url} alt={p.name} />
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
                <div className="spot-themes">
                  {p.themes.map((t) => (
                    <span className="theme-tag" key={t}>#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {places.length === 0 && (
            <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>
              {t("empty")}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
