"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MiniCalendar from "./MiniCalendar";
import { useEventStore } from "@/lib/eventsStore";
import { usePlaceStore } from "@/lib/placesStore";
import { splitDate, eventEndsOn } from "@/lib/data";
import { CITY_COLOR, citiesIn, cityLabel, countriesIn } from "@/lib/cities";
import { DEFAULT_FILTERS, filterEvents, filterPlaces, todayISO, type MapFilters as Filters } from "@/lib/mapFilters";
import EventThumb from "./EventThumb";
import MapFilters from "./MapFilters";
import { isPracticeType } from "@/types";

export default function MapView() {
  const t = useTranslations("Map");
  const { events } = useEventStore();
  const { places } = usePlaceStore();
  const params = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
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

  // The map only shows today + future (past = archive), narrowed by the filter panel.
  const today = todayISO();
  const upcoming = useMemo(() => events.filter((e) => eventEndsOn(e) >= today), [events, today]);
  const list = useMemo(() => filterEvents(events, filters, today), [events, filters, today]);
  const shownPlaces = useMemo(() => filterPlaces(places, filters), [places, filters]);

  // push the filtered (possibly admin-edited) events + places into the map
  useEffect(() => {
    if (ready) post({ type: "setEvents", events: list });
  }, [ready, list]);
  useEffect(() => {
    if (ready) post({ type: "setPlaces", places: shownPlaces });
  }, [ready, shownPlaces]);

  // When arrived here via a "show on map" button (/map?lng=..&lat=..), fly to that
  // node. Small delay lets setEvents/setPlaces build the markers first, so the
  // target pin's detail popup auto-opens once we're zoomed in on it.
  useEffect(() => {
    if (!ready) return;
    // Check presence first: Number(null) is 0, so a plain /map visit would
    // otherwise fly to 0,0 in the ocean off Africa.
    const rawLng = params.get("lng");
    const rawLat = params.get("lat");
    if (!rawLng || !rawLat) return;
    const lng = Number(rawLng);
    const lat = Number(rawLat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    const t = setTimeout(() => post({ type: "focus", lng, lat }), 200);
    return () => clearTimeout(t);
  }, [ready, params]);

  // Filter chips only offer places that have something on the map; the legend
  // only lists what's currently shown.
  const optionItems = [...upcoming, ...places];
  const legendCities = citiesIn(list);

  return (
    <div className="map-layout">
      <aside className="side">
        <div className="side-head">
          <h2>{t("title")}</h2>
          <p>{t("subtitle")}</p>
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
                <EventThumb event={e} size={36} />
                <div className="li-body">
                  <h4>{e.name}</h4>
                  <div className="meta">{e.venue} · {cityLabel(e.city)}</div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div style={{ padding: 16, color: "var(--text-2)", fontSize: 13 }}>
              {t("noMatches")}
            </div>
          )}
        </div>
      </aside>

      <div className="map-wrap">
        <iframe
          ref={iframeRef}
          src="/map-embed.html"
          title={t("mapTitle")}
          className="map-canvas"
          style={{ border: 0, width: "100%", height: "100%" }}
        />
        {/* Floats over the map (top-left) rather than living in the sidebar, so the
            event list keeps its height and phones — which hide the sidebar — still
            get filters. */}
        <MapFilters
          value={filters}
          onChange={setFilters}
          countries={countriesIn(optionItems)}
          cities={citiesIn(optionItems)}
          resultCount={list.length}
        />
        <div className="map-legend">
          {shownPlaces.some((p) => !isPracticeType(p.type)) && (
            <div className="legend-row"><span className="sw" style={{ background: "#8b5cf6", borderRadius: 3 }} /> {t("legendSpots")}</div>
          )}
          {shownPlaces.some((p) => isPracticeType(p.type)) && (
            <div className="legend-row"><span className="sw" style={{ background: "#0ea5e9", borderRadius: 3 }} /> {t("legendPractice")}</div>
          )}
          {legendCities.map((c) => (
            <div className="legend-row" key={c}><span className="sw" style={{ background: CITY_COLOR[c] }} /> {t("legendCity", { city: cityLabel(c) })}</div>
          ))}
        </div>
        <MiniCalendar />
      </div>
    </div>
  );
}
