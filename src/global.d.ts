import type { routing } from "@/i18n/routing";
import type messages from "../messages/en.json";

// Makes t("...") type-checked against messages/en.json: a missing or misspelled
// key is a TypeScript error.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
