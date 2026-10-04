"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { apiSubmitPlace } from "@/lib/api";
import { useCityFromCoords } from "@/lib/useCityFromCoords";
import AddressAutocomplete from "./AddressAutocomplete";
import CitySelect from "./CitySelect";
import { PHOTO_TYPES, PRACTICE_TYPES, FACILITIES, type City, type PlaceType, type Booking, type Price, type Facility } from "@/types";

/**
 * A "Submit spot" button + slide-in form for the public. Submissions land in the
 * pending queue (status: pending) and only appear on the map after an admin
 * approves them in the admin dashboard's Pending tab.
 *
 * `purpose="practice"` turns it into the Practice tab's form: practice place
 * types plus booking / price / facilities fields. (Whether under-18s may use a
 * place is set by an admin, never by submitters.)
 */
type Form = {
  name: string; type: PlaceType; city: City; address: string;
  lng: string; lat: string; themes: string; photo: string;
  description: string; openingHours: string; submittedBy: string;
  booking: Booking | ""; price: Price | ""; priceNote: string; facilities: Facility[]; bookingUrl: string;
};
const EMPTY: Form = { name: "", type: "cafe", city: "Helsinki", address: "", lng: "", lat: "", themes: "", photo: "", description: "", openingHours: "", submittedBy: "", booking: "", price: "", priceNote: "", facilities: [], bookingUrl: "" };

export default function SubmitSpotDialog({ className = "btn", label, purpose = "photo" }: { className?: string; label?: string; purpose?: "photo" | "practice" }) {
  const practice = purpose === "practice";
  const t = useTranslations("SubmitSpot");
  const tp = useTranslations("SubmitPractice");
  const tPr = useTranslations("Practice");
  const tf = useTranslations("SubmitForm");
  const tc = useTranslations("Common");
  const tType = useTranslations("PlaceTypes");
  const types = practice ? PRACTICE_TYPES : PHOTO_TYPES;
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Form>(EMPTY);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));
  const toggleFacility = (x: Facility) =>
    set("facilities", f.facilities.includes(x) ? f.facilities.filter((y) => y !== x) : [...f.facilities, x]);
  const cityDetect = useCityFromCoords(f.lng, f.lat, (c) => set("city", c));

  function close() { setOpen(false); }
  function start() { setF({ ...EMPTY, type: types[0] }); setSent(false); setOpen(true); }

  async function submit() {
    if (!f.name.trim()) return alert(t("required"));
    const lng = Number(f.lng), lat = Number(f.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || f.lng === "" || f.lat === "")
      return alert(`${t("needCoords")}\n${tf("needCoordsTip")}`);
    setBusy(true);
    try {
      await apiSubmitPlace({
        name: f.name.trim(), type: f.type, city: f.city,
        address: f.address.trim() || undefined,
        lng, lat,
        themes: f.themes.split(",").map((t) => t.trim()).filter(Boolean),
        photos: f.photo.trim() ? [{ url: f.photo.trim() }] : [],
        description: f.description.trim() || undefined,
        openingHours: f.openingHours.trim() || undefined,
        submittedBy: f.submittedBy.trim() || undefined,
        ...(practice && {
          booking: f.booking || undefined,
          price: f.price || undefined,
          priceNote: f.priceNote.trim() || undefined,
          facilities: f.facilities,
          bookingUrl: f.bookingUrl.trim() || undefined,
        }),
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
      <button className={className} type="button" onClick={start}>{label ?? tc(practice ? "submitPracticeSpot" : "submitSpot")}</button>

      {open && <div className="overlay" onClick={close} />}
      <aside className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-head">
          <h3>{practice ? tp("title") : t("title")}</h3>
          <button className="close-x" type="button" onClick={close}>✕</button>
        </div>

        {sent ? (
          <div className="drawer-body">
            <p style={{ fontSize: 40, margin: "10px 0" }}>🎉</p>
            <h4 style={{ marginBottom: 6 }}>{tf("thanksTitle")}</h4>
            <p className="muted">{practice ? tp("thanksText") : t("thanksText")}</p>
            <div className="drawer-foot" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <button className="btn" type="button" onClick={close}>{tf("done")}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <p className="muted" style={{ marginBottom: 14, fontSize: 13 }}>{practice ? tp("intro") : t("intro")}</p>
              <div className="field"><label>{t("name")}</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={practice ? tp("namePlaceholder") : t("namePlaceholder")} /></div>
              <div className="field"><label>{t("type")}</label><select value={f.type} onChange={(e) => set("type", e.target.value as PlaceType)}>{types.map((x) => <option key={x} value={x}>{x === "outdoor" ? t("typeOutdoor") : tType(x)}</option>)}</select></div>
              <div className="field">
                <label>{t("address")}</label>
                <AddressAutocomplete
                  value={f.address}
                  onChange={(v) => set("address", v)}
                  onSelect={(r) => {
                    set("address", r.label);
                    set("lng", String(r.lng));
                    set("lat", String(r.lat));
                  }}
                  placeholder={t("addressPlaceholder")}
                />
              </div>
              <div className="field-row">
                <div className="field"><label>{tf("longitude")}</label><input value={f.lng} onChange={(e) => set("lng", e.target.value)} placeholder="24.9402" /></div>
                <div className="field"><label>{tf("latitude")}</label><input value={f.lat} onChange={(e) => set("lat", e.target.value)} placeholder="60.1641" /></div>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>{tf("coordsHint")}</p>
              <CitySelect value={f.city} onChange={(c) => set("city", c)} detect={cityDetect} />
              <div className="field"><label>{practice ? tp("genres") : t("themes")}</label><input value={f.themes} onChange={(e) => set("themes", e.target.value)} placeholder={practice ? tp("genresPlaceholder") : t("themesPlaceholder")} /></div>
              {practice && (
                <>
                  <div className="field-row">
                    <div className="field"><label>{tp("booking")}</label><select value={f.booking} onChange={(e) => set("booking", e.target.value as Form["booking"])}><option value="">{tp("notSet")}</option>{(["drop-in", "booking-required", "classes-only"] as const).map((x) => <option key={x} value={x}>{tPr(x)}</option>)}</select></div>
                    <div className="field"><label>{tp("price")}</label><select value={f.price} onChange={(e) => set("price", e.target.value as Form["price"])}><option value="">{tp("notSet")}</option><option value="free">{tPr("free")}</option><option value="paid">{tPr("paid")}</option></select></div>
                  </div>
                  <div className="field"><label>{tp("priceNote")}</label><input value={f.priceNote} onChange={(e) => set("priceNote", e.target.value)} placeholder={tp("priceNotePlaceholder")} /></div>
                  <div className="field">
                    <label>{tp("facilities")}</label>
                    <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                      {FACILITIES.map((x) => (
                        <label key={x} style={{ display: "inline-flex", gap: 6, alignItems: "center", fontWeight: 400 }}>
                          <input type="checkbox" checked={f.facilities.includes(x)} onChange={() => toggleFacility(x)} /> {tPr(x)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="field"><label>{tp("bookingUrl")}</label><input value={f.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" /></div>
                </>
              )}
              <div className="field"><label>{t("photo")}</label><input value={f.photo} onChange={(e) => set("photo", e.target.value)} placeholder="https://…" /></div>
              <div className="field"><label>{t("openingHours")}</label><input value={f.openingHours} onChange={(e) => set("openingHours", e.target.value)} placeholder="10:00–20:00" /></div>
              <div className="field"><label>{tf("description")}</label><textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder={practice ? tp("descriptionPlaceholder") : t("descriptionPlaceholder")} /></div>
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
