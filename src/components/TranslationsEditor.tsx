"use client";

import { LANGS, type I18n, type Lang } from "@/types";

const LANG_NAME: Record<Lang, string> = { en: "English", fi: "Finnish", et: "Estonian", th: "Thai" };

/**
 * Admin: the item's original language plus its name/description in the other
 * languages. The server fills these in automatically after saving; anything
 * typed here is marked hand-written (auto: false) and never auto-replaced.
 */
export default function TranslationsEditor({
  lang,
  i18n,
  onLang,
  onI18n,
}: {
  lang: Lang | "";
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
        Filled in automatically after saving. Edit any of them to fix it; edited ones are kept as you wrote them.
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
          <input value={i18n[l]?.name ?? ""} onChange={(e) => set(l, "name", e.target.value)} placeholder="Name" maxLength={120} />
          <textarea rows={2} value={i18n[l]?.description ?? ""} onChange={(e) => set(l, "description", e.target.value)} placeholder="Description" maxLength={800} />
        </div>
      ))}
    </details>
  );
}
