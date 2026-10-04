"use client";

import { useState } from "react";

/**
 * An event's thumbnail / logo. Falls back to a 🎌 tile when there's no image or
 * it fails to load (dead link, hotlink-blocked), so cards never show a broken
 * image icon.
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
  return (
    <span className="ev-thumb" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {src ? (
        // Plain <img>: thumbnails come from arbitrary hosts, which next/image
        // would need allow-listing for.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSrc(src)} />
      ) : (
        <span aria-hidden="true">🎌</span>
      )}
    </span>
  );
}
