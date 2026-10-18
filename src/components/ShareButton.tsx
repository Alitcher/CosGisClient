"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Event } from "@/types";
import ShareImageDialog from "./ShareImageDialog";

/**
 * Share button for an event or spot: opens a small menu with Facebook, Discord,
 * Instagram and Copy link. The shared link is the item's own page (/events/[id] or
 * /spots/[id]), whose title, text and picture show up as the share preview.
 *
 * Only Facebook has a web share URL. Discord and Instagram have none, so they
 * use the phone's share sheet when there is one (navigator.share), otherwise the
 * link is copied with a "paste it in ..." note.
 *
 * With an `event`, the menu also has "Share as picture" (ShareImageDialog): a PNG for
 * Instagram stories and posts, which is the only way to get an event into a story.
 */
export default function ShareButton({ title, path, event }: { title: string; path: string; event?: Event }) {
  const t = useTranslations("Share");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [picture, setPicture] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const url = () => `${window.location.origin}/${locale}${path}`;

  async function copy(message: string) {
    try {
      await navigator.clipboard.writeText(url());
      setNote(message);
    } catch {
      setNote(url()); // clipboard blocked: show the link so it can be copied by hand
    }
    setTimeout(() => setNote(null), 2500);
  }

  /** Phone share sheet (lists Instagram, Discord, ...) or copy as a fallback. */
  async function shareTo(app: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: url() });
        setOpen(false);
        return;
      } catch {
        // cancelled or not allowed: fall back to copying
      }
    }
    await copy(t("pasteIn", { app }));
  }

  function facebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, "_blank", "noopener,noreferrer,width=600,height=500");
    setOpen(false);
  }

  return (
    <div className="share" ref={rootRef}>
      <button type="button" className="icon-btn" aria-label={t("share")} title={t("share")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
        </svg>
      </button>
      {open && (
        <div className="share-menu" role="menu">
          <button type="button" role="menuitem" onClick={facebook}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1877F2" /><path d="M13.4 21v-7h2.4l.4-2.8h-2.8V9.5c0-.8.3-1.4 1.4-1.4h1.5V5.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2h-2.4V14h2.4v7z" fill="#fff" /></svg>
            Facebook
          </button>
          <button type="button" role="menuitem" onClick={() => shareTo("Discord")}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#5865F2" d="M19.3 5.3A16 16 0 0 0 15.4 4l-.5 1a14.8 14.8 0 0 0-5.8 0l-.5-1a16 16 0 0 0-3.9 1.3C2.3 9 1.7 12.6 2 16.2a16 16 0 0 0 4.8 2.4l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11.4 11.4 0 0 0 10.8 0l.4.3a10 10 0 0 1-1.6.8l1 1.6a16 16 0 0 0 4.8-2.4c.4-4.2-.6-7.8-2.7-10.9ZM8.7 14c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" /></svg>
            Discord
          </button>
          <button type="button" role="menuitem" onClick={() => shareTo("Instagram")}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#E1306C" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none" /></svg>
            Instagram
          </button>
          {event && (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); setPicture(true); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 9" /></svg>
              {t("picture")}
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => copy(t("copied"))}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
            {t("copyLink")}
          </button>
          {note && <p className="share-note" role="status">{note}</p>}
        </div>
      )}
      {picture && event && <ShareImageDialog event={event} url={url()} onClose={() => setPicture(false)} />}
    </div>
  );
}
