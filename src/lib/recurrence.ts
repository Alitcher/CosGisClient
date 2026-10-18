import type { Event, Recurrence } from "@/types";

/**
 * Dates of repeating community meetups. The weekday is the one of the event's
 * `date` (the first meeting); see Recurrence in types.ts. All dates are local
 * 'YYYY-MM-DD' strings, compared as text.
 */

/** A community meetup (missing kind = convention). */
export const isCommunity = (e: { kind?: Event["kind"] }): boolean => e.kind === "community";

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso: string, days: number) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
};

/** Which weekday of its month a date is: 1..4, or 5 for a fifth one. */
export function nthOfMonth(iso: string): number {
  return Math.ceil(fromISO(iso).getDate() / 7);
}

/** The nth (1..4, -1 = last) given weekday (0 = Sunday) of a month, or null when the month has none. */
function nthWeekday(year: number, month: number, weekday: number, nth: number): string | null {
  if (nth === -1) {
    const last = new Date(year, month + 1, 0);
    last.setDate(last.getDate() - ((last.getDay() - weekday + 7) % 7));
    return toISO(last);
  }
  const first = new Date(year, month, 1);
  const day = 1 + ((weekday - first.getDay() + 7) % 7) + (nth - 1) * 7;
  return day <= new Date(year, month + 1, 0).getDate() ? toISO(new Date(year, month, day)) : null;
}

/** Every meeting date of `e` from `from` to `to` (both included). Not repeating = just its own date(s). */
export function occurrences(e: Pick<Event, "date" | "endDate" | "recurrence">, from: string, to: string): string[] {
  const r = e.recurrence;
  if (!r) {
    const end = e.endDate && e.endDate >= e.date ? e.endDate : e.date;
    const out: string[] = [];
    for (let d = e.date > from ? e.date : from; d <= end && d <= to; d = addDays(d, 1)) out.push(d);
    return out;
  }
  const last = r.until && r.until < to ? r.until : to;
  const out: string[] = [];
  if (r.freq === "custom") {
    for (const d of [...new Set([e.date, ...(r.dates ?? [])])].sort()) if (d >= from && d <= last) out.push(d);
    return out;
  }
  if (r.freq === "monthly") {
    const start = fromISO(e.date);
    const weekday = start.getDay();
    const nth = r.nth ?? Math.min(nthOfMonth(e.date), 4);
    for (let y = start.getFullYear(), m = start.getMonth(); ; m++) {
      const d = nthWeekday(y, m, weekday, nth);
      const monthStart = toISO(new Date(y, m, 1));
      if (monthStart > last) break;
      if (d && d >= e.date && d >= from && d <= last) out.push(d);
    }
    return out;
  }
  const step = r.freq === "biweekly" ? 14 : 7;
  let d = e.date;
  if (d < from) {
    // jump close to `from` instead of walking week by week from the first meeting
    const weeks = Math.floor((fromISO(from).getTime() - fromISO(d).getTime()) / (step * 86400000));
    d = addDays(d, weeks * step);
  }
  for (; d <= last; d = addDays(d, step)) if (d >= from) out.push(d);
  return out;
}

/** The next meeting on or after `today` (within about a year), or null when it has ended. */
export function nextOccurrence(e: Pick<Event, "date" | "endDate" | "recurrence">, today: string): string | null {
  return occurrences(e, today, addDays(today, 400))[0] ?? null;
}

/**
 * For lists and the map: a repeating meetup shown as its next meeting (date moved,
 * no end date). Null when it has no more meetings. Other events are returned as is.
 */
export function asNext<T extends Event>(e: T, today: string): T | null {
  if (!e.recurrence) return e;
  const next = nextOccurrence(e, today);
  return next ? { ...e, date: next, endDate: undefined } : null;
}

type RepeatKey = "weekly" | "biweekly" | "monthly1" | "monthly2" | "monthly3" | "monthly4" | "monthlyLast" | "custom";

/**
 * How it repeats, e.g. "Every Saturday", "Every other Saturday", "1st Saturday of the month",
 * "On selected dates". Null when it does not repeat. `t` gives the words (messages "Repeat"),
 * weekday names come from the browser in the UI language.
 */
export function repeatLabel(
  e: Pick<Event, "date" | "recurrence">,
  t: (key: RepeatKey, values: { day: string }) => string,
  locale: string,
): string | null {
  const r: Recurrence | null | undefined = e.recurrence;
  if (!r) return null;
  const day = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(fromISO(e.date));
  if (r.freq !== "monthly") return t(r.freq, { day });
  const nth = r.nth ?? Math.min(nthOfMonth(e.date), 4);
  return t(nth === -1 ? "monthlyLast" : (`monthly${nth}` as RepeatKey), { day });
}

/* ---- forms (submit + admin) ---- */

/** Kind + repeat as typed in a form. `nth` "" = take it from the first date. */
export type RepeatForm = {
  kind: NonNullable<Event["kind"]>;
  freq: Recurrence["freq"];
  nth: "" | "1" | "2" | "3" | "4" | "-1";
  dates: string[]; // custom only
  until: string;
  note: string;
  slots: { start: string; end: string; venue: string }[]; // extra groups; empty = one group at the event's time
};
export const EMPTY_REPEAT: RepeatForm = { kind: "convention", freq: "weekly", nth: "", dates: [], until: "", note: "", slots: [] };

