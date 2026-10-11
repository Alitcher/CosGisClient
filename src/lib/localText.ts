import type { I18n, Lang } from "@/types";

type Texts = { name: string; description?: string; lang?: Lang; i18n?: I18n };

/**
 * An event's or place's name and description in the UI language. The item's own
 * fields are its original text; translations (filled by the server, fixable in
 * admin) come from `i18n`. Anything missing falls back to the original.
 * Names are proper names and always stay as written (old translated names in
 * `i18n` are ignored).
 */
export function localText(item: Texts, locale: string): { name: string; description?: string } {
  const t = item.lang === locale ? undefined : item.i18n?.[locale as Lang];
  return {
    name: item.name,
    description: t?.description || item.description,
  };
}

/** The same item with name/description swapped for the UI language (for the map embed). */
export function localized<T extends Texts>(item: T, locale: string): T {
  return { ...item, ...localText(item, locale) };
}
