"use client";

import { useTranslations } from "next-intl";
import type { AgeForm } from "@/lib/age";

/**
 * Suggested age: an "All ages" checkbox (ticked by default). Unticked, it shows
 * age from (required) / to (optional), so any range works, e.g. 4-12 or 7+.
 * Used by the admin and submit forms.
 */
export default function AgeFields({ value: v, onChange }: { value: AgeForm; onChange: (patch: Partial<AgeForm>) => void }) {
  const t = useTranslations("Age");
  return (
    <>
      <div className="field">
        <label>{t("title")}</label>
        <label className="check-label">
          <input type="checkbox" checked={!!v.all} onChange={(e) => onChange({ all: e.target.checked })} /> {t("allAges")}
        </label>
      </div>
      {!v.all && (
        <div className="field-row">
          <div className="field"><label>{t("from")}</label><input inputMode="numeric" maxLength={2} value={v.ageMin} onChange={(e) => onChange({ ageMin: e.target.value })} placeholder="7" /></div>
          <div className="field"><label>{t("to")}</label><input inputMode="numeric" maxLength={2} value={v.ageMax} onChange={(e) => onChange({ ageMax: e.target.value })} placeholder="17" /></div>
        </div>
      )}
    </>
  );
}
