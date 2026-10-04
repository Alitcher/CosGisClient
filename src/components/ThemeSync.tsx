"use client";

import { useLayoutEffect } from "react";
import { useLocale } from "next-intl";

/**
 * Re-applies the saved theme after a language switch.
 *
 * Switching language re-renders <html> for the new locale, and React drops the
 * data-theme attribute that the inline themeInit script set on first load (that
 * script doesn't run again on client navigation). Without it the CSS falls back
 * to dark. A layout effect puts it back before the browser paints, so there's no
 * flash. Same rule as themeInit in app/[locale]/layout.tsx.
 */
export default function ThemeSync() {
  const locale = useLocale();
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-theme")) return;
    let theme = "dark";
    try {
      const saved = localStorage.getItem("cosplaymap-theme");
      const light = window.matchMedia("(prefers-color-scheme: light)").matches;
      theme = saved || (light ? "light" : "dark");
    } catch {
      /* keep dark */
    }
    root.setAttribute("data-theme", theme);
  }, [locale]);
  return null;
}
