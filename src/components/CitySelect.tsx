"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CITY_OPTIONS, COUNTRIES, cityLabel, countryLabel } from "@/lib/cities";
import type { CityDetect } from "@/lib/useCityFromCoords";
import type { City, Country } from "@/types";

const OTHER = "__other__";

/**
 * Country + City dropdowns for the event/spot forms, with a note on the
 * auto-detection. Both are filled from the coordinates (useCityFromCoords) and
 * stay editable. A detected/saved city missing from the list is added to it;
 * "Other..." switches City to a text field for any town.
 */
export default function CitySelect({
  country,
  city,
  onCountry,
  onCity,
  detect,
}: {
  country: Country;
  city: City;
  onCountry: (c: Country) => void;
  onCity: (c: City) => void;
  detect: CityDetect;
}) {
  const t = useTranslations("SubmitForm");
  const locale = useLocale();
  const [typing, setTyping] = useState(false);
  const listed = CITY_OPTIONS[country];
  const options = city && !listed.includes(city) ? [city, ...listed] : listed;

  return (
    <>
      <div className="field">
        <label>{t("country")}</label>
        <select
          value={country}
          onChange={(e) => { onCountry(e.target.value as Country); onCity(""); setTyping(false); }}
        >
          {COUNTRIES.map((c) => <option key={c} value={c}>{countryLabel(c, locale)}</option>)}
        </select>
      </div>
      <div className="field">
        <label>{t("city")}</label>
        {typing ? (
          <input value={city} onChange={(e) => onCity(e.target.value)} maxLength={80} placeholder={t("cityPlaceholder")} autoFocus />
        ) : (
          <select
            value={city}
            onChange={(e) => {
              if (e.target.value === OTHER) { setTyping(true); onCity(""); }
              else onCity(e.target.value);
            }}
          >
            <option value="" disabled>{t("cityChoose")}</option>
            {options.map((c) => <option key={c} value={c}>{cityLabel(c)}</option>)}
            <option value={OTHER}>{t("cityOther")}</option>
          </select>
        )}
        {detect === "detecting" && <p className="muted field-note">{t("cityDetecting")}</p>}
        {detect === "found" && <p className="muted field-note">{t("cityDetected")}</p>}
        {detect === "unsupported" && <p className="field-note warn">{t("cityUnsupported")}</p>}
        {detect === "unknown" && <p className="field-note warn">{t("cityUnknown")}</p>}
        {detect === "idle" && !city && <p className="muted field-note">{t("cityFromLocation")}</p>}
      </div>
    </>
  );
}
