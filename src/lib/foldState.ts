import { useSyncExternalStore } from "react";

/**
 * Open / folded state of a small map panel (mini calendar, legend), remembered in this
 * browser under `key`. First visit: open on wide screens, folded on phones and small
 * tablets, where the panels cover too much of the map. The server render is folded.
 */
const listeners = new Set<() => void>();
const memo = new Map<string, boolean>();

function read(key: string): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "1" || v === "0") return v === "1";
  } catch {
    // storage blocked: fall back to the screen size
  }
  return window.matchMedia("(min-width: 1025px)").matches;
}

export function setFolded(key: string, open: boolean): void {
  try {
    localStorage.setItem(key, open ? "1" : "0");
  } catch {
    // storage blocked: only for this visit
  }
  memo.set(key, open);
  listeners.forEach((l) => l());
}

/** True while the panel is open. */
export function useFoldOpen(key: string): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => { if (!memo.has(key)) memo.set(key, read(key)); return memo.get(key)!; },
    () => false,
  );
}
