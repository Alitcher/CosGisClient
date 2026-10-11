import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SpotCard from "@/components/SpotCard";
import { getPlace } from "@/lib/serverData";
import { localText } from "@/lib/localText";
import { cityLabel } from "@/lib/cities";
import { isPracticeType } from "@/types";

type Props = { params: Promise<{ locale: string; id: string }> };

/**
 * One spot's (or practice place's) own page, mainly for share previews: the
 * title/description below plus the image from opengraph-image.tsx.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const p = await getPlace(id);
  if (!p) return {};
  const txt = localText(p, locale);
  const where = p.address ?? cityLabel(p.city);
  const description = [where, txt.description].filter(Boolean).join(". ").slice(0, 300);
  return {
    title: txt.name,
    description,
    alternates: { canonical: `/${locale}/spots/${id}` },
    openGraph: { title: txt.name, description, url: `/${locale}/spots/${id}`, type: "website" },
    twitter: { card: "summary_large_image", title: txt.name, description },
  };
}

export default async function SpotPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const p = await getPlace(id);
  if (!p) notFound();
  const t = await getTranslations("Detail");
  const practice = isPracticeType(p.type);

  return (
    <>
      <Nav />
      <div className="spots-shell detail">
        <Link className="detail-back" href={practice ? "/practice" : "/spots"}>{t("allSpots")}</Link>
        <div className="detail-spot">
          <SpotCard place={p} />
          {p.openingHours && (
            <p className="detail-text"><b>{t("openingHours")}:</b> {p.openingHours}</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
