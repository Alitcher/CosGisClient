"use client";

import { useState } from "react";

/**
 * An event's thumbnail / logo. The image keeps its own shape: `size` is its
 * height and the width follows the picture (up to 3x the height), so a wide
 * banner logo shows whole instead of being cropped into a square. Falls back to
 * a square 🎌 tile when there's no image or it fails to load (dead link,
 * hotlink-blocked), so cards never show a broken image icon.
 */
export default function EventThumb({
  event,
  size = 56,
}: {
  event: { name: string; image?: string };
  size?: number;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = event.image && event.image !== failedSrc ? event.image : null;

  if (src) {
    return (
      // Plain <img>: thumbnails come from arbitrary hosts, which next/image
      // would need allow-listing for.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="ev-logo"
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        // Shrinks on narrow rows (phones) instead of squeezing the event name;
        // object-fit: contain keeps the whole logo visible at any width.
        style={{ height: size, maxWidth: `min(${size * 3}px, 40%)` }}
        onError={() => setFailedSrc(src)}
      />
    );
  }
  return (
    <span className="ev-thumb" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden="true">
      🎌
    </span>
  );
}
