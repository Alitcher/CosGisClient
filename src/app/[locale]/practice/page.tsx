"use client";

import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import Nav from "@/components/Nav";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import { usePlaceStore } from "@/lib/placesStore";
import { placeMatches } from "@/lib/search";
import SubmitSpotDialog from "@/components/SubmitSpotDialog";
import SpotCard from "@/components/SpotCard";
import SearchBox from "@/components/SearchBox";
import { isPracticeType } from "@/types";

/**
 * Practice tab: dance studios open to J-pop/K-pop and practice spaces (sports
 * halls, youth centres) for rehearsing cover dances and cosplay performances.
 * Same `places` data as the Spots page, filtered to the practice types.
 */
export default function PracticePage() {
  const t = useTranslations("Practice");
  const tc = useTranslations("Common");
  const [q, setQ] = useState("");
  const all = usePlaceStore().places.filter((p) => isPracticeType(p.type));
  const places = all.filter((p) => placeMatches(p, q));

  return (
    <>
      <Nav />
      <AdSlot page="practice" size="leaderboard" name="Top banner (under menu)" />
      <div className="spots-shell">
        <h1 className="section-title">{t("title")}</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>{t("intro")}</p>
        <div className="page-actions">
          <SubmitSpotDialog className="btn" label={tc("submitPracticeSpot")} purpose="practice" />
        </div>
        <hr className="divider" />
        <div className="search-row">
          <SearchBox value={q} onChange={setQ} placeholder={t("search")} />
        </div>

        <div className="grid spots-grid">
          {places.map((p, i) => (
            <Fragment key={p.id}>
              <SpotCard place={p} />
              {i === 5 && <AdSlot page="practice" size="rect" name="In the grid (after 6 cards)" className="in-grid" />}
            </Fragment>
          ))}
          {places.length === 0 && (
            <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>
              {all.length === 0 ? t("empty") : t("noMatches")}
            </div>
          )}
        </div>
      </div>
      <Footer page="practice" />
    </>
  );
}
