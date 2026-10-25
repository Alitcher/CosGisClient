import { useState, useSyncExternalStore } from "react";
import { VISITOR_COUNTRY_COOKIE, countriesIn, type Country } from "./cities";
import { EMPTY_SECTION_FILTER, type SectionFilter } from "./sectionFilter";

/** The visitor's country from the cookie set by src/proxy.ts, or null (= all countries). */
function readVisitorCountry(): Country | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${VISITOR_COUNTRY_COOKIE}=([A-Z]{2})`));
  return (m?.[1] as Country | undefined) ?? null;
}
const noSubscribe = () => () => {}; // the cookie does not change while the page is open

/**
 * Filter state for an event list that starts on the visitor's country, if any of
 * `items` are there. Otherwise it starts empty (all countries). Once the visitor
 * changes the filters, their choice is used instead.
 */
export function useVisitorCountryFilter(items: { country?: Country }[]) {
  // null on the server and during hydration, so the first render matches the server HTML
  const country = useSyncExternalStore(noSubscribe, readVisitorCountry, () => null);
  const [picked, setPicked] = useState<SectionFilter | null>(null);
  const start =
    country && countriesIn(items).includes(country) ? { ...EMPTY_SECTION_FILTER, country: [country] } : EMPTY_SECTION_FILTER;
  return [picked ?? start, setPicked as (f: SectionFilter) => void] as const;
}
