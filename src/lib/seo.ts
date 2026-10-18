import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * Search-engine helpers. URLs follow the "as-needed" locale rule in
 * i18n/routing.ts: English has no prefix (/events), the others do (/fi/events).
 * Canonical links must use these exact URLs - /en/... only redirects.
 */

/** Public path of a page in one language: ("fi", "/events") -> "/fi/events", ("en", "/") -> "/". */
export function localePath(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? clean || "/" : `/${locale}${clean}`;
}

/** Canonical URL + the same page in every language (hreflang), for Metadata.alternates. */
export function alternatesFor(locale: string, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localePath(l, path);
  languages["x-default"] = localePath(routing.defaultLocale, path);
  return { canonical: localePath(locale, path), languages };
}

/** Pages with their own title + description in the "Seo" messages. */
export type SeoPage = "home" | "map" | "calendar" | "events" | "spots" | "practice" | "community" | "about" | "donate";

/** Title, description, language links and share preview for a list page. */
export async function pageMetadata(locale: string, page: SeoPage, path: string): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Seo" });
  const title = t(`${page}Title`);
  const description = t(`${page}Description`);
  return {
    // The home page title is used as is; the others get "| CosOverHere" from the layout template.
    title: page === "home" ? { absolute: title } : title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: { title, description, url: localePath(locale, path), type: "website", locale },
  };
}

// ---------------- Structured data (schema.org JSON-LD) ----------------
// Lets Google show events with date, place and price in its event results.

type EventLike = {
  name: string; venue: string; city: string; country?: string; date: string; endDate?: string;
  startTime?: string; endTime?: string; lat: number; lng: number; image?: string; url?: string;
  admission?: "free" | "paid" | "mixed"; priceMin?: number;
};

/** schema.org Event for an event page. `pageUrl` is this page's absolute URL. */
export function eventJsonLd(e: EventLike, name: string, description: string | undefined, pageUrl: string) {
  const start = e.startTime ? `${e.date}T${e.startTime}` : e.date;
  const lastDay = e.endDate ?? e.date;
  const end = e.endTime ? `${lastDay}T${e.endTime}` : lastDay;
  // Only state a price when one is actually known (the "Free" shown by default is not sent to Google).
  const price = e.admission === "free" ? 0 : e.admission && e.priceMin != null ? e.priceMin : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    startDate: start,
    endDate: end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: pageUrl,
    ...(e.image ? { image: [e.image] } : {}),
    location: {
      "@type": "Place",
      name: e.venue,
      address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: e.country ?? "FI" },
      geo: { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lng },
    },
    ...(price != null
      ? { offers: { "@type": "Offer", price, priceCurrency: "EUR", availability: "https://schema.org/InStock", url: e.url ?? pageUrl } }
      : {}),
  };
}

type PlaceLike = { name: string; address?: string; city: string; country?: string; lat: number; lng: number; photos: { url: string }[] };

/** schema.org TouristAttraction for a spot page. */
export function placeJsonLd(p: PlaceLike, name: string, description: string | undefined, pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name,
    description,
    url: pageUrl,
    ...(p.photos[0] ? { image: p.photos.map((ph) => ph.url) } : {}),
    address: { "@type": "PostalAddress", ...(p.address ? { streetAddress: p.address } : {}), addressLocality: p.city, addressCountry: p.country ?? "FI" },
    geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
  };
}

/** JSON for a <script type="application/ld+json">; "<" escaped so text can't close the tag. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
