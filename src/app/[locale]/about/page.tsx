import type { ReactNode } from "react";
import type { Locale } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/Nav";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import TicketIcon from "@/components/TicketIcon";

/** Link for the "CC BY 4.0" text in the credits. */
const license = (chunks: ReactNode) => (
  <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{chunks}</a>
);

/** Search-engine title, description and language links (lib/seo.ts). */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "about", "/about");
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("About");

  return (
    <>
      <Nav />
      <AdSlot page="about" size="leaderboard" name="Top banner (under menu)" />

      <section className="about-hero shell">
        <h1>
          {t.rich("title", { grad: (chunks) => <span className="grad">{chunks}</span> })}
        </h1>
        <p>{t("intro")}</p>
      </section>

      <section className="credits shell">
        <h2 className="section-title">{t("creditsTitle")}</h2>
        <p className="credits-lead">{t("creditsLead")}</p>
        <div className="grid credits-grid">
          <div className="card credit">
            <TicketIcon size={44} />
            <div>
              <h3>{t("creditIconTitle")}</h3>
              <p>{t("creditIconUse")}</p>
              <p className="credit-by">
                {t.rich("creditIconBy", {
                  author: (chunks) => <a href="https://icon-icons.com/authors/1444-icon-factory" target="_blank" rel="noopener noreferrer">{chunks}</a>,
                  site: (chunks) => <a href="https://icon-icons.com/" target="_blank" rel="noopener noreferrer">{chunks}</a>,
                })}
              </p>
              <p className="credit-license">{t.rich("creditLicense", { license })} | {t("creditUnchanged")}</p>
            </div>
          </div>
          <div className="card credit">
            <div>
              <h3>{t("creditDataTitle")}</h3>
              <p>{t("creditDataUse")}</p>
              <p className="credit-by">
                {t.rich("creditDataBy", {
                  api: (chunks) => <a href="https://api.hel.fi/linkedevents/v1/" target="_blank" rel="noopener noreferrer">{chunks}</a>,
                })}
              </p>
              <p className="credit-license">{t.rich("creditLicense", { license })}</p>
            </div>
          </div>
        </div>
      </section>

      <AdSlot page="about" size="billboard" name="Before the last section" />
      <section className="cta-band shell">
        <h2>{t("ctaTitle")}</h2>
        <p>{t("ctaText")}</p>
        <div className="flex gap-sm center" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/map">{t("ctaMap")}</Link>
          <Link className="btn ghost" href="/spots">{t("ctaSpots")}</Link>
        </div>
      </section>

      <Footer page="about" />
    </>
  );
}
