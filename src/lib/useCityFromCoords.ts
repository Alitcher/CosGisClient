"use client";

import { useEffect, useRef, useState } from "react";
import { detectLocation } from "@/lib/cities";
import type { City, Country } from "@/types";

export type CityDetect = "idle" | "detecting" | "found" | "unsupported" | "unknown";

/**
 * Fills a form's Country and City from its longitude/latitude fields. Runs
 * shortly after the coordinates stop changing (typing, or picking an address
 * suggestion) and calls `onPlace` with what it found (city is missing when the
 * geocoder names no town). The user can still change both by hand afterwards;
 * they're only re-detected when the coordinates change again.
 */
export function useCityFromCoords(
  lng: string,
  lat: string,
  onPlace: (p: { country: Country; city?: City }) => void,
): CityDetect {
  const [state, setState] = useState<CityDetect>("idle");
  const cb = useRef(onPlace);
  useEffect(() => { cb.current = onPlace; });

  useEffect(() => {
    const x = Number(lng), y = Number(lat);
    // 0,0 is the placeholder saved for "no location yet", not a real place.
    const valid = lng.trim() !== "" && lat.trim() !== "" && Number.isFinite(x) && Number.isFinite(y) && !(x === 0 && y === 0);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      if (!valid) { setState("idle"); return; }
      setState("detecting");
      try {
        const guess = await detectLocation(x, y, ctrl.signal);
        if (guess === "unsupported" || guess === "unknown") { setState(guess); return; }
        cb.current(guess);
        setState(guess.city ? "found" : "unknown");
      } catch {
        /* aborted by a newer coordinate change */
      }
    }, 500);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [lng, lat]);

  return state;
}
