"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import type { Event } from "@/types";
import { localText } from "@/lib/localText";
import { cityLabel, countryLabel, countryOf } from "@/lib/cities";
import { fmtTimes } from "@/lib/data";
import { priceLabel, isFree } from "@/lib/price";
import { ageLabel } from "@/lib/age";
import { asNext, repeatLabel } from "@/lib/recurrence";
import { imageRelayUrl } from "@/lib/api";
import { drawSharePicture, loadPicture, loadShareFonts, type ShareCard, type ShareFormat, type ShareTheme } from "@/lib/shareImage";

const FORMATS: ShareFormat[] = ["story", "square", "wide"];

/** Site theme right now (html data-theme, else the system setting). */
function currentTheme(): ShareTheme {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * "Share as picture" for an event: pick Instagram story (9:16), square or wide (16:9),
 * light or dark, see the preview, then Share (phone share sheet: Instagram Story, ...)
 * or Download PNG. Texts are in the UI language. The link is copied too, for
 * Instagram's link sticker. Drawing: lib/shareImage.ts.
 */
export default function ShareImageDialog({ event: e, url, onClose }: { event: Event; url: string; onClose: () => void }) {
  const t = useTranslations("Share");
  const tp = useTranslations("Price");
  const ta = useTranslations("Age");
  const tr = useTranslations("Repeat");
  const tn = useTranslations("Nav");
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [format, setFormat] = useState<ShareFormat>("story");
  const [theme, setTheme] = useState<ShareTheme>(() => currentTheme());
  const [pics, setPics] = useState<{ logo: HTMLImageElement | null; img: HTMLImageElement | null } | null>(null);
  const [note, setNote] = useState("");
  const [saveView, setSaveView] = useState<string | null>(null); // phones: the PNG full screen, to long-press and save

  // Everything on the picture, in the UI language. A repeating meetup shows its next meeting.
  const today = new Date().toLocaleDateString("en-CA");
  const shown = asNext(e, today) ?? e;
  const day = new Date(`${shown.date}T12:00:00`);
  const monthRaw = new Intl.DateTimeFormat(locale, { month: "short", calendar: "gregory" }).format(day);
  const cardData: ShareCard = {
    day: String(day.getDate()),
    month: (locale === "th" ? monthRaw : monthRaw.replace(/\.$/, "")).toUpperCase(), // "marrask." -> "MARRASK", Thai keeps its dots
    weekday: new Intl.DateTimeFormat(locale, { weekday: "long", calendar: "gregory" }).format(day).replace(/^./, (c) => c.toUpperCase()),
    time: fmtTimes(shown.startTime, shown.endTime),
    name: localText(e, locale).name,
    venue: e.venue,
    city: `${cityLabel(e.city)}, ${countryLabel(countryOf(e), locale)}`,
    country: countryOf(e),
    price: priceLabel(e, tp),
    free: isFree(e),
    age: ageLabel(e, ta),
    repeat: repeatLabel(e, tr, locale) ?? "",
    tagline: tn("tagline").toUpperCase(),
  };
  const key = JSON.stringify(cardData);

  // Fonts and pictures once. The event picture comes through the server relay (other sites send
  // no CORS headers); if that fails, straight from its site; else null and the logo is used.
  useEffect(() => {
    let alive = true;
    const eventPicture = async () => (e.image ? (await loadPicture(imageRelayUrl(e.image))) ?? (await loadPicture(e.image)) : null);
    Promise.all([loadShareFonts(), loadPicture("/logo.svg"), eventPicture()]).then(([, logo, img]) => {
      if (alive) setPics({ logo, img });
    });
    return () => { alive = false; };
  }, [e.image]);

  // The PNG is made right after each redraw and kept ready: phones (iPhone Safari) only open
  // the share / save sheet straight from a tap, and waiting for the PNG inside the tap
  // handler made them refuse silently.
  const fileRef = useRef<File | null>(null);
  const [ready, setReady] = useState(false);
  const fileName = `cosoverhere-${e.id.slice(0, 8)}-${format}.png`;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pics || !canvas) return;
    drawSharePicture(canvas, format, JSON.parse(key) as ShareCard, pics, theme);
    fileRef.current = null;
    setReady(false);
    let alive = true;
    canvas.toBlob((b) => {
      if (!alive || !b) return;
      fileRef.current = new File([b], fileName, { type: "image/png" });
      setReady(true);
    }, "image/png");
    return () => { alive = false; };
  }, [pics, format, theme, key, fileName]);

  // Escape closes. Closing tells the page (e.g. the calendar's hover card) to close too.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  useEffect(() => () => { window.dispatchEvent(new Event("share-picture-closed")); }, []);

  // No awaits before navigator.share below: it must run in the same tap.
  function share() {
    const file = fileRef.current;
    if (!file) return;
    // link for Instagram's link sticker, copied in the same tap
    navigator.clipboard?.writeText(url).then(() => setNote(t("linkCopiedSticker")), () => {});
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: cardData.name }).catch(() => { /* cancelled */ });
    } else {
      download();
    }
  }
  /**
   * Save the PNG. Phones and tablets (touch, no mouse): the picture opens full screen to
   * press and hold, then "Save image" / "Add to Photos" - that works on every phone, while
   * download links do nothing on iPhones and Android share menus often have no save option.
   * Computers get a normal download; if the browser can't download, the picture opens in
   * a new tab to save by hand.
   */
  function download() {
    const f = fileRef.current;
    if (!f) return;
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) {
      // The picture alone in a new browser tab: nothing of the site on top, and holding it
      // gives the phone's own Save / Download image. Popup blocked = show it full screen here.
      const tab = window.open(URL.createObjectURL(f), "_blank");
      if (!tab) setSaveView(canvasRef.current?.toDataURL("image/png") ?? null);
      return;
    }
    const href = URL.createObjectURL(f);
    const a = document.createElement("a");
    if ("download" in a) {
      a.href = href; a.download = f.name; a.style.display = "none";
      document.body.appendChild(a); a.click(); a.remove(); // some browsers only follow links in the page
    } else {
      window.open(href, "_blank");
    }
    setTimeout(() => URL.revokeObjectURL(href), 60_000); // long enough for slow saves
  }

  // Rendered on <body>: a card moving on hover (transform) would otherwise trap the fixed dialog inside it.
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} style={saveView ? { visibility: "hidden" } : undefined} />
      {/* hidden (kept, so the preview stays drawn) while the picture is shown full screen */}
      <div className="share-dialog card" role="dialog" aria-modal="true" aria-label={t("pictureTitle")} style={saveView ? { visibility: "hidden" } : undefined}>
        <div className="sd-head">
          <h3>{t("pictureTitle")}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("close")}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="sd-options">
          <div className="seg">
            {FORMATS.map((f) => <button key={f} type="button" className={format === f ? "on" : ""} onClick={() => setFormat(f)}>{t(f)}</button>)}
          </div>
          <div className="seg">
            {(["light", "dark"] as const).map((m) => <button key={m} type="button" className={theme === m ? "on" : ""} onClick={() => setTheme(m)}>{t(m)}</button>)}
          </div>
        </div>
        <div className={`sd-preview ${format}`}>
          {!pics && <p className="muted">{t("making")}</p>}
          <canvas ref={canvasRef} hidden={!pics} />
        </div>
        {note && <p className="muted sd-note">{note}</p>}
        <div className="sd-actions">
          <button type="button" className="btn ghost" disabled={!ready} onClick={download}>{t("download")}</button>
          <button type="button" className="btn" disabled={!ready} onClick={share}>{t("sharePicture")}</button>
        </div>
      </div>
      {saveView && (
        <div className="sd-save" role="dialog" aria-modal="true" aria-label={t("download")}>
          <p>{t("longPressSave")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={saveView} alt={cardData.name} />
          <button type="button" className="btn" onClick={() => setSaveView(null)}>{t("done")}</button>
        </div>
      )}
    </>,
    document.body,
  );
}
