import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { places, placeTypeLabel } from "@/lib/data";

export default function SpotsPage() {
  return (
    <>
      <Nav />
      <div className="spots-shell">
        <span className="eyebrow">📸 cosplay-friendly</span>
        <h1 className="section-title">Where to shoot in costume</h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560 }}>
          Cafés, restaurants, malls and studios around the capital region that welcome
          cosplayers — each with a vibe and themes to match your shoot.
        </p>

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
                <p className="muted" style={{ fontSize: 13 }}>{p.description}</p>
                <div className="spot-themes">
                  {p.themes.map((t) => (
                    <span className="theme-tag" key={t}>#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
