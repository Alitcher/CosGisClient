"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { apiSubmitEvent, ApiError } from "@/lib/api";
import { geocode } from "@/lib/geocode";
import { useCityFromCoords } from "@/lib/useCityFromCoords";
import AddressAutocomplete from "./AddressAutocomplete";
import CitySelect from "./CitySelect";
import EventThumb from "./EventThumb";
import Icon from "./Icon";
import PriceFields from "./PriceFields";
import AgeFields from "./AgeFields";
import RepeatFields from "./RepeatFields";
import { EMPTY_REPEAT, repeatError, repeatFields, type RepeatForm } from "@/lib/recurrence";
import { EMPTY_AGE, ageError, ageFields, type AgeForm } from "@/lib/age";
import { EMPTY_PRICE, priceFields, priceError, type PriceForm } from "@/lib/price";
import type { City, Country, Lang } from "@/types";

/**
 * A "Submit event" button + slide-in form for the public. Submissions land in the
 * pending queue (status: pending) and only appear on the map after an admin
 * approves them in the admin dashboard's Pending tab.
 */
type Form = {
  name: string; venue: string; country: Country; city: City; date: string; endDate: string;
  startTime: string; endTime: string;
  lng: string; lat: string; description: string; url: string; image: string; submittedBy: string; price: PriceForm; age: AgeForm;
  repeat: RepeatForm; // convention or repeating community meetup
};
const EMPTY: Form = { name: "", venue: "", country: "FI", city: "", date: "", endDate: "", startTime: "", endTime: "", lng: "", lat: "", description: "", url: "", image: "", submittedBy: "", price: EMPTY_PRICE, age: EMPTY_AGE, repeat: EMPTY_REPEAT };