/** API fields -> form. */
export function repeatForm(e: Pick<Event, "kind" | "recurrence">): RepeatForm {
  const r = e.recurrence;
  return {
    kind: e.kind ?? "convention",
    freq: r?.freq ?? "weekly",
    nth: r?.nth == null ? "" : (String(r.nth) as RepeatForm["nth"]),
    dates: r?.dates ?? [],
    until: r?.until ?? "",
    note: r?.note ?? "",
    slots: (r?.slots ?? []).map((s) => ({ start: s.start, end: s.end ?? "", venue: s.venue ?? "" })),
  };
}

/** Form -> API fields. Conventions send recurrence null, so switching back clears it. */
export function repeatFields(f: RepeatForm): { kind: RepeatForm["kind"]; recurrence: Recurrence | null } {
  if (f.kind !== "community") return { kind: "convention", recurrence: null };
  const r: Recurrence = { freq: f.freq };
  if (f.freq === "monthly" && f.nth) r.nth = Number(f.nth) as Recurrence["nth"];
  if (f.freq === "custom") r.dates = [...new Set(f.dates.filter(Boolean))].sort();
  if (f.until) r.until = f.until;
  if (f.note.trim()) r.note = f.note.trim();
  const slots = f.slots.filter((s) => s.start).map((s) => ({ start: s.start, ...(s.end ? { end: s.end } : {}), ...(s.venue.trim() ? { venue: s.venue.trim() } : {}) }));
  if (slots.length) r.slots = slots.sort((x, y) => x.start.localeCompare(y.start));
  return { kind: "community", recurrence: r };
}

/** Problem with the repeat, as a key of the "EventKind" messages, or null when fine. */
export function repeatError(f: RepeatForm, firstDate: string): "needDates" | "untilBeforeStart" | null {
  if (f.kind !== "community") return null;
  if (f.freq === "custom" && !f.dates.some((d) => d && d !== firstDate)) return "needDates";
  if (f.until && firstDate && f.until < firstDate) return "untilBeforeStart";
  return null;
}

/** The groups of each meeting: the slots, or one group at the event's own time and venue. */
export function meetingSlots(e: Pick<Event, "startTime" | "endTime" | "venue" | "recurrence">): { start?: string; end?: string; venue: string }[] {
  const slots = e.recurrence?.slots;
  if (slots?.length) return slots.map((s) => ({ start: s.start, end: s.end, venue: s.venue || e.venue }));
  return [{ start: e.startTime, end: e.endTime, venue: e.venue }];
}

/** Weekday name of a 'YYYY-MM-DD' date in the UI language ("" when no date yet). */
export function weekdayName(iso: string, locale: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Intl.DateTimeFormat(locale, { weekday: "long" }).format(fromISO(iso)) : "";
}

/**
 * Admin "Combine selected": several rows of the same meetup (e.g. one per date from a feed
 * without series) -> ONE community meetup. The earliest row is kept: its date is the first
 * meeting, every other date becomes a custom date, and different times or places become
 * slots. Returns the update for the kept row and the ids to set to draft (not deleted).
 */
export function combineEvents(events: Event[]): { keepId: string; patch: Partial<Event>; draftIds: string[] } | null {
  if (events.length < 2) return null;
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const keep = sorted[0];
  const all = sorted.flatMap((e) => [e.date, ...(e.recurrence?.freq === "custom" ? e.recurrence.dates ?? [] : [])]);
  const dates = [...new Set(all)].filter((d) => d > keep.date).sort().slice(0, 60);
  const slotKey = (s: { start: string; end?: string; venue?: string }) => `${s.start}|${s.end ?? ""}|${(s.venue ?? "").toLowerCase()}`;
  const raw = sorted.flatMap((e) =>
    e.recurrence?.slots?.length
      ? e.recurrence.slots.map((s) => ({ ...s, venue: s.venue || e.venue }))
      : e.startTime ? [{ start: e.startTime, ...(e.endTime ? { end: e.endTime } : {}), venue: e.venue }] : [],
  );
  const unique = [...new Map(raw.map((s) => [slotKey(s), s])).values()].sort((x, y) => x.start.localeCompare(y.start));
  // A slot only names a place when it differs from the kept row's venue.
  const slots = unique.map((s) => ({ start: s.start, ...(s.end ? { end: s.end } : {}), ...(s.venue && s.venue.toLowerCase() !== keep.venue.toLowerCase() ? { venue: s.venue } : {}) }));
  const ends = slots.map((s) => s.end).filter((x): x is string => !!x).sort();
  const note = keep.recurrence?.note ?? sorted.find((e) => e.recurrence?.note)?.recurrence?.note;
  return {
    keepId: keep.id,
    patch: {
      kind: "community",
      recurrence: { freq: "custom", dates, ...(note ? { note } : {}), ...(slots.length > 1 ? { slots: slots.slice(0, 10) } : {}) },
      ...(slots[0] ? { startTime: slots[0].start } : {}),
      ...(ends.length ? { endTime: ends[ends.length - 1] } : {}),
    },
    draftIds: sorted.slice(1).map((e) => e.id),
  };
}
