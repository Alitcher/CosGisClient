import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import type { Event } from "@/types";
import { events as seed } from "./data";
import {
  apiListEvents,
  apiCreateEvent,
  apiUpdateEvent,
  apiDeleteEvent,
  type NewEventInput,
} from "./api";

/**
 * Events store backed by the events-service REST API. Seeds from local sample
 * data so the UI renders immediately and still works if the server is offline;
 * fetches live data on mount; admin writes go through the API then refetch.
 */
let cache: Event[] = seed;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export async function refreshEvents() {
  try {
    cache = await apiListEvents();
    emit();
  } catch {
    // server not reachable — keep current cache (sample data) so the app still works
  }
}

export function useEventStore() {
  const events = useSyncExternalStore(
    subscribe,
    () => cache,
    () => seed,
  );
  useEffect(() => {
    if (!started) {
      started = true;
      refreshEvents();
    }
  }, []);

  return {
    events,
    async addEvent(input: NewEventInput) {
      await apiCreateEvent(input);
      await refreshEvents();
    },
    async updateEvent(id: string, patch: Partial<Event>) {
      await apiUpdateEvent(id, patch);
      await refreshEvents();
    },
    async deleteEvent(id: string) {
      await apiDeleteEvent(id);
      await refreshEvents();
    },
    refreshEvents,
  };
}
