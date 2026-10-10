"use client";

import { useEffect, useRef, useState } from "react";
import { useEventStore } from "@/lib/eventsStore";
import { usePlaceStore } from "@/lib/placesStore";
import { cityColor } from "@/lib/cities";

// The React/MapLibre integration kept rendering blank, while the standalone page
// at /map-embed.html renders the 3D map perfectly. So we embed that working page
// and feed it the real events + places (same messages as MapView), so saving or
// deleting in admin shows up here too.
export default function HeroMap({ title }: { title: string }) {
  const { events } = useEventStore();
  const { places } = usePlaceStore();
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
    // The embed hides past events itself.
    win.postMessage({ type: "setEvents", events: events.map((e) => ({ ...e, color: cityColor(e.city) })) }, "*");
    win.postMessage({ type: "setPlaces", places }, "*");
  }, [ready, events, places]);

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
