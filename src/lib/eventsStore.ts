import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import type { Event } from "@/types";
import { events as seed } from "./data";

/**
 * Tiny client-side events store backed by localStorage, so the Admin page can
 * add / edit / delete events and have the change show up across the app
 * (events list, calendar, map) without a running backend.
 *
 * First render returns the seed data (matches SSR); after mount it hydrates from
 * localStorage, so there's no hydration mismatch.
 */
const KEY = "cosplaymap-events";
let cache: Event[] = seed;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as Event[];
      emit();
    }
  } catch {
    /* ignore */
  }
}

export function getEvents(): Event[] {
  return cache;
}
export function setEvents(next: Event[]) {
  cache = next;
  persist();
  emit();
}

export function useEventStore() {
  const events = useSyncExternalStore(
    subscribe,
    () => cache,
    () => seed,
  );
  useEffect(() => {
    hydrate();
  }, []);

  return {
    events,
    addEvent(e: Event) {
      setEvents([...cache, e]);
    },
    updateEvent(id: string, patch: Partial<Event>) {
      setEvents(cache.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    },
    deleteEvent(id: string) {
      setEvents(cache.filter((x) => x.id !== id));
    },
    resetEvents() {
      setEvents(seed);
    },
  };
}
