"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localized, localText } from "@/lib/localText";
import MiniCalendar from "./MiniCalendar";
import { useEventStore } from "@/lib/eventsStore";
import { usePlaceStore } from "@/lib/placesStore";
import { splitDate, eventEndsOn } from "@/lib/data";
import { cityColor, cityCountries, citiesIn, cityLabel, countriesIn, countryOf } from "@/lib/cities";
import { DEFAULT_FILTERS, filterEvents, filterPlaces, todayISO, type MapFilters as Filters } from "@/lib/mapFilters";
import EventThumb from "./EventThumb";
import TransitBadges from "./TransitBadges";
import MapFilters from "./MapFilters";
import { isPracticeType, type Event } from "@/types";
import { asNext } from "@/lib/recurrence";
import RepeatTag from "./RepeatTag";
import Icon from "./Icon";
import { setFolded, useFoldOpen } from "@/lib/foldState";

export default function MapView() {
  const t = useTranslations("Map");
  const tCal = useTranslations("Calendar");
  const locale = useLocale();
  const { events } = useEventStore();
  const { places } = usePlaceStore();
  const params = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [ready, setReady] = useState(false);
  const legendOpen = useFoldOpen("mapLegendOpen"); // colour legend folds to a small button
  const [listOpen, setListOpen] = useState(false); // phones: the event list slides in from the left
  // Swipe on the edge tab or the list: right opens, left closes.
  const swipeX = useRef<number | null>(null);
  const onSwipeStart = (ev: React.TouchEvent) => { swipeX.current = ev.touches[0]?.clientX ?? null; };
  const onSwipeEnd = (ev: React.TouchEvent) => {
    const start = swipeX.current, end = ev.changedTouches[0]?.clientX;
    swipeX.current = null;
    if (start == null || end == null || Math.abs(end - start) < 30) return;
    setListOpen(end > start);
  };
  const [selectedId, setSelectedId] = useState<string | null>(null); // event clicked in the list

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
  const upcoming = useMemo(() => events.map((e) => asNext(e, today)).filter((e): e is Event => !!e && eventEndsOn(e) >= today), [events, today]);
  const list = useMemo(() => filterEvents(events, filters, today), [events, filters, today]);
  const shownPlaces = useMemo(() => filterPlaces(places, filters), [places, filters]);

  // push the filtered (possibly admin-edited) events + places into the map
  useEffect(() => {
    // The embed has no colour table for cities outside the old Finnish list, so send each one's colour.
    if (ready) post({ type: "setEvents", events: list.map((e) => ({ ...localized(e, locale), color: cityColor(e.city, countryOf(e)) })) });
  }, [ready, list, locale]);
  useEffect(() => {
    if (ready) post({ type: "setPlaces", places: shownPlaces.map((p) => localized(p, locale)) });
  }, [ready, shownPlaces, locale]);

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
  const legendCountry = cityCountries(list);

  return (
    <div className="map-layout">
      {/* Phones: the map takes every touch, so a swipe that starts on it never reaches the list.
          This invisible strip on the map's left edge catches a swipe to the right instead. */}
      {!listOpen && <div className="side-swipe" onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd} aria-hidden />}
      {/* Wide screens: list on the left. Phones: slides in from the left with the edge tab (> / <) or a swipe. */}
      <aside className={`side${listOpen ? " open" : ""}`} onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}>
        <button
          type="button" className="side-tab" onClick={() => setListOpen((o) => !o)}
          aria-expanded={listOpen} aria-label={listOpen ? t("hideList") : t("list")}
        >
          <Icon name={listOpen ? "chevron-left" : "chevron-right"} size={18} />
        </button>
        <div className="side-head">
          <h2>{t("title")}</h2>
          <p>{t("subtitle")}</p>
        </div>
        <div className="list">
          {list.map((e) => {
            const { day, mon } = splitDate(e.date);
            const isToday = e.date <= today && eventEndsOn(e) >= today;
            return (
              <div
                key={e.id}
                className={`list-item${isToday ? " is-today" : ""}${e.id === selectedId ? " active" : ""}`}
                aria-current={e.id === selectedId || undefined}
                onClick={() => { setSelectedId(e.id); setListOpen(false); post({ type: "focus", lng: e.lng, lat: e.lat }); }}
              >
                {isToday && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <span className="today-badge"><img src="/today.svg" width={26} height={26} alt="" /><span>{tCal("today")}</span></span>
                )}
                <div className="li-date"><div className="d">{day}</div><div className="m">{mon}</div></div>
                <EventThumb event={e} size={36} />
                <div className="li-body">
                  <h4>{localText(e, locale).name}</h4>
                  <div className="meta">{e.venue} | {cityLabel(e.city)}</div>
                  {e.recurrence && <RepeatTag event={e} />}
                  <TransitBadges transit={e.transit} compact />
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
            event list keeps its height and phones - which hide the sidebar - still
            get filters. */}
        <MapFilters
          value={filters}
          onChange={setFilters}
          countries={countriesIn(optionItems)}
          cities={citiesIn(optionItems)}
          cityCountry={cityCountries(optionItems)}
          resultCount={list.length}
        />
        {!legendOpen ? (
          <button type="button" className="map-legend-toggle" onClick={() => setFolded("mapLegendOpen", true)} aria-expanded={false}>
            <span className="sw" style={{ background: "#0057B8" }} /><span className="sw" style={{ background: "#9e3039" }} />{t("legend")}
          </button>
        ) : (
        <div className="map-legend">
          <button type="button" className="map-legend-hide" onClick={() => setFolded("mapLegendOpen", false)} aria-label={t("hideLegend")} title={t("hideLegend")}><Icon name="close" size={12} /></button>
          {shownPlaces.some((p) => !isPracticeType(p.type)) && (
            <div className="legend-row"><span className="sw" style={{ background: "#9e3039", borderRadius: 3 }} /> {t("legendSpots")}</div>
          )}
          {shownPlaces.some((p) => isPracticeType(p.type)) && (
            <div className="legend-row"><span className="sw" style={{ background: "#0ea5e9", borderRadius: 3 }} /> {t("legendPractice")}</div>
          )}
          {legendCities.map((c) => (
            <div className="legend-row" key={c}><span className="sw" style={{ background: cityColor(c, legendCountry.get(c)) }} /> {t("legendCity", { city: cityLabel(c) })}</div>
          ))}
        </div>
        )}
        <MiniCalendar />
      </div>
    </div>
  );
}
