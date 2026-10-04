import { defineRouting } from "next-intl/routing";

/**
 * Which languages the site has. Each one needs a matching messages/<locale>.json.
 * To add one: create its messages file, list it here, and give it a label in
 * components/LanguageSwitcher.tsx.
 *
 * "as-needed": English (the default) keeps the plain URLs (/map, /events); every
 * other language gets a prefix (/fi/map). So adding languages never breaks links.
 */
export const routing = defineRouting({
  locales: ["en", "fi", "et", "th"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
