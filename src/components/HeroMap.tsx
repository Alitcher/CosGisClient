"use client";

import { useEffect, useRef, useState } from "react";
import { useEventStore } from "@/lib/eventsStore";
import { asNext } from "@/lib/recurrence";
import type { Event } from "@/types";
import { usePlaceStore } from "@/lib/placesStore";
import { useLocale } from "next-intl";
import { cityColor, countryOf } from "@/lib/cities";
import { localized } from "@/lib/localText";

// The React/MapLibre integration kept rendering blank, while the standalone page
// at /map-embed.html renders the 3D map perfectly. So we embed that working page
// and feed it the real events + places (same messages as MapView), so saving or
// deleting in admin shows up here too.
export default function HeroMap({ title }: { title: string }) {
  const { events } = useEventStore();
  const { places } = usePlaceStore();
  const locale = useLocale();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.source === iframeRef.current?.contentWindow && e.data?.type === "mapReady") setReady(true);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!ready || !win) return;
    // The embed hides past events itself. Repeating meetups go in at their next meeting.
    const today = new Intl.DateTimeFormat("en-CA").format(new Date());
    win.postMessage({ type: "setEvents", events: events.map((e) => asNext(e, today)).filter((e): e is Event => !!e).map((e) => ({ ...localized(e, locale), color: cityColor(e.city, countryOf(e)) })) }, "*");
    win.postMessage({ type: "setPlaces", places: places.map((p) => localized(p, locale)) }, "*");
  }, [ready, events, places, locale]);

  return (
    <iframe
      ref={iframeRef}
      src="/map-embed.html?mode=thumbs"
      title={title}
      className="hero-map"
      style={{ border: 0, width: "100%", height: "100%" }}
    />
  );
}
