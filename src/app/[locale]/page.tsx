import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroMap from "@/components/HeroMap";
import UpcomingEvents from "@/components/UpcomingEvents";
import SubmitEventDialog from "@/components/SubmitEventDialog";
import SubmitSpotDialog from "@/components/SubmitSpotDialog";
import HotSpots from "@/components/HotSpots";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");

  return (
    <>
      <Nav />

      <section className="hero shell">
        <div className="hero-grid">
          <div>
            <h1>
              {t.rich("title", { grad: (chunks) => <span className="grad">{chunks}</span> })}
            </h1>
            <p className="lead">{t("lead")}</p>
          </div>

          {/* Interactive map, with the stats under it */}
          <div>
            <div className="hero-visual">
              <HeroMap title={t("mapTitle")} />
            </div>
            <div className="hero-stats">
              <div className="stat"><div className="n">12</div><div className="l">{t("statConventions")}</div></div>
              <div className="stat"><div className="n">7</div><div className="l">{t("statVenues")}</div></div>
              <div className="stat"><div className="n">3</div><div className="l">{t("statCities")}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="upcoming shell">
        <div className="up-head">
          <div>
            <h2 className="section-title">{t("upcomingTitle")}</h2>
          </div>
          <div className="flex gap-sm">
            <SubmitEventDialog className="btn" label={tc("submitEvent")} />
            <Link className="btn ghost" href="/events">{t("seeAllEvents")}</Link>
          </div>
        </div>
        <UpcomingEvents />
      </section>

      <section className="upcoming hot-spots shell">
        <div className="up-head">
          <div>
            <h2 className="section-title">{t("hotSpotsTitle")}</h2>
          </div>
          <div className="flex gap-sm">
            <SubmitSpotDialog className="btn" label={tc("submitSpot")} />
            <Link className="btn ghost" href="/spots">{t("seeAllSpots")}</Link>
          </div>
        </div>
        <HotSpots />
      </section>

      <Footer />
    </>
  );
}
