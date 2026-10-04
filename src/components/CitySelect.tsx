"use client";

import { useTranslations } from "next-intl";
import { CITIES, cityLabel } from "@/lib/cities";
import type { CityDetect } from "@/lib/useCityFromCoords";
import type { City } from "@/types";

/** City dropdown for the event/spot forms, with a note on the auto-detection. */
export default function CitySelect({
  value,
  onChange,
  detect,
}: {
  value: City;
  onChange: (c: City) => void;
  detect: CityDetect;
}) {
  const t = useTranslations("SubmitForm");
  return (
    <div className="field">
      <label>{t("city")}</label>
      <select value={value} onChange={(e) => onChange(e.target.value as City)}>
        {CITIES.map((c) => <option key={c} value={c}>{cityLabel(c)}</option>)}
      </select>
      {detect === "detecting" && <p className="muted field-note">{t("cityDetecting")}</p>}
      {detect === "found" && <p className="muted field-note">{t("cityDetected")}</p>}
      {detect === "unsupported" && <p className="field-note warn">{t("cityUnsupported")}</p>}
      {detect === "unknown" && <p className="field-note warn">{t("cityUnknown")}</p>}
    </div>
  );
}
