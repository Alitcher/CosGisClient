"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { placeTypeLabel } from "@/lib/data";
import { usePlaceStore } from "@/lib/placesStore";
import SubmitSpotDialog from "@/components/SubmitSpotDialog";

export default function SpotsPage() {
  const { places } = usePlaceStore();

  return (
    <>
      <Nav />
      <div className="spots-shell">
        <span className="eyebrow">📸 cosplay-friendly</span>
        <h1 className="section-title">Where to shoot in costume</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>
          Cafés, restaurants, malls, studios and parks around the capital region that welcome
          cosplayers — each with a vibe and themes to match your shoot.
        </p>
        <div style={{ margin: "18px 0 6px" }}>
          <SubmitSpotDialog className="btn" label="＋ Submit a spot" />
        </div>

        <div className="grid spots-grid">
          {places.map((p) => (
            <div className="card spot" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="spot-photo" src={p.photos[0]?.url} alt={p.name} />
              <div className="spot-body">
                <div className="spot-top">
                  <h3>{p.name}</h3>
                  <span className="spot-type">{placeTypeLabel[p.type]}</span>
                </div>
                <div className="spot-meta">📍 {p.address ?? p.city}</div>
                {p.description && <p className="muted" style={{ fontSize: 13 }}>{p.description}</p>}
                <div className="spot-themes">
                  {p.themes.map((t) => (
                    <span className="theme-tag" key={t}>#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {places.length === 0 && (
            <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--text-2)" }}>
              No spots yet.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
