"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Nav from "@/components/Nav";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import SubmitEventDialog from "@/components/SubmitEventDialog";
import SearchBox from "@/components/SearchBox";
import UpcomingEvents from "@/components/UpcomingEvents";

/**
 * Local community: repeating get-togethers (cosplay cafes, craft workshops,
 * library meetups), no contests. Events with kind "community", each shown at its
 * next meeting. Conventions stay on the Events page.
 */
export default function CommunityPage() {
  const t = useTranslations("Community");
  const tc = useTranslations("Common");
  const [q, setQ] = useState("");

  return (
    <>
      <Nav />
      <AdSlot page="meetups" size="leaderboard" name="Top banner (under menu)" />
      <div className="spots-shell">
        <h1 className="section-title">{t("title")}</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>{t("intro")}</p>
        <div className="page-actions">
          <SubmitEventDialog className="btn" label={tc("submitMeetup")} kind="community" />
        </div>
        <hr className="divider" />
        <div className="search-row">
          <SearchBox value={q} onChange={setQ} placeholder={t("search")} />
        </div>
        <AdSlot page="meetups" size="leaderboard" name="Above the list" className="in-list" />
        <UpcomingEvents kind="community" limit={0} query={q} />
      </div>
      <Footer page="meetups" />
    </>
  );
}
