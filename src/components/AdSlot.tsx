/**
 * MOCKUP ad placeholder: a dashed box showing where a banner would go and its
 * standard size. Swap the inside for the real ad network tag later.
 *
 * Sizes (IAB standard):
 *   leaderboard  728 x 90 on desktop, 320 x 50 on phones (top / bottom of pages)
 *   billboard    970 x 250 on desktop, 300 x 250 on phones (between big sections)
 *   rect         300 x 250 (inside lists and grids, under detail cards)
 *   small        300 x 100 (narrow side panels, like the map list)
 */
type Size = "leaderboard" | "billboard" | "rect" | "small";

const LABEL: Record<Size, string> = {
  leaderboard: "728 x 90 / mobile 320 x 50",
  billboard: "970 x 250 / mobile 300 x 250",
  rect: "300 x 250",
  small: "300 x 100",
};

/**
 * `page` + `name` together identify one sellable slot (e.g. "events" + "Above
 * footer"), so a vendor can buy one page only. In Google Ad Manager this would
 * be one ad unit per page, or one unit with a "page" targeting key.
 */
export default function AdSlot({ page, size, name, className = "" }: { page: string; size: Size; name: string; className?: string }) {
  return (
    <div className={`ad-slot ad-${size} ${className}`} data-ad-page={page} data-ad-slot={name} aria-hidden>
      <div className="ad-box">
        <span className="ad-tag">Ad</span>
        <b>{page}: {name}</b>
        <span>{LABEL[size]}</span>
      </div>
    </div>
  );
}
