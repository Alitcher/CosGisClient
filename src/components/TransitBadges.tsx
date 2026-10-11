"use client";

import { useTranslations } from "next-intl";
import type { TransitStop } from "@/types";

/**
 * Nearby metro / train / tram / bus stops as small badges with the transport
 * logo (public/transit/*.svg), e.g. [M] Kamppi 220 m.
 * `compact`: logo + distance only, for tight spots like the map's event list.
 */
export default function TransitBadges({ transit, compact = false }: { transit?: TransitStop[]; compact?: boolean }) {
  const t = useTranslations("Transit");
  if (!transit || transit.length === 0) return null;
  return (
    <div className={`transit${compact ? " compact" : ""}`} aria-label={t("nearby")}>
      {transit.map((s) => (
        <span className={`transit-badge ${s.kind}`} key={`${s.kind}-${s.name}`} title={`${t(s.kind)}: ${s.name}, ${s.distance} m`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="transit-icon" src={`/transit/${s.kind}.svg`} alt={t(s.kind)} width={16} height={16} />
          {!compact && <span className="transit-name">{s.name}</span>}
          <span className="transit-dist">{s.distance} m</span>
        </span>
      ))}
    </div>
  );
}
