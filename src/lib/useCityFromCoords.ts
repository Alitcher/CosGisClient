"use client";

import { useEffect, useRef, useState } from "react";
import { detectCity } from "@/lib/cities";
import type { City } from "@/types";

export type CityDetect = "idle" | "detecting" | "found" | "unsupported" | "unknown";

/**
 * Fills a form's City from its longitude/latitude fields. Runs shortly after the
 * coordinates stop changing (typing, or picking an address suggestion) and calls
 * `onCity` with the detected city. The admin can still pick another city by hand
 * afterwards; it's only re-detected when the coordinates change again.
 */
export function useCityFromCoords(lng: string, lat: string, onCity: (c: City) => void): CityDetect {
  const [state, setState] = useState<CityDetect>("idle");
  const cb = useRef(onCity);
  useEffect(() => { cb.current = onCity; });

  useEffect(() => {
    const x = Number(lng), y = Number(lat);
    const valid = lng.trim() !== "" && lat.trim() !== "" && Number.isFinite(x) && Number.isFinite(y);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      if (!valid) { setState("idle"); return; }
      setState("detecting");
      try {
        const guess = await detectCity(x, y, ctrl.signal);
        if (guess === "unsupported" || guess === "unknown") { setState(guess); return; }
        cb.current(guess);
        setState("found");
      } catch {
        /* aborted by a newer coordinate change */
      }
    }, 500);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [lng, lat]);

  return state;
}
