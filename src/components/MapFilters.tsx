"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { EVENT_CATEGORIES, type City } from "@/types";
import { cityLabel, countryLabel, type Country } from "@/lib/cities";
import Icon from "./Icon";
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
  cityCountry: Map<City, Country>; // which country each of those cities is in
  resultCount: number;
}

/**
 * Map filters, same look as the home page sections: a small "Filters" pill (with the
 * number of active filters) floating on the map, opening a slide-in panel. Changes
 * apply right away; "Show N events" just closes the panel.
 */
export default function MapFilters({ value: f, onChange, countries, cities, cityCountry, resultCount }: Props) {
  const t = useTranslations("MapFilters");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(f);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });

  // Only offer cities inside the chosen countries.
  const inCountries = (city: City, list: Country[]) => list.includes(cityCountry.get(city) ?? "FI");
  const cityOptions = f.countries.length ? cities.filter((c) => inCountries(c, f.countries)) : cities;

  function toggleCountry(c: Country) {
    const next = toggle(f.countries, c);
    // Drop picked cities that are no longer in any chosen country.
    const keep = next.length ? f.cities.filter((city) => inCountries(city, next)) : f.cities;
    set({ countries: next, cities: keep });
  }

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mf">
      <button type="button" className="sf-pill mf-pill" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon name="filter" size={16} />{t("filters")}{active > 0 && <span className="sf-count">{active}</span>}
      </button>

      {open && createPortal(<>
        <div className="overlay" onClick={() => setOpen(false)} />
        <aside className="sf-drawer open" aria-label={t("filters")}>
        <div className="sf-head">
          <h3>{t("filters")}</h3>
          <button type="button" className="sf-x" onClick={() => setOpen(false)} aria-label={t("close")}><Icon name="close" size={22} /></button>
        </div>
        <div className="sf-body mf-panel">
          <section>
            <h5>{t("show")}</h5>
            <div className="mf-chips">
              {(["events", "community", "spots", "practice"] as const).map((k) => (
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

        </div>
        <div className="sf-foot">
          <button type="button" className="btn ghost" disabled={active === 0} onClick={() => onChange(DEFAULT_FILTERS)}>{t("reset")}</button>
          <button type="button" className="btn" onClick={() => setOpen(false)}>{t("showResults", { count: resultCount })}</button>
        </div>
        </aside>
      </>, document.body)}
    </div>
  );
}
