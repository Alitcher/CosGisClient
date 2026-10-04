"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

// Each language named in itself, so a visitor can find theirs without reading
// the current one.
const labels: Record<Locale, string> = {
  en: "English",
  fi: "Suomi",
  et: "Eesti",
  th: "ไทย",
};

// A custom menu instead of a native <select>: the browser draws a <select>'s
// open list itself, which can't be themed and looked out of place.
export default function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname(); // without the language prefix
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function change(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    // Keep the query string (e.g. Events filters) when switching.
    const href = pathname + window.location.search;
    startTransition(() => router.replace(href, { locale: next }));
  }

  return (
    <div className="lang-switch" ref={rootRef}>
      <button
        type="button"
        className="lang-btn"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("language")}
      >
        {labels[locale]}
      </button>
      {open && (
        <div className="lang-menu" role="menu">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === locale}
              lang={l}
              className={l === locale ? "on" : ""}
              onClick={() => change(l)}
            >
              {labels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
