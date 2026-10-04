"use client";

import { usePlaceStore } from "@/lib/placesStore";
import { isPracticeType } from "@/types";
import SpotCard from "./SpotCard";

/**
 * The home page's top 3 photo spots. There's no rating or popularity data yet,
 * so "top" means the most complete listings: ones with a photo first, then the
 * most themes, then the longest description. Practice places are left out.
 */
export default function HotSpots() {
  const places = usePlaceStore().places.filter((p) => !isPracticeType(p.type));
  const score = (p: (typeof places)[number]) => [
    p.photos.length > 0 ? 1 : 0,
    p.themes.length,
    p.description?.length ?? 0,
  ];
  const top = places
    .slice()
    .sort((a, b) => {
      const [x, y] = [score(a), score(b)];
      for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i];
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="grid spots-grid">
      {top.map((p) => <SpotCard key={p.id} place={p} />)}
    </div>
  );
}
