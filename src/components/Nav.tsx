"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, type Messages } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

type NavKey = keyof Messages["Nav"];
type Page = readonly [href: string, key: NavKey];
type Item = { page: Page } | { group: NavKey; pages: readonly Page[] };

// A group is a heading with sub pages: a dropdown on wide screens, a titled
// section in the phone/tablet menu. To add a page later (JK-pop events,
// cosplay rental spots), add one line to its group.
const items: readonly Item[] = [
  { page: ["/", "home"] },
  { page: ["/map", "map"] },
  { group: "events", pages: [["/calendar", "calendar"], ["/events", "cosplayEvents"], ["/community", "community"]] },
  { group: "spots", pages: [["/spots", "cosplaySpots"], ["/practice", "practiceSpots"]] },
  { page: ["/about", "about"] },
  { page: ["/donate", "donate"] },
];

/**
 * Top bar. On wide screens the page links sit in the bar; on tablets and
 * phones (<= 1024px, see globals.css) they move into a menu that the
 * hamburger button opens below the bar.
 */
export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname(); // without the language prefix, so /fi/map -> /map
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  // Close a dropdown on outside click or Escape.
  useEffect(() => {
    if (!openGroup) return;
    function onDown(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpenGroup(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenGroup(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openGroup]);

  function close() {
    setOpen(false);
    setOpenGroup(null);
  }

  function pageLink([href, key]: Page) {
    return (
      <Link key={href} href={href} className={pathname === href ? "active" : ""} onClick={close}>
        {t(key)}
      </Link>
    );
  }

  return (
    <nav className="nav" ref={navRef}>
      <div className="nav-inner">
        <Link className="brand" href="/">
          <Image className="brand-logo" src="/logo.svg" alt="" width={42} height={42} unoptimized priority />
          <span className="brand-text">
            CosOverHere
            <small>{t("tagline")}</small>
          </span>
        </Link>
        <div className="nav-links">
          <div id="nav-pages" className={`nav-pages${open ? " open" : ""}`}>
            {items.map((item) => {
              if ("page" in item) return pageLink(item.page);
              const active = item.pages.some(([href]) => href === pathname);
              const isOpen = openGroup === item.group;
              return (
                <div key={item.group} className={`nav-group${isOpen ? " open" : ""}`}>
                  {/* Wide screens: a button that opens the dropdown. */}
                  <button
                    type="button"
                    className={`nav-group-btn${active ? " active" : ""}`}
                    aria-expanded={isOpen}
                    onClick={() => setOpenGroup(isOpen ? null : item.group)}
                  >
                    {t(item.group)}
                  </button>
                  {/* Phone/tablet menu: a plain heading over the sub pages. */}
                  <div className="nav-group-title">{t(item.group)}</div>
                  <div className="nav-sub">{item.pages.map(pageLink)}</div>
                </div>
              );
            })}
            {/* Phone/tablet: languages live in the menu instead of the bar. */}
            <div className="nav-lang">
              <div className="nav-group-title">{t("language")}</div>
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
