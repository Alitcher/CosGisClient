import type { Locale } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroMap from "@/components/HeroMap";
import UpcomingEvents from "@/components/UpcomingEvents";
import HotSpots from "@/components/HotSpots";
import { listLiveEvents } from "@/lib/serverData";
import { eventEndsOn } from "@/lib/data";
import { isCommunity } from "@/lib/recurrence";

/** Search-engine title, description and language links (lib/seo.ts). */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "home", "/");
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Home");

  // Hero numbers from the real data: upcoming live events, their venues and cities.
  // (The event list is cached for an hour; Helsinki date decides what "upcoming" is.)
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date());
  const upcoming = (await listLiveEvents()).filter((e) => e.status === "live" && !isCommunity(e) && eventEndsOn(e) >= today);
  const stats = {
    events: upcoming.length,
    venues: new Set(upcoming.map((e) => e.venue.trim().toLowerCase())).size,
    cities: new Set(upcoming.map((e) => `${e.country ?? "FI"}:${e.city}`)).size,
  };

  return (
    <>
      <Nav />

      <section className="hero shell">
        <div className="hero-grid">
          {/* Grid areas (globals.css): desktop = text + stats on the left, map on the
              right; tablet/phone = text, map, then stats. */}
          <div className="hero-text">
            <h1>
              {t.rich("title", { grad: (chunks) => <span className="grad">{chunks}</span> })}
            </h1>
            <p className="lead">{t("lead")}</p>
          </div>

          <div className="hero-visual">
            <HeroMap title={t("mapTitle")} />
          </div>

          {/* Hidden when the API is down, rather than showing zeros. */}
          {stats.events > 0 && (
            <div className="hero-stats">
              <div className="stat"><div className="n">{stats.events}</div><div className="l">{t("statConventions")}</div></div>
              <div className="stat"><div className="n">{stats.venues}</div><div className="l">{t("statVenues")}</div></div>
              <div className="stat"><div className="n">{stats.cities}</div><div className="l">{t("statCities")}</div></div>
            </div>
          )}
        </div>
      </section>

      <section className="upcoming shell">
        <div className="up-head">
          <div>
            <h2 className="section-title">{t("upcomingTitle")}</h2>
            {t("upcomingDesc") && <p className="section-desc muted">{t("upcomingDesc")}</p>}
          </div>
        </div>
        <UpcomingEvents filters seeAll={<Link className="see-all" href="/events">{t("seeAllEvents")}</Link>} />
      </section>

      {/* Repeating local meetups (cosplay cafes, workshops, library clubs), kept apart from the cons. */}
      <section className="upcoming community shell">
        <div className="up-head">
          <div>
            <h2 className="section-title">{t("communityTitle")}</h2>
            {t("communityDesc") && <p className="section-desc muted">{t("communityDesc")}</p>}
          </div>
        </div>
        <UpcomingEvents kind="community" filters seeAll={<Link className="see-all" href="/community">{t("seeAllCommunity")}</Link>} />
      </section>

      <section className="upcoming hot-spots shell">
        <div className="up-head">
          <div>
            <h2 className="section-title">{t("hotSpotsTitle")}</h2>
            {t("hotSpotsDesc") && <p className="section-desc muted">{t("hotSpotsDesc")}</p>}
          </div>
        </div>
        <HotSpots seeAll={<Link className="see-all" href="/spots">{t("seeAllSpots")}</Link>} />
      </section>

      <Footer />
    </>
  );
}
