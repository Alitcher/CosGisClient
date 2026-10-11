"use client";

import { LANGS, type I18n, type Lang } from "@/types";

const LANG_NAME: Record<Lang, string> = { en: "English", fi: "Finnish", et: "Estonian", th: "Thai" };

/**
 * Admin: the item's original language plus its name and description in the
 * other languages. The name box starts with the original name (names are not
 * machine-translated); change it only if the name differs in that language.
 * The server fills the descriptions in after saving; anything typed here is
 * marked hand-written (auto: false) and never auto-replaced.
 */
export default function TranslationsEditor({
  lang,
  i18n,
  name,
  nameLabel,
  onLang,
  onI18n,
}: {
  lang: Lang | "";
  name: string; // the original name, shown until a different one is typed
  nameLabel: string; // "Event name" / "Spot name"
  i18n: I18n;
  onLang: (l: Lang | "") => void;
  onI18n: (next: I18n) => void;
}) {
  const set = (l: Lang, field: "name" | "description", value: string) =>
    onI18n({ ...i18n, [l]: { ...i18n[l], [field]: value, auto: false } });

  return (
    <details className="field translations">
      <summary>Translations</summary>
      <p className="muted field-note">
        The {nameLabel.toLowerCase()} and description in other languages. Descriptions are filled in automatically after saving.
        Edit any of them to fix it; edited ones are kept as you wrote them.
      </p>
      <div className="field">
        <label>Original language (of the name and description above)</label>
        <select value={lang} onChange={(e) => onLang(e.target.value as Lang | "")}>
          <option value="">Detect automatically</option>
          {LANGS.map((l) => <option key={l} value={l}>{LANG_NAME[l]}</option>)}
        </select>
      </div>
      {LANGS.filter((l) => l !== lang).map((l) => (
        <div key={l} className="translation">
          <h5>
            {LANG_NAME[l]}
            {i18n[l] && <span className="muted">{i18n[l]?.auto === false ? " - edited" : " - automatic"}</span>}
          </h5>
          <label className="muted">{nameLabel}</label>
          <input value={i18n[l]?.name || name} onChange={(e) => set(l, "name", e.target.value)} placeholder={nameLabel} maxLength={120} />
          <label className="muted">Description</label>
          <textarea rows={2} value={i18n[l]?.description ?? ""} onChange={(e) => set(l, "description", e.target.value)} placeholder="Description" maxLength={800} />
        </div>
      ))}
    </details>
  );
}
