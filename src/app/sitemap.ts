import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL, listLiveEvents, listLivePlaces } from "@/lib/serverData";
import { localePath } from "@/lib/seo";

/** Rebuilt at most once an hour, so new events show up for search engines. */
export const revalidate = 3600;

const PAGES = ["/", "/map", "/calendar", "/events", "/spots", "/practice", "/community", "/about", "/donate"];

/** One sitemap entry per page, listing the same page in every language (hreflang). */
function entry(path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = SITE_URL + localePath(l, path);
  return {
    url: SITE_URL + localePath(routing.defaultLocale, path),
    ...(lastModified ? { lastModified } : {}),
    priority,
    alternates: { languages },
  };
}

/** sitemap.xml: the main pages, every live event and every live spot. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, places] = await Promise.all([listLiveEvents(), listLivePlaces()]);
  return [
    ...PAGES.map((p) => entry(p, undefined, p === "/" ? 1 : 0.8)),
    ...events.map((e) => entry(`/events/${e.id}`, e.createdAt?.slice(0, 10), 0.7)),
    ...places.map((p) => entry(`/spots/${p.id}`, p.createdAt?.slice(0, 10), 0.6)),
  ];
}
