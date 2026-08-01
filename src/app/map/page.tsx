import { Suspense } from "react";
import Nav from "@/components/Nav";
import MapView from "@/components/MapView";

export default function MapPage() {
  return (
    <>
      <Nav />
      {/* MapView reads ?lng=&lat= via useSearchParams, which needs a Suspense boundary. */}
      <Suspense fallback={<div style={{ padding: 24, color: "var(--text-2)" }}>Loading map…</div>}>
        <MapView />
      </Suspense>
    </>
  );
}
