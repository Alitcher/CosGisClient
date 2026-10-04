"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EVENT_CATEGORIES, type City } from "@/types";
import { CITY_COUNTRY, cityLabel, countryLabel, type Country } from "@/lib/cities";
import { DEFAULT_FILTERS, activeFilterCount, type DatePreset, type MapFilters as Filters } from "@/lib/mapFilters";

const PRESETS: DatePreset[] = ["any", "7d", "30d", "3m", "custom"];

/** Toggle `v` in a multi-select list (empty list = All). */
function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

interface Props {
  value: Filters;
  onChange: (f: Filters) => void;
  countries: Country[]; // countries that have something on the map
  cities: City[]; // cities that have something on the map
  resultCount: number;
}

/** Collapsible filter panel at the top of the map sidebar. */
export default function MapFilters({ value: f, onChange, countries, cities, resultCount }: Props) {
  const t = useTranslations("MapFilters");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(f);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });

  // Only offer cities inside the chosen countries.
  const cityOptions = f.countries.length ? cities.filter((c) => f.countries.includes(CITY_COUNTRY[c])) : cities;

  function toggleCountry(c: Country) {
    const next = toggle(f.countries, c);
    // Drop picked cities that are no longer in any chosen country.
    const keep = next.length ? f.cities.filter((city) => next.includes(CITY_COUNTRY[city])) : f.cities;
    set({ countries: next, cities: keep });
  }

  return (
    <div className="mf">
      <button type="button" className="mf-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="mf-title">
          {t("filters")}
          {active > 0 && <span className="mf-badge">{active}</span>}
        </span>
        <span className="mf-count">{t("results", { count: resultCount })}</span>
        <span className={`mf-caret${open ? " up" : ""}`} aria-hidden>▾</span>
      </button>

      {open && (
        <div className="mf-panel">
          <section>
            <h5>{t("show")}</h5>
            <div className="mf-chips">
              {(["events", "spots", "practice"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={f.layers[k]}
                  className={`fchip${f.layers[k] ? " on" : ""}`}
                  onClick={() => set({ layers: { ...f.layers, [k]: !f.layers[k] } })}
                >
                  {t(`layer.${k}`)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h5>{t("category")}</h5>
            <div className="mf-chips">
              <button type="button" className={`fchip${f.categories.length === 0 ? " on" : ""}`} onClick={() => set({ categories: [] })}>
                {t("all")}
              </button>
              {EVENT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={f.categories.includes(c)}
                  className={`fchip${f.categories.includes(c) ? " on" : ""}`}
                  onClick={() => set({ categories: toggle(f.categories, c) })}
                >
                  {t(`cat.${c}`)}
                </button>
              ))}
            </div>
          </section>

          {countries.length > 0 && (
            <section>
              <h5>{t("country")}</h5>
              <div className="mf-chips">
                <button type="button" className={`fchip${f.countries.length === 0 ? " on" : ""}`} onClick={() => set({ countries: [] })}>
                  {t("all")}
                </button>
                {countries.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={f.countries.includes(c)}
                    className={`fchip${f.countries.includes(c) ? " on" : ""}`}
                    onClick={() => toggleCountry(c)}
                  >
                    {countryLabel(c, locale)}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h5>{t("city")}</h5>
            <div className="mf-chips">
              <button type="button" className={`fchip${f.cities.length === 0 ? " on" : ""}`} onClick={() => set({ cities: [] })}>
                {t("all")}
              </button>
              {cityOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={f.cities.includes(c)}
                  className={`fchip${f.cities.includes(c) ? " on" : ""}`}
                  onClick={() => set({ cities: toggle(f.cities, c) })}
                >
                  {cityLabel(c)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h5>{t("dates")}</h5>
            <div className="mf-chips">
              {PRESETS.map((p) => (
                <button key={p} type="button" className={`fchip${f.datePreset === p ? " on" : ""}`} onClick={() => set({ datePreset: p })}>
                  {t(`date.${p}`)}
                </button>
              ))}
            </div>
            {f.datePreset === "custom" && (
              <div className="mf-dates">
                <label>
                  {t("from")}
                  <input type="date" value={f.from} max={f.to || undefined} onChange={(e) => set({ from: e.target.value })} />
                </label>
                <label>
                  {t("to")}
                  <input type="date" value={f.to} min={f.from || undefined} onChange={(e) => set({ to: e.target.value })} />
                </label>
              </div>
            )}
          </section>

          {active > 0 && (
            <button type="button" className="mf-reset" onClick={() => onChange(DEFAULT_FILTERS)}>
              {t("reset")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
