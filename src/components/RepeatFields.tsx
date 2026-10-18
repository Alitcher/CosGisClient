"use client";

import { useLocale, useTranslations } from "next-intl";
import { nthOfMonth, weekdayName, type RepeatForm } from "@/lib/recurrence";

/**
 * "What is it?" (convention / local community meetup) and, for meetups, how it
 * repeats: every week, every 2 weeks, once a month (1st..4th / last weekday) or
 * custom dates. The weekday comes from the first date. Used by the admin and submit forms.
 */
export default function RepeatFields({ value: v, onChange, date }: { value: RepeatForm; onChange: (patch: Partial<RepeatForm>) => void; date: string }) {
  const t = useTranslations("EventKind");
  const locale = useLocale();
  const day = weekdayName(date, locale);
  // Monthly without a choice yet: the nth weekday the first date falls on (a 5th one counts as last).
  const autoNth = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? (nthOfMonth(date) >= 5 ? "-1" : String(nthOfMonth(date))) : "1";
  const setDate = (i: number, d: string) => onChange({ dates: v.dates.map((x, j) => (j === i ? d : x)) });
  const setSlot = (i: number, patch: Partial<RepeatForm["slots"][number]>) => onChange({ slots: v.slots.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <>
      <div className="field">
        <label>{t("kindLabel")}</label>
        <select value={v.kind} onChange={(e) => onChange({ kind: e.target.value as RepeatForm["kind"] })}>
          <option value="convention">{t("convention")}</option>
          <option value="community">{t("community")}</option>
        </select>
      </div>
      {v.kind === "community" && (
        <>
          <div className="field-row">
            <div className="field">
              <label>{t("repeats")}</label>
              <select value={v.freq} onChange={(e) => onChange({ freq: e.target.value as RepeatForm["freq"] })}>
                <option value="weekly">{t("freqWeekly")}</option>
                <option value="biweekly">{t("freqBiweekly")}</option>
                <option value="monthly">{t("freqMonthly")}</option>
                <option value="custom">{t("freqCustom")}</option>
              </select>
            </div>
            {v.freq === "monthly" && (
              <div className="field">
                <label>{t("which")}</label>
                <select value={v.nth || autoNth} onChange={(e) => onChange({ nth: e.target.value as RepeatForm["nth"] })}>
                  {(["1", "2", "3", "4"] as const).map((n) => <option key={n} value={n}>{t(`nth${n}`)} {day}</option>)}
                  <option value="-1">{t("nthLast")} {day}</option>
                </select>
              </div>
            )}
          </div>
          {day && v.freq !== "custom" && <p className="field-note muted">{t("dayHint", { day })}</p>}
          {v.freq === "custom" && (
            <div className="field">
              <label>{t("moreDates")}</label>
              {v.dates.map((d, i) => (
                <div className="flex gap-sm" key={i} style={{ marginBottom: 8 }}>
                  <input type="date" value={d} onChange={(e) => setDate(i, e.target.value)} />
                  <button type="button" className="btn ghost" onClick={() => onChange({ dates: v.dates.filter((_, j) => j !== i) })}>{t("remove")}</button>
                </div>
              ))}
              <button type="button" className="btn ghost" onClick={() => onChange({ dates: [...v.dates, ""] })}>{t("addDate")}</button>
            </div>
          )}
          <div className="field">
            <label>{t("slots")}</label>
            <p className="field-note muted" style={{ marginTop: 0, marginBottom: 8 }}>{t("slotsHint")}</p>
            {v.slots.map((s, i) => (
              <div className="flex gap-sm" key={i} style={{ marginBottom: 8, flexWrap: "wrap" }}>
                <input type="time" value={s.start} onChange={(e) => setSlot(i, { start: e.target.value })} aria-label={t("slotStart")} style={{ maxWidth: 130 }} />
                <input type="time" value={s.end} onChange={(e) => setSlot(i, { end: e.target.value })} aria-label={t("slotEnd")} style={{ maxWidth: 130 }} />
                <input value={s.venue} maxLength={120} onChange={(e) => setSlot(i, { venue: e.target.value })} placeholder={t("slotVenue")} style={{ flex: 1, minWidth: 140 }} />
                <button type="button" className="btn ghost" onClick={() => onChange({ slots: v.slots.filter((_, j) => j !== i) })}>{t("remove")}</button>
              </div>
            ))}
            <button type="button" className="btn ghost" onClick={() => onChange({ slots: [...v.slots, { start: "", end: "", venue: "" }] })}>{t("addSlot")}</button>
          </div>
          <div className="field-row">
            <div className="field"><label>{t("until")}</label><input type="date" value={v.until} onChange={(e) => onChange({ until: e.target.value })} /></div>
            <div className="field"><label>{t("note")}</label><input value={v.note} maxLength={160} onChange={(e) => onChange({ note: e.target.value })} placeholder={t("notePlaceholder")} /></div>
          </div>
        </>
      )}
    </>
  );
}
