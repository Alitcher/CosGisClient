import { existsSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import type { Locale } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TicketIcon from "@/components/TicketIcon";

/** Link for "Props&Ops" in the story (the site that inspired this one). */
const propsops = (chunks: ReactNode) => (
  <a href="https://propsops.com/event" target="_blank" rel="noopener noreferrer">{chunks}</a>
);

/** Link for the "CC BY 4.0" text in the credits. */
const license = (chunks: ReactNode) => (
  <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{chunks}</a>
);

/**
 * About page photos: drop the files into public/about/ with these names.
 * Until a file is there, a dashed box with its file name shows instead.
 */
function AboutPhoto({ file, className }: { file: string; className: string }) {
  const src = `/about/${file}`;
  if (!existsSync(path.join(process.cwd(), "public", "about", file))) {
    return <div className={`${className} photo-slot`}>{`public${src}`}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- plain img: any size, no image service needed
  return <img className={className} src={src} alt="" />;
}

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

      {/* Site logo (same reindeer as the nav) on the left, title, intro and key facts on the right. */}
      <section className="about-hero shell">
        {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG, no image service needed */}
        <img className="about-logo" src="/logo.svg" alt="" />
        <div className="about-hero-text">
          <h1>
            {t.rich("title", { grad: (chunks) => <span className="grad">{chunks}</span> })}
          </h1>
          <p>{t("intro")}</p>
          <dl className="story-facts">
            {(["Founded", "Founder"] as const).map((f) => (
              <div key={f}>
                <dt>{t(`fact${f}`)}</dt>
                <dd>{t(`fact${f}Value`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The story: a few short paragraphs, past / present / future, a closing line. */}
      <section className="story shell">
        <h2 className="section-title">{t("storyTitle")}</h2>
        <div className="story-layout">
          <div className="story-text">
            {(["story1", "story2", "story3", "story4"] as const).map((k) => (
              <p key={k}>{t.rich(k, { propsops })}</p>
            ))}
            <ul className="story-time">
              {(["past", "present", "future"] as const).map((k) => (
                <li key={k}>
                  <b>{t(k)}</b>
                  <span>{t(`${k}Text`)}</span>
                </li>
              ))}
            </ul>
            <p className="story-tagline">{t("tagline")}</p>
          </div>
          <AboutPhoto file="story.jpg" className="story-photo" />
        </div>
      </section>

      <section className="story shell">
        <h2 className="section-title">{t("teamTitle")}</h2>
        <div className="grid team-grid">
          {/* Friend's card (team2) hidden for now: add "team2" back to this list to show it. */}
          {(["team1"] as const).map((k) => (
            <div key={k} className="card team-card">
              <AboutPhoto file={`${k}.jpg`} className="team-photo" />
              <div>
                <h3>{t(`${k}Name`)}</h3>
                <p>{t(`${k}Role`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="story shell">
        <h2 className="section-title">{t("nameTitle")}</h2>
        <p>{t("nameText")}</p>
      </section>

      <section className="story shell">
        <h2 className="section-title">{t("termsTitle")}</h2>
        <ol className="story-terms">
          <li>{t("terms1")}</li>
          <li>{t("terms2")}</li>
          <li>{t("terms3")}</li>
        </ol>
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

      <section className="cta-band shell">
        <h2>{t("ctaTitle")}</h2>
        <p>{t("ctaText")}</p>
        <div className="flex gap-sm center" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/map">{t("ctaMap")}</Link>
          <Link className="btn ghost" href="/spots">{t("ctaSpots")}</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
