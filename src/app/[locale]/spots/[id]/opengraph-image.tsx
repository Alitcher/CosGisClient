import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getPlace } from "@/lib/serverData";
import { localText } from "@/lib/localText";
import { ogCard, OG_SIZE } from "@/lib/ogCard";
import { cityLabel } from "@/lib/cities";

/** Share-preview image for /spots/[id] (Facebook, Discord, X...). */
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Cosplay spot";

export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const site = (await getTranslations({ locale: locale as Locale, namespace: "Metadata" }))("title");
  const p = await getPlace(id);
  if (!p) return ogCard({ title: site, site });
  // The image font has no Thai letters, so Thai previews use the English text.
  const lang = locale === "th" ? "en" : locale;
  const type = (await getTranslations({ locale: lang as Locale, namespace: "PlaceTypes" }))(p.type);
  return ogCard({
    kicker: type,
    title: localText(p, lang).name,
    sub: p.address ?? cityLabel(p.city),
    image: p.photos[0]?.url,
    site,
  });
}
