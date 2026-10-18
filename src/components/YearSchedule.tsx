"use client";

import { useLocale, useTranslations } from "next-intl";
import { occurrences } from "@/lib/recurrence";
import type { Event } from "@/types";

/**
 * Every meeting of a repeating community meetup in the current year: a plain table
 * Month | Date | Notes with one row per month, January..December. Dates are plain text
 * ("Saturday 7"); the Notes column says which meeting is next. Only this calendar year:
 * from January the table shows the new year.
 */
export default function YearSchedule({ event, today }: { event: Pick<Event, "date" | "endDate" | "recurrence">; today: string }) {
  const t = useTranslations("Repeat");
  const locale = useLocale();
  if (!event.recurrence) return null;
  const year = today.slice(0, 4);
  const dates = occurrences(event, `${year}-01-01`, `${year}-12-31`);
  if (dates.length === 0) return null;
  const next = dates.find((d) => d >= today);

  // Gregorian calendar also in Thai (the default there is the Buddhist year).
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", calendar: "gregory" });
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", calendar: "gregory" });
  const at = (iso: string) => new Date(`${iso}T12:00:00`);
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

  return (
    <div className="year-schedule">
      <h2>{t("yearTitle", { year })}</h2>
      <table>
        <thead>
          <tr><th scope="col">{t("colMonth")}</th><th scope="col">{t("colDate")}</th><th scope="col">{t("colNotes")}</th></tr>
        </thead>
        <tbody>
          {months.map((m) => {
            const days = dates.filter((d) => d.startsWith(m));
            const note =
              days.length === 0 ? t("noteNone")
              : next && days.includes(next) ? t("noteNext")
              : days.every((d) => d < today) ? t("notePast")
              : "";
            return (
              <tr key={m}>
                <th scope="row">{monthFmt.format(at(`${m}-15`))}</th>
                <td>
                  {days.length === 0 ? <span className="ys-none">-</span> : days.map((d) => dayFmt.format(at(d))).join(", ")}
                </td>
                <td className="muted">{note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted ys-count">{t("yearCount", { count: dates.length })}</p>
    </div>
  );
}
