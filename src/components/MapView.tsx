"use client";

import { useEffect, useRef, useState } from "react";
import MiniCalendar from "./MiniCalendar";
import { useEventStore } from "@/lib/eventsStore";
import { splitDate } from "@/lib/data";

const CITIES = ["All", "Helsinki", "Vantaa", "Espoo"] as const;
type CityFilter = (typeof CITIES)[number];

export default function MapView() {
  const { events } = useEventStore();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [city, setCity] = useState<CityFilter>("All");
  const [ready, setReady] = useState(false);

  function post(msg: unknown) {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }

  // the embedded map tells us when it's ready
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data && e.data.type === "mapReady") setReady(true);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // push the (possibly admin-edited) events into the map
  useEffect(() => {
    if (ready) post({ type: "setEvents", events });
  }, [ready, events]);

  // push the city filter (applies to both conventions and spots)
  useEffect(() => {
    if (ready) post({ type: "filterCity", city: city === "All" ? "all" : city });
  }, [ready, city]);

  const list = events
    .filter((e) => (city === "All" ? true : e.city === city))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="map-layout">
      <aside className="side">
        <div className="side-head">
          <h2>Conventions &amp; venues</h2>
          <p>Filter by city · click an event to fly there</p>
        </div>
        <div className="filters">
          {CITIES.map((c) => (
            <button key={c} className={`fchip${city === c ? " on" : ""}`} type="button" onClick={() => setCity(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="list">
          {list.map((e) => {
            const { day, mon } = splitDate(e.date);
            return (
              <div
                key={e.id}
                className="list-item"
                onClick={() => post({ type: "focus", lng: e.lng, lat: e.lat })}
              >
                <div className="li-date"><div className="d">{day}</div><div className="m">{mon}</div></div>
                <div className="li-body">
                  <h4>{e.name}</h4>
                  <div className="meta">{e.venue} · {e.city}</div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-2)", fontSize: 13 }}>
              No conventions in {city}.
            </div>
          )}
        </div>
      </aside>

      <div className="map-wrap">
        <iframe
          ref={iframeRef}
          src="/map-embed.html"
          title="Cosplay map"
          className="map-canvas"
          style={{ border: 0, width: "100%", height: "100%" }}
        />
        <div className="map-legend">
          <div className="legend-row"><span className="sw" style={{ background: "#8b5cf6", borderRadius: 3 }} /> Cosplay spots</div>
          <div className="legend-row"><span className="sw" style={{ background: "var(--pink)" }} /> Helsinki cons</div>
          <div className="legend-row"><span className="sw" style={{ background: "var(--gold)" }} /> Vantaa cons</div>
          <div className="legend-row"><span className="sw" style={{ background: "var(--cyan)" }} /> Espoo cons</div>
        </div>
        <MiniCalendar />
      </div>
    </div>
  );
}
