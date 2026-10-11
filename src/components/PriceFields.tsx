"use client";

import { useTranslations } from "next-intl";
import type { Admission } from "@/types";
import type { PriceForm } from "@/lib/price";

/** Entry (free / paid / free + paid extras), price range and a note. Used by the admin and submit forms. */
export default function PriceFields({ value: v, onChange }: { value: PriceForm; onChange: (patch: Partial<PriceForm>) => void }) {
  const t = useTranslations("Price");
  return (
    <>
      <div className="field">
        <label>{t("admission")}</label>
        <select value={v.admission} onChange={(e) => onChange({ admission: e.target.value as Admission | "" })}>
          <option value="">{t("unknown")}</option>
          <option value="free">{t("free")}</option>
          <option value="paid">{t("paid")}</option>
          <option value="mixed">{t("mixedLong")}</option>
        </select>
      </div>
      {v.admission !== "free" && (
        <div className="field-row">
          <div className="field"><label>{t("from")}</label><input inputMode="decimal" value={v.priceMin} onChange={(e) => onChange({ priceMin: e.target.value })} placeholder="15" /></div>
          <div className="field"><label>{t("to")}</label><input inputMode="decimal" value={v.priceMax} onChange={(e) => onChange({ priceMax: e.target.value })} placeholder="25" /></div>
        </div>
      )}
      <div className="field"><label>{t("note")}</label><input value={v.priceNote} maxLength={160} onChange={(e) => onChange({ priceNote: e.target.value })} placeholder={t("notePlaceholder")} /></div>
    </>
  );
}
