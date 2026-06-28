import Link from "next/link";

// July 2026 starts on a Wednesday (Mon-indexed column 2). 31 days.
const FIRST_DOW = 2;
const DAYS = 31;
const PREV_TAIL = 30;
const EVENT_DAYS = new Set([11, 12, 13]);
const TODAY = 27;
const DOW = ["M", "T", "W", "T", "F", "S", "S"];

/** Compact calendar docked inside the map. */
export default function MiniCalendar() {
  const cells: { key: string; label: number; cls: string }[] = [];

  for (let i = 0; i < FIRST_DOW; i++) {
    cells.push({ key: `p${i}`, label: PREV_TAIL - FIRST_DOW + 1 + i, cls: "mc-cell dim" });
  }
  for (let d = 1; d <= DAYS; d++) {
    let cls = "mc-cell";
    if (EVENT_DAYS.has(d)) cls += " has-ev";
    if (d === TODAY) cls += " today";
    cells.push({ key: `d${d}`, label: d, cls });
  }

  return (
    <div className="mini-cal">
      <div className="mc-head">
        <div className="mc-title">July 2026</div>
        <div className="mc-nav">
          <button type="button" aria-label="Previous month">‹</button>
          <button type="button" aria-label="Next month">›</button>
        </div>
      </div>
      <div className="mc-grid">
        {DOW.map((d, i) => (
          <div key={`dow${i}`} className="dow">{d}</div>
        ))}
        {cells.map((c) => (
          <div key={c.key} className={c.cls}>{c.label}</div>
        ))}
      </div>
      <div className="mc-foot">
        <span>● = con day</span>
        <Link href="/calendar">Full calendar →</Link>
      </div>
    </div>
  );
}
