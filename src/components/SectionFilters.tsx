"use client";

import { useLocale, useTranslations } from "next-intl";
import type { City, Country } from "@/types";
import { citiesIn, cityLabel, countriesIn, countryLabel, countryOf } from "@/lib/cities";
import { activeSectionFilters, EMPTY_SECTION_FILTER, type SectionFilter } from "@/lib/sectionFilter";

/**
 * Filter row above a home page section: country, city (only cities in the chosen
 * country), age group and price. Options come from the section's own items, so no
 * empty choices are offered.
 */
export default function SectionFilters({ value: f, onChange, items }: { value: SectionFilter; onChange: (f: SectionFilter) => void; items: { city: City; country?: Country }[] }) {
  const t = useTranslations("Filters");
  const locale = useLocale();
  const countries = countriesIn(items);
  const cities = citiesIn(f.country ? items.filter((i) => countryOf(i) === f.country) : items);
  return (
    <div className="section-filters">
      <select value={f.country} onChange={(e) => onChange({ ...f, country: e.target.value as Country | "", city: "" })} aria-label={t("country")}>
        <option value="">{t("allCountries")}</option>
        {countries.map((c) => <option key={c} value={c}>{countryLabel(c, locale)}</option>)}
      </select>
      <select value={f.city} onChange={(e) => onChange({ ...f, city: e.target.value })} aria-label={t("city")}>
        <option value="">{t("allCities")}</option>
        {cities.map((c) => <option key={c} value={c}>{cityLabel(c)}</option>)}
      </select>
      <select value={f.age} onChange={(e) => onChange({ ...f, age: e.target.value as SectionFilter["age"] })} aria-label={t("age")}>
        <option value="">{t("anyAge")}</option>
        <option value="kids">{t("kids")}</option>
        <option value="teens">{t("teens")}</option>
        <option value="adults">{t("adults")}</option>
      </select>
      <select value={f.price} onChange={(e) => onChange({ ...f, price: e.target.value as SectionFilter["price"] })} aria-label={t("price")}>
        <option value="">{t("anyPrice")}</option>
        <option value="free">{t("free")}</option>
        <option value="paid">{t("paid")}</option>
      </select>
      {activeSectionFilters(f) > 0 && <button type="button" className="btn ghost" onClick={() => onChange(EMPTY_SECTION_FILTER)}>{t("clear")}</button>}
    </div>
  );
}
