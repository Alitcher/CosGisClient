import type { Admission } from "@/types";

/** Price fields as typed in a form (numbers still as text). */
export type PriceForm = { admission: Admission | ""; priceMin: string; priceMax: string; priceNote: string };
export const EMPTY_PRICE: PriceForm = { admission: "", priceMin: "", priceMax: "", priceNote: "" };

/** "12,5" or "12.5" -> 12.5; empty or not a number -> undefined. */
export function parsePrice(s: string): number | undefined {
  const t = s.trim().replace(",", ".");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Form -> API fields. Free events send no prices; empty fields send nothing. */
export function priceFields(f: PriceForm) {
  const free = f.admission === "free";
  return {
    admission: f.admission || undefined,
    priceMin: free ? undefined : parsePrice(f.priceMin),
    priceMax: free ? undefined : parsePrice(f.priceMax),
    priceNote: f.priceNote.trim() || undefined,
  };
}

/** API fields -> form. */
export function priceForm(e: { admission?: Admission; priceMin?: number; priceMax?: number; priceNote?: string }): PriceForm {
  return {
    admission: e.admission ?? "",
    priceMin: e.priceMin == null ? "" : String(e.priceMin),
    priceMax: e.priceMax == null ? "" : String(e.priceMax),
    priceNote: e.priceNote ?? "",
  };
}

/** Problem with the typed prices, as a key of the "Price" messages, or null when fine. */
export function priceError(f: PriceForm): "badNumber" | "badRange" | null {
  if (f.admission === "free") return null;
  for (const s of [f.priceMin, f.priceMax]) if (s.trim() !== "" && parsePrice(s) === undefined) return "badNumber";
  const min = parsePrice(f.priceMin), max = parsePrice(f.priceMax);
  return min != null && max != null && max < min ? "badRange" : null;
}

const eur = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} EUR`;

/**
 * Short price text for cards: "Free", "15 EUR", "10-25 EUR", "Free - 25 EUR".
 * Nothing known = "Free" (the default). `t` gives the words (messages "Price").
 */
export function priceLabel(
  e: { admission?: Admission; priceMin?: number; priceMax?: number },
  t: (key: "free" | "paid" | "mixed") => string,
): string {
  const { priceMin: min, priceMax: max } = e;
  const range =
    min != null && max != null && max !== min ? `${Number.isInteger(min) ? min : min.toFixed(2)}-${eur(max)}`
    : min != null ? eur(min)
    : max != null ? eur(max)
    : "";
  switch (e.admission) {
    case "free": return t("free");
    case "paid": return range || t("paid");
    case "mixed": return max != null ? `${t("free")} - ${eur(max)}` : t("mixed");
    default: return range || t("free");
  }
}
