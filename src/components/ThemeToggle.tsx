"use client";

export default function ThemeToggle() {
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
      aria-label="Toggle light/dark mode"
      type="button"
    >
      <span className="moon">🌙</span>
      <span className="sun">☀️</span>
    </button>
  );
}
