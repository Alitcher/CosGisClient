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

  useEffect(() => {
    if (pics && canvasRef.current) drawSharePicture(canvasRef.current, format, JSON.parse(key) as ShareCard, pics, theme);
  }, [pics, format, theme, key]);

  // Escape closes.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fileName = `cosoverhere-${e.id.slice(0, 8)}-${format}.png`;
  const toFile = () =>
    new Promise<File | null>((ok) => canvasRef.current?.toBlob((b) => ok(b ? new File([b], fileName, { type: "image/png" }) : null), "image/png") ?? ok(null));

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setNote(t("linkCopiedSticker")); } catch { /* clipboard blocked: skip */ }
  }
  async function share() {
    const file = await toFile();
    if (!file) return;
    await copyLink(); // for Instagram's link sticker
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: cardData.name }); } catch { /* cancelled */ }
    } else {
      download(file);
    }
  }
  function download(file?: File | null) {
    const go = (f: File | null) => {
      if (!f) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(f); a.download = f.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    if (file) go(file); else void toFile().then(go);
  }

  // Rendered on <body>: a card moving on hover (transform) would otherwise trap the fixed dialog inside it.
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} />
      <div className="share-dialog card" role="dialog" aria-modal="true" aria-label={t("pictureTitle")}>
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
          <button type="button" className="btn ghost" disabled={!pics} onClick={() => download()}>{t("download")}</button>
          <button type="button" className="btn" disabled={!pics} onClick={share}>{t("sharePicture")}</button>
        </div>
      </div>
    </>,
    document.body,
  );
}
