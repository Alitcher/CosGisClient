"use client";

import { useLocale, useTranslations } from "next-intl";
import { meetingSlots, occurrences } from "@/lib/recurrence";
import { fmtTimes } from "@/lib/data";
import type { Event } from "@/types";

/**
 * Every meeting of a repeating community meetup in the current year: a plain table
 * Month | Date | Time | Location | Notes, months January..December. Each meeting date
 * and each group on it (time slot, maybe at another place) gets its own row; the month
 * cell spans them. Months without a meeting get one "-" row. Only this calendar year:
 * from January the table shows the new year.
 */
export default function YearSchedule({ event, today }: { event: Pick<Event, "date" | "endDate" | "recurrence" | "startTime" | "endTime" | "venue">; today: string }) {
  const t = useTranslations("Repeat");
  const locale = useLocale();
  if (!event.recurrence) return null;
  const year = today.slice(0, 4);
  const dates = occurrences(event, `${year}-01-01`, `${year}-12-31`);
  if (dates.length === 0) return null;
  const next = dates.find((d) => d >= today);
  const slots = meetingSlots(event);

  // Gregorian calendar also in Thai (the default there is the Buddhist year).
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", calendar: "gregory" });
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", calendar: "gregory" });
  const at = (iso: string) => new Date(`${iso}T12:00:00`);
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

  // One row per meeting date and group; a month without meetings gets one "-" row.
  // monthRows > 0 on a month's first row = how many rows its month cell spans.
  const cells = months.flatMap((month) => {
    const rows = dates.filter((d) => d.startsWith(month)).flatMap((d) => slots.map((s) => ({ d, s })));
    if (rows.length === 0) return [{ month, monthRows: 1, d: "", date: "-", time: "-", venue: "-", note: t("noteNone") }];
    return rows.map(({ d, s }, i) => ({
      month,
      monthRows: i === 0 ? rows.length : 0,
      d,
      date: dayFmt.format(at(d)),
      time: fmtTimes(s.start, s.end) || "-",
      venue: s.venue,
      note: d === next ? t("noteNext") : d < today ? t("notePast") : "",
    }));
  });
  // Same value in a run of rows = one merged cell, also across months (e.g. one place all
  // year). span(k, i) = rows the cell starting at row i covers; 0 = covered by a cell above.
  type Col = "date" | "time" | "venue" | "note";
  const span = (k: Col, i: number) => {
    if (i > 0 && cells[i][k] === cells[i - 1][k]) return 0;
    let n = 1;
    while (i + n < cells.length && cells[i + n][k] === cells[i][k]) n++;
    return n;
  };
  const cell = (k: Col, i: number, className?: string) => {
    const n = span(k, i);
    const none = cells[i][k] === "-" ? " ys-none" : "";
    return n === 0 ? null : <td rowSpan={n > 1 ? n : undefined} className={`${className ?? ""}${none}`.trim() || undefined}>{cells[i][k]}</td>;
  };

  return (
    <div className="year-schedule">
      <h2>{t("yearTitle", { year })}</h2>
      <div className="ys-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t("colMonth")}</th><th scope="col">{t("colDate")}</th><th scope="col">{t("colTime")}</th>
              <th scope="col">{t("colLocation")}</th><th scope="col">{t("colNotes")}</th>
            </tr>
          </thead>
          <tbody>
            {cells.map((c, i) => (
              <tr key={`${c.month}-${c.d}-${i}`}>
                {c.monthRows > 0 && <th scope="row" rowSpan={c.monthRows > 1 ? c.monthRows : undefined}>{monthFmt.format(at(`${c.month}-15`))}</th>}
                {cell("date", i, "ys-narrow")}
                {cell("time", i, "ys-narrow")}
                {cell("venue", i)}
                {cell("note", i, "muted")}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted ys-count">{t("yearCount", { count: dates.length })}</p>
    </div>
  );
}
