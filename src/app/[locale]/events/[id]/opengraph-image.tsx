import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getEvent } from "@/lib/serverData";
import { localText } from "@/lib/localText";
import { ogCard, OG_SIZE } from "@/lib/ogCard";
import { cityLabel } from "@/lib/cities";
import { fmtRange, fmtTimes } from "@/lib/data";

/** Share-preview image for /events/[id] (Facebook, Discord, X...). */
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Event";

export default async function Image({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const site = (await getTranslations({ locale: locale as Locale, namespace: "Metadata" }))("title");
  const e = await getEvent(id);
  if (!e) return ogCard({ title: site, site });
  // The image font has no Thai letters, so Thai previews use the English text.
  const txt = localText(e, locale === "th" ? "en" : locale);
  const times = fmtTimes(e.startTime, e.endTime);
  return ogCard({
    kicker: `${fmtRange(e.date, e.endDate)}${times ? ` | ${times}` : ""}`,
    title: txt.name,
    sub: `${e.venue}, ${cityLabel(e.city)}`,
    image: e.image,
    site,
  });
}
