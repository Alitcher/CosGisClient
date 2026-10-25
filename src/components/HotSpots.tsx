"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePlaceStore } from "@/lib/placesStore";
import { isPracticeType } from "@/types";
import SpotCard from "./SpotCard";
import SectionFilters from "./SectionFilters";
import { EMPTY_SECTION_FILTER, matchesSection } from "@/lib/sectionFilter";

/**
 * The home page's top photo spots (3, or 4 on tablets). There's no rating or popularity data yet,
 * so "top" means the most complete listings: ones with a photo first, then the
 * most themes, then the longest description. Practice places are left out.
 * The Filters panel (country / city / age / price) narrows them first; `seeAll` sits on its row.
 */
export default function HotSpots({ seeAll }: { seeAll?: ReactNode }) {
  const t = useTranslations("Filters");
  const [filter, setFilter] = useState(EMPTY_SECTION_FILTER);
  const all = usePlaceStore().places.filter((p) => !isPracticeType(p.type));
  // A spot is free unless marked paid (same as the price tag on its card).
  const filterable = (p: (typeof all)[number]) => ({ ...p, free: p.price !== "paid" });
  const places = all.filter((p) => matchesSection(filterable(p), filter));
  const score = (p: (typeof places)[number]) => [
    p.photos.length > 0 ? 1 : 0,
    p.themes.length,
    p.description?.length ?? 0,
  ];
  const top = places
    .slice()
    .sort((a, b) => {
      const [x, y] = [score(a), score(b)];
      for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i];
      return 0;
    })
    .slice(0, 4); // 4th one only shows on tablets (2x2 grid), see .home-4 in globals.css

  return (
    <>
      {all.length > 0
        ? <SectionFilters value={filter} onChange={setFilter} items={all.map(filterable)} end={seeAll} />
        : seeAll && <div className="sf-bar"><div className="sf-end">{seeAll}</div></div>}
      {top.length === 0 && all.length > 0 ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>{t("noMatches")}</div>
      ) : (
        <div className="grid spots-grid home-4">
          {top.map((p) => <SpotCard key={p.id} place={p} />)}
        </div>
      )}
    </>
  );
}
