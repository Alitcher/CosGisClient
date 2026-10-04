"use client";

import { useTranslations } from "next-intl";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { usePlaceStore } from "@/lib/placesStore";
import SubmitSpotDialog from "@/components/SubmitSpotDialog";
import SpotCard from "@/components/SpotCard";
import { isPracticeType } from "@/types";

/**
 * Practice tab: dance studios open to J-pop/K-pop and practice spaces (sports
 * halls, youth centres) for rehearsing cover dances and cosplay performances.
 * Same `places` data as the Spots page, filtered to the practice types.
 */
export default function PracticePage() {
  const t = useTranslations("Practice");
  const tc = useTranslations("Common");
  const places = usePlaceStore().places.filter((p) => isPracticeType(p.type));

  return (
    <>
      <Nav />
      <div className="spots-shell">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="section-title">{t("title")}</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>{t("intro")}</p>
        <div style={{ margin: "18px 0 6px" }}>
          <SubmitSpotDialog className="btn" label={tc("submitPracticeSpot")} purpose="practice" />
        </div>

        <div className="grid spots-grid">
          {places.map((p) => <SpotCard key={p.id} place={p} />)}
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
