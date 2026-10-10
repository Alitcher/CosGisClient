"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

const links = [
  ["/", "home"],
  ["/map", "map"],
  ["/calendar", "calendar"],
  ["/events", "events"],
  ["/spots", "spots"],
  ["/practice", "practice"],
  ["/about", "about"],
  ["/donate", "donate"],
] as const;

/**
 * Top bar. On wide screens the page links sit in the bar; on tablets and
 * phones (<= 1024px, see globals.css) they move into a menu that the
 * hamburger button opens below the bar.
 */
export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname(); // without the language prefix, so /fi/map -> /map
  const [open, setOpen] = useState(false);
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <span className="brand-logo">⛩️</span>
          <span className="brand-text">
            CosoraAtlas
            <small>{t("tagline")}</small>
          </span>
        </Link>
        <div className="nav-links">
          <div id="nav-pages" className={`nav-pages${open ? " open" : ""}`}>
            {links.map(([href, key]) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {t(key)}
              </Link>
            ))}
            {/* Phone/tablet: languages live in the menu instead of the bar. */}
            <div className="nav-lang">
              <LanguageSwitcher inline />
            </div>
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="nav-menu-btn"
            aria-label={t("menu")}
            aria-expanded={open}
            aria-controls="nav-pages"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
