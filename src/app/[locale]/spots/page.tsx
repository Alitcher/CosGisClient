"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { usePlaceStore } from "@/lib/placesStore";
import { placeMatches } from "@/lib/search";
import SubmitSpotDialog from "@/components/SubmitSpotDialog";
import SpotCard from "@/components/SpotCard";
import SearchBox from "@/components/SearchBox";
import { isPracticeType } from "@/types";

export default function SpotsPage() {
  const t = useTranslations("Spots");
  const tc = useTranslations("Common");
  const [q, setQ] = useState("");
  // Photo-shoot spots only; dance studios and practice spaces live on /practice.
  const all = usePlaceStore().places.filter((p) => !isPracticeType(p.type));
  const places = all.filter((p) => placeMatches(p, q));

  return (
    <>
      <Nav />
      <div className="spots-shell">
        <h1 className="section-title">{t("title")}</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>{t("intro")}</p>
        <div className="page-actions">
          <SubmitSpotDialog className="btn" label={tc("submitSpot")} />
        </div>
        <hr className="divider" />
        <div className="search-row">
          <SearchBox value={q} onChange={setQ} placeholder={t("search")} />
        </div>

        <div className="grid spots-grid">
          {places.map((p) => <SpotCard key={p.id} place={p} />)}
          {places.length === 0 && (
            <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>
              {all.length === 0 ? t("empty") : t("noMatches")}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