/** `kind` = what the form starts as (the Local community buttons open it as a meetup). */
export default function SubmitEventDialog({ className = "btn", label, kind = "convention" }: { className?: string; label?: string; kind?: RepeatForm["kind"] }) {
  const t = useTranslations("SubmitEvent");
  const tf = useTranslations("SubmitForm");
  const tp = useTranslations("Price");
  const ta = useTranslations("Age");
  const tk = useTranslations("EventKind");
  const tc = useTranslations("Common");
  const locale = useLocale() as Lang; // the text is written in the UI language (used for auto-translation)
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  const [locQuery, setLocQuery] = useState("");
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const cityDetect = useCityFromCoords(f.lng, f.lat, (p) => setF((s) => ({ ...s, country: p.country, city: p.city ?? "" })));

  function close() { setOpen(false); }
  function start() { setF({ ...EMPTY, repeat: { ...EMPTY_REPEAT, kind } }); setLocQuery(""); setSent(false); setOpen(true); }
  const community = f.repeat.kind === "community";

  async function submit() {
    if (!f.name.trim() || !f.venue.trim() || !f.date) return alert(t("required"));
    if (!community && f.endDate && f.endDate < f.date) return alert(t("endBeforeStart"));
    const re = repeatError(f.repeat, f.date);
    if (re) return alert(tk(re));
    if ((community || !f.endDate || f.endDate === f.date) && f.startTime && f.endTime && f.endTime < f.startTime) return alert(t("endTimeBeforeStart"));
    let lng = Number(f.lng), lat = Number(f.lat), city = f.city.trim();
    if (f.lng === "" || f.lat === "") {
      const hit = (await geocode(locQuery, undefined, f.country).catch(() => []))[0];
      if (!hit) return alert(t("needCoords"));
      lng = hit.lng; lat = hit.lat;
      if (!city && hit.city) city = hit.city;
    }
    if (!city) return alert(tf("needCity"));
    const pe = priceError(f.price);
    if (pe) return alert(tp(pe));
    const ae = ageError(f.age);
    if (ae) return alert(ta(ae));
    setBusy(true);
    try {
      await apiSubmitEvent({
        name: f.name.trim(), venue: f.venue.trim(), lang: locale, country: f.country, city, date: f.date,
        endDate: (!community && f.endDate) || undefined,
        ...repeatFields(f.repeat),
        startTime: f.startTime || undefined,
        endTime: f.endTime || undefined,
        lng, lat,
        description: f.description.trim() || undefined,
        url: f.url.trim() || undefined,
        ...priceFields(f.price),
        ...ageFields(f.age),
        image: f.image.trim() || undefined,
        submittedBy: f.submittedBy.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) alert(tf("duplicate"));
      else alert(tf("submitFailed", { error: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className={className} type="button" onClick={start}>{label ?? tc("submitEvent")}</button>

      {open && <div className="overlay" onClick={close} />}
      <aside className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-head">
          <h3>{t("title")}</h3>
          <button className="close-x" type="button" onClick={close} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>

        {sent ? (
          <div className="drawer-body">
              <h4 style={{ marginBottom: 6 }}>{tf("thanksTitle")}</h4>
            <p className="muted">{t("thanksText")}</p>
            <div className="drawer-foot" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <button className="btn" type="button" onClick={close}>{tf("done")}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <p className="muted" style={{ marginBottom: 14, fontSize: 13 }}>{t("intro")}</p>
              <div className="field"><label>{t("name")}</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={t("namePlaceholder")} /></div>
              <div className="field"><label>{t("venue")}</label><input value={f.venue} onChange={(e) => set("venue", e.target.value)} placeholder={t("venuePlaceholder")} /></div>
              <div className="field-row">
                <div className="field"><label>{community ? tk("firstDate") : t("startDate")}</label><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></div>
                {!community && <div className="field"><label>{t("endDate")}</label><input type="date" value={f.endDate} min={f.date || undefined} onChange={(e) => set("endDate", e.target.value)} /></div>}
              </div>
              <RepeatFields value={f.repeat} date={f.date} onChange={(p) => set("repeat", { ...f.repeat, ...p })} />
              <div className="field-row">
                <div className="field"><label>{t("startTime")}</label><input type="time" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} /></div>
                <div className="field"><label>{t("endTime")}</label><input type="time" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} /></div>
              </div>
              <div className="field">
                <label>{t("location")}</label>
                <AddressAutocomplete
                  country={f.country}
                  value={locQuery}
                  onChange={(v) => { setLocQuery(v); setF((s) => ({ ...s, lng: "", lat: "" })); }}
                  onSelect={(r) => {
                    set("lng", String(r.lng));
                    set("lat", String(r.lat));
                  }}
                  placeholder={t("locationPlaceholder")}
                />
              </div>
              <CitySelect country={f.country} city={f.city} onCountry={(c) => set("country", c)} onCity={(c) => set("city", c)} detect={cityDetect} />
              <div className="field"><label>{tf("description")}</label><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder={t("descriptionPlaceholder")} /></div>
              <PriceFields value={f.price} onChange={(p) => set("price", { ...f.price, ...p })} />
              <AgeFields value={f.age} onChange={(p) => set("age", { ...f.age, ...p })} />
              <div className="field"><label>{t("link")}</label><input type="url" value={f.url} onChange={(e) => set("url", e.target.value)} placeholder={t("linkPlaceholder")} /></div>
              <div className="field">
                <label>{t("image")}</label>
                <div className="thumb-input">
                  <EventThumb event={{ name: f.name, image: f.image.trim() || undefined }} size={44} />
                  <input type="url" value={f.image} onChange={(e) => set("image", e.target.value)} placeholder={t("imagePlaceholder")} />
                </div>
              </div>
              <div className="field"><label>{tf("yourName")}</label><input value={f.submittedBy} onChange={(e) => set("submittedBy", e.target.value)} placeholder={tf("yourNamePlaceholder")} /></div>
            </div>
            <div className="drawer-foot">
              <button className="btn ghost" type="button" onClick={close}>{tf("cancel")}</button>
              <button className="btn" type="button" disabled={busy} onClick={submit}>{busy ? tf("submitting") : tf("submit")}</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
