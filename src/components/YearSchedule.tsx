"use client";

import { Fragment } from "react";
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
            {months.map((m) => {
              const month = <th scope="row">{monthFmt.format(at(`${m}-15`))}</th>;
              const rows = dates.filter((d) => d.startsWith(m)).flatMap((d) => slots.map((s) => ({ d, s })));
              if (rows.length === 0) {
                return (
                  <tr key={m}>
                    {month}<td className="ys-none ys-narrow">-</td><td className="ys-none ys-narrow">-</td><td className="ys-none">-</td>
                    <td className="muted">{t("noteNone")}</td>
                  </tr>
                );
              }
              const cells = rows.map(({ d, s }) => ({
                date: dayFmt.format(at(d)),
                time: fmtTimes(s.start, s.end) || "-",
                venue: s.venue,
                note: d === next ? t("noteNext") : d < today ? t("notePast") : "",
                d,
              }));
              // Same value in a run of rows (e.g. one place all month) = one merged cell.
              // span(k, i) = how many rows the cell starting at row i covers, 0 = covered by a cell above.
              const span = (k: "date" | "time" | "venue" | "note", i: number) => {
                const same = (a: number, b: number) => cells[a][k] === cells[b][k];
                if (i > 0 && same(i, i - 1)) return 0;
                let n = 1;
                while (i + n < cells.length && same(i + n, i)) n++;
                return n;
              };
              const cell = (k: "date" | "time" | "venue" | "note", i: number, className?: string) => {
                const n = span(k, i);
                return n === 0 ? null : <td rowSpan={n > 1 ? n : undefined} className={className}>{cells[i][k]}</td>;
              };
              return (
                <Fragment key={m}>
                  {cells.map((c, i) => (
                    <tr key={`${c.d}-${i}`}>
                      {i === 0 && <th scope="row" rowSpan={rows.length}>{monthFmt.format(at(`${m}-15`))}</th>}
                      {cell("date", i, "ys-narrow")}
                      {cell("time", i, "ys-narrow")}
                      {cell("venue", i)}
                      {cell("note", i, "muted")}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted ys-count">{t("yearCount", { count: dates.length })}</p>
    </div>
  );
}
