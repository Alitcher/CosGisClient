"use client";

import { useTranslations } from "next-intl";
import Icon from "./Icon";

export default function ThemeToggle() {
  const t = useTranslations("Nav");

  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("cosplaymap-theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={t("toggleTheme")}
      type="button"
    >
      <span className="moon"><Icon name="moon" /></span>
      <span className="sun"><Icon name="sun" /></span>
    </button>
  );
}
