"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { citiesIn, cityLabel, countriesIn, countryLabel, countryOf } from "@/lib/cities";
import {
  AGE_GROUPS, EMPTY_SECTION_FILTER, PRICE_KINDS, activeSectionFilters, matchesOption, matchesSection,
  type FilterKey, type Filterable, type SectionFilter,
} from "@/lib/sectionFilter";
import Icon from "./Icon";

const CITY_LIMIT = 4; // cities shown before "View more"

/**
 * A home page section's "Filters" button (with the number of picks), the picks as
 * removable chips, and the slide-in Filters panel: Country, City, Age, Price with round
 * checkmarks and a count per option. Choices only apply when "Show N results" is pressed.
 * Options come from the section's own items, so nothing empty is offered.
 * `end` (e.g. the section's "See all" link) sits at the right end of the same row.
 */
export default function SectionFilters({ value, onChange, items, end }: { value: SectionFilter; onChange: (f: SectionFilter) => void; items: Filterable[]; end?: ReactNode }) {
  const t = useTranslations("Filters");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SectionFilter>(value);
  const [moreCities, setMoreCities] = useState(false);

  const label = (key: FilterKey, o: string) =>
    key === "country" ? countryLabel(o as never, locale) : key === "city" ? cityLabel(o) : t(o as "kids");
  const groups: { key: FilterKey; title: string; options: string[] }[] = [
    { key: "country", title: t("country"), options: countriesIn(items) },
    { key: "city", title: t("city"), options: citiesIn(draft.country.length ? items.filter((i) => draft.country.includes(countryOf(i))) : items) },
    { key: "age", title: t("age"), options: [...AGE_GROUPS] },
    { key: "price", title: t("price"), options: [...PRICE_KINDS] },
  ];
  const toggle = (f: SectionFilter, key: FilterKey, o: string): SectionFilter => {
    const list = f[key] as string[];
    const next = { ...f, [key]: list.includes(o) ? list.filter((x) => x !== o) : [...list, o] };
    return key === "country" ? { ...next, city: [] } : next; // cities depend on the countries
  };
  const results = items.filter((i) => matchesSection(i, draft)).length;
  const picked = activeSectionFilters(value);

  function show() { setDraft(value); setMoreCities(false); setOpen(true); }

  return (
    <>
      <div className="sf-bar">
        <button type="button" className="sf-pill" onClick={show}>
          <Icon name="filter" size={16} />{t("filters")}{picked > 0 && <span className="sf-count">{picked}</span>}
        </button>
        {groups.flatMap((g) => (value[g.key] as string[]).map((o) => (
          <button key={`${g.key}-${o}`} type="button" className="sf-chip" onClick={() => onChange(toggle(value, g.key, o))} aria-label={t("remove", { name: label(g.key, o) })}>
            {label(g.key, o)}<Icon name="close" size={12} />
          </button>
        )))}
        {end && <div className="sf-end">{end}</div>}
      </div>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`sf-drawer${open ? " open" : ""}`} aria-label={t("filters")} aria-hidden={!open}>
        <div className="sf-head">
          <h3>{t("filters")}</h3>
          <button type="button" className="sf-x" onClick={() => setOpen(false)} aria-label={t("close")}><Icon name="close" size={22} /></button>
        </div>
        <div className="sf-body">
          {groups.map((g) => {
            const n = (draft[g.key] as string[]).length;
            const shown = g.key === "city" && !moreCities ? g.options.slice(0, CITY_LIMIT) : g.options;
            return (
              <section className="sf-group" key={g.key}>
                <h4>{g.title}{n > 0 && ` (${n})`}</h4>
                {shown.map((o) => {
                  const on = (draft[g.key] as string[]).includes(o);
                  // How many items this option would give with the other groups' picks.
                  const count = items.filter((i) => matchesSection(i, draft, g.key) && matchesOption(i, g.key, o)).length;
                  return (
                    <label key={o} className={`sf-opt${count === 0 && !on ? " dim" : ""}`}>
                      <input type="checkbox" checked={on} onChange={() => setDraft((d) => toggle(d, g.key, o))} />
                      <span className="sf-circle" aria-hidden />
                      {label(g.key, o)}
                      <span className="sf-n">{count}</span>
                    </label>
                  );
                })}
                {g.key === "city" && g.options.length > CITY_LIMIT && (
                  <button type="button" className="sf-more" onClick={() => setMoreCities((m) => !m)}>{moreCities ? `- ${t("viewLess")}` : `+ ${t("viewMore")}`}</button>
                )}
              </section>
            );
          })}
        </div>
        <div className="sf-foot">
          <button type="button" className="btn ghost" onClick={() => setDraft(EMPTY_SECTION_FILTER)}>{t("reset")}</button>
          <button type="button" className="btn" onClick={() => { onChange(draft); setOpen(false); }}>{t("showResults", { count: results })}</button>
        </div>
      </aside>
    </>
  );
}
