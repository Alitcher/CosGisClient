import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default async function DonatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Donate");

  return (
    <>
      <Nav />

      <section className="d-hero">
        <span className="d-emoji">☕</span>
        <h1>{t.rich("title", { grad: (chunks) => <span className="grad">{chunks}</span> })}</h1>
        <p>{t("intro")}</p>
        <div className="bmc-wrap">
          <a className="bmc" href="https://www.buymeacoffee.com/" target="_blank" rel="noopener noreferrer">
            <span className="cup">☕</span> {t("button")}
          </a>
          <span className="bmc-note">{t("buttonNote")}</span>
        </div>
      </section>

      <section className="tiers">
        <div style={{ textAlign: "center" }}>
          <h2 className="section-title">{t("tiersTitle")}</h2>
        </div>
        <div className="grid tiers-grid">
          <div className="card tier">
            <div className="cups">☕</div>
            <h3>{t("espresso")}</h3>
            <div className="price">€3</div>
            <ul>
              <li>{t("espresso1")}</li>
              <li>{t("espresso2")}</li>
              <li>{t("espresso3")}</li>
            </ul>
          </div>
          <div className="card tier pop">
            <span className="badge">{t("mostLoved")}</span>
            <div className="cups">☕☕</div>
            <h3>{t("latte")}</h3>
            <div className="price">€8</div>
            <ul>
              <li>{t("latte1")}</li>
              <li>{t("latte2")}</li>
              <li>{t("latte3")}</li>
            </ul>
          </div>
          <div className="card tier">
            <div className="cups">☕☕☕</div>
            <h3>{t("pot")}</h3>
            <div className="price">€20</div>
            <ul>
              <li>{t("pot1")}</li>
              <li>{t("pot2")}</li>
              <li>{t("pot3")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="why">
        <div className="card why-card">
          <h2>{t("whyTitle")}</h2>
          <p>{t("whyText")}</p>
          <div className="why-stats">
            <div className="s"><div className="n">€0</div><div className="l">{t("statAds")}</div></div>
            <div className="s"><div className="n">100%</div><div className="l">{t("statToProject")}</div></div>
            <div className="s"><div className="n">∞</div><div className="l">{t("statGratitude")}</div></div>
          </div>
        </div>
      </section>

      <section className="other">
        <a href="#">{t("starGithub")}</a>
        <a href="#">{t("share")}</a>
        <a href="#">{t("submitSpot")}</a>
      </section>

      <Footer />
    </>
  );
}
