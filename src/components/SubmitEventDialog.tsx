"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiSubmitEvent } from "@/lib/api";
import { useCityFromCoords } from "@/lib/useCityFromCoords";
import AddressAutocomplete from "./AddressAutocomplete";
import CitySelect from "./CitySelect";
import EventThumb from "./EventThumb";
import type { City, Country } from "@/types";

/**
 * A "Submit event" button + slide-in form for the public. Submissions land in the
 * pending queue (status: pending) and only appear on the map after an admin
 * approves them in the admin dashboard's Pending tab.
 */
type Form = {
  name: string; venue: string; country: Country; city: City; date: string; endDate: string;
  startTime: string; endTime: string;
  lng: string; lat: string; description: string; image: string; submittedBy: string;
};
const EMPTY: Form = { name: "", venue: "", country: "FI", city: "", date: "", endDate: "", startTime: "", endTime: "", lng: "", lat: "", description: "", image: "", submittedBy: "" };

export default function SubmitEventDialog({ className = "btn", label }: { className?: string; label?: string }) {
  const t = useTranslations("SubmitEvent");
  const tf = useTranslations("SubmitForm");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  const [locQuery, setLocQuery] = useState("");
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const cityDetect = useCityFromCoords(f.lng, f.lat, (p) => setF((s) => ({ ...s, country: p.country, city: p.city ?? "" })));

  function close() { setOpen(false); }
  function start() { setF(EMPTY); setLocQuery(""); setSent(false); setOpen(true); }

  async function submit() {
    if (!f.name.trim() || !f.venue.trim() || !f.date) return alert(t("required"));
    if (f.endDate && f.endDate < f.date) return alert(t("endBeforeStart"));
    if ((!f.endDate || f.endDate === f.date) && f.startTime && f.endTime && f.endTime < f.startTime) return alert(t("endTimeBeforeStart"));
    const lng = Number(f.lng), lat = Number(f.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || f.lng === "" || f.lat === "")
      return alert(`${t("needCoords")}\n${tf("needCoordsTip")}`);
    if (!f.city.trim()) return alert(tf("needCity"));
    setBusy(true);
    try {
      await apiSubmitEvent({
        name: f.name.trim(), venue: f.venue.trim(), country: f.country, city: f.city.trim(), date: f.date,
        endDate: f.endDate || undefined,
        startTime: f.startTime || undefined,
        endTime: f.endTime || undefined,
        lng, lat,
        description: f.description.trim() || undefined,
        image: f.image.trim() || undefined,
        submittedBy: f.submittedBy.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      alert(tf("submitFailed", { error: (err as Error).message }));
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
          <button className="close-x" type="button" onClick={close}>✕</button>
        </div>

        {sent ? (
          <div className="drawer-body">
            <p style={{ fontSize: 40, margin: "10px 0" }}>🎉</p>
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
                <div className="field"><label>{t("startDate")}</label><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></div>
                <div className="field"><label>{t("endDate")}</label><input type="date" value={f.endDate} min={f.date || undefined} onChange={(e) => set("endDate", e.target.value)} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label>{t("startTime")}</label><input type="time" value={f.startTime} onChange={(e) => set("startTime", e.target.value)} /></div>
                <div className="field"><label>{t("endTime")}</label><input type="time" value={f.endTime} onChange={(e) => set("endTime", e.target.value)} /></div>
              </div>
              <div className="field">
                <label>{t("location")}</label>
                <AddressAutocomplete
                  value={locQuery}
                  onChange={setLocQuery}
                  onSelect={(r) => {
                    set("lng", String(r.lng));
                    set("lat", String(r.lat));
                  }}
                  placeholder={t("locationPlaceholder")}
                />
              </div>
              <div className="field-row">
                <div className="field"><label>{tf("longitude")}</label><input value={f.lng} onChange={(e) => set("lng", e.target.value)} placeholder="24.9354" /></div>
                <div className="field"><label>{tf("latitude")}</label><input value={f.lat} onChange={(e) => set("lat", e.target.value)} placeholder="60.2012" /></div>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>{tf("coordsHint")}</p>
              <CitySelect country={f.country} city={f.city} onCountry={(c) => set("country", c)} onCity={(c) => set("city", c)} detect={cityDetect} />
              <div className="field"><label>{tf("description")}</label><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder={t("descriptionPlaceholder")} /></div>
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
