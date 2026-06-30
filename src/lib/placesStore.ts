import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import type { Place } from "@/types";
import { places as seed } from "./data";
import {
  apiListPlaces,
  apiCreatePlace,
  apiUpdatePlace,
  apiDeletePlace,
  type NewPlaceInput,
} from "./api";

/**
 * Places store backed by the places-service REST API (own database).
 * Same pattern as the events store.
 */
let cache: Place[] = seed;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export async function refreshPlaces() {
  try {
    cache = await apiListPlaces();
    emit();
  } catch {
    // server offline — keep sample data
  }
}

export function usePlaceStore() {
  const places = useSyncExternalStore(
    subscribe,
    () => cache,
    () => seed,
  );
  useEffect(() => {
    if (!started) {
      started = true;
      refreshPlaces();
    }
  }, []);

  return {
    places,
    async addPlace(input: NewPlaceInput) {
      await apiCreatePlace(input);
      await refreshPlaces();
    },
    async updatePlace(id: string, patch: Partial<Place>) {
      await apiUpdatePlace(id, patch);
      await refreshPlaces();
    },
    async deletePlace(id: string) {
      await apiDeletePlace(id);
      await refreshPlaces();
    },
    refreshPlaces,
  };
}
