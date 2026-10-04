"use client";

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

export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname(); // without the language prefix, so /fi/map -> /map
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
          {links.map(([href, key]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
            >
              {t(key)}
            </Link>
          ))}
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
