"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { eventEndsOn } from "@/lib/data";
import { useEventStore } from "@/lib/eventsStore";
import { isFree } from "@/lib/price";
import { asNext, isCommunity } from "@/lib/recurrence";
import type { Event } from "@/types";
import EventCard from "./EventCard";
import SectionFilters from "./SectionFilters";
import { EMPTY_SECTION_FILTER, matchesSection } from "@/lib/sectionFilter";

/**
 * Event cards, soonest first. kind "convention": cons and one-off events (home page,
 * 4 cards). kind "community": repeating local meetups, each shown at its next meeting
 * with how it repeats. `limit` 0 = all (the Local community page). `filters` shows the
 * Filters button and panel (country / city / age / price) above the cards (SectionFilters),
 * with `seeAll` at the right end of that row.
 */
export default function UpcomingEvents({ kind = "convention", limit = 4, query = "", filters = false, seeAll }: { kind?: "convention" | "community"; limit?: number; query?: string; filters?: boolean; seeAll?: ReactNode }) {
  const [filter, setFilter] = useState(EMPTY_SECTION_FILTER);
  const tf = useTranslations("Filters");
  const { events } = useEventStore();
  const tCom = useTranslations("Community");
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const q = query.trim().toLowerCase();
  // "Free" also matches free entry with paid extras.
  const filterable = (e: Event) => ({ ...e, free: isFree(e) || e.admission === "mixed" });
  const all = events
    .filter((e) => isCommunity(e) === (kind === "community"))
    .map((e) => asNext(e, todayISO))
    .filter((e): e is Event => !!e && eventEndsOn(e) >= todayISO);
  const sorted = all
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q))
    .filter((e) => matchesSection(filterable(e), filter))
    .sort((a, b) => a.date.localeCompare(b.date));
  // Home: 4 cards; the 4th one only shows on tablets (2x2 grid), see .home-4 in globals.css
  const upcoming = limit ? sorted.slice(0, limit) : sorted;
  const bar = filters && all.length > 0
    ? <SectionFilters value={filter} onChange={setFilter} items={all.map(filterable)} end={seeAll} />
    : seeAll && <div className="sf-bar"><div className="sf-end">{seeAll}</div></div>;
  if (upcoming.length === 0 && (kind === "community" || all.length > 0)) {
    return <>{bar}<div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>{all.length === 0 ? tCom("empty") : tf("noMatches")}</div></>;
  }

  return (
    <>
    {bar}
    <div className={`grid up-grid${limit === 4 ? " home-4" : ""}`}>
      {upcoming.map((e) => <EventCard key={e.id} event={e} todayISO={todayISO} />)}
    </div>
    </>
  );
}
