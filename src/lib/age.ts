/** Suggested ages as typed in a form (still text). `all` = the "All ages" checkbox (the default). */
export type AgeForm = { all: boolean; ageMin: string; ageMax: string };
export const EMPTY_AGE: AgeForm = { all: true, ageMin: "", ageMax: "" };

/** "7" -> 7; empty -> null; anything else (not a whole number 0-99) -> undefined. */
export function parseAge(s: string): number | null | undefined {
  const t = s.trim();
  if (t === "") return null;
  return /^\d{1,2}$/.test(t) ? Number(t) : undefined;
}

/** Form -> API fields. All ages = from 0, no top. An empty "to" sends null, so an admin edit can clear it. */
export function ageFields(f: AgeForm): { ageMin: number | null; ageMax: number | null } {
  if (f.all) return { ageMin: 0, ageMax: null };
  return { ageMin: parseAge(f.ageMin) ?? null, ageMax: parseAge(f.ageMax) ?? null };
}

/** API fields -> form. Nothing set, or from 0 with no top = All ages. */
export function ageForm(e: { ageMin?: number | null; ageMax?: number | null }): AgeForm {
  const all = e.ageMax == null && !e.ageMin;
  return { all, ageMin: all || e.ageMin == null ? "" : String(e.ageMin), ageMax: e.ageMax == null ? "" : String(e.ageMax) };
}

/** Problem with the typed ages, as a key of the "Age" messages, or null when fine. "From" is required unless All ages. */
export function ageError(f: AgeForm): "needMin" | "badNumber" | "badRange" | null {
  if (f.all) return null;
  const min = parseAge(f.ageMin), max = parseAge(f.ageMax);
  if (min === undefined || max === undefined) return "badNumber";
  if (min === null) return "needMin";
  return min != null && max != null && max < min ? "badRange" : null;
}

type AgeKey = "range" | "exact" | "plus" | "upTo" | "allAges";

/**
 * Short age text for cards: "Ages 7-17", "Age 10", "Ages 7+", "Up to age 12", "All ages" (from 0, no top).
 * Nothing known = "All ages" (the default, no age limit). `t` gives the words (messages "Age").
 */
export function ageLabel(
  e: { ageMin?: number | null; ageMax?: number | null },
  t: (key: AgeKey, values?: { min?: number; max?: number }) => string,
): string {
  const { ageMin: min, ageMax: max } = e;
  if (min != null && max != null) return min === max ? t("exact", { min }) : t("range", { min, max });
  if (min != null && min > 0) return t("plus", { min });
  if (max != null) return t("upTo", { max });
  return t("allAges");
}
