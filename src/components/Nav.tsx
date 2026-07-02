"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const links: [string, string][] = [
  ["/", "Home"],
  ["/map", "Map"],
  ["/calendar", "Calendar"],
  ["/events", "Events"],
  ["/spots", "Spots"],
  ["/about", "About"],
  ["/donate", "Donate"],
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="brand" href="/">
          <span className="brand-logo">⛩️</span>
          <span className="brand-text">
            CosoraAtlas
            <small>Nordic · Baltic</small>
          </span>
        </Link>
        <div className="nav-links">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
