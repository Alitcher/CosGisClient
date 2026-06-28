import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Nav />

      <section className="about-hero shell">
        <span className="eyebrow">About the project</span>
        <h1>
          A <span className="grad">zero-budget</span> cosplay map for the Helsinki region.
        </h1>
        <p>
          This maps two things across Helsinki, Vantaa and Espoo: anime conventions, and the
          cosplay-friendly cafés, restaurants, malls and photo spots that welcome people in
          costume — each with pictures and a theme. It pulls open geospatial data from the City
          of Helsinki, renders it on a fast vector map, and ties everything together with a
          calendar and event list — all for €0/month.
        </p>
      </section>

      <section className="stack shell">
        <span className="eyebrow">Built with</span>
        <h2 className="section-title">The tech stack</h2>
        <div className="grid stack-grid" style={{ marginTop: 24 }}>
          <div className="card tech"><div className="ic">▲</div><h4>Next.js + TS</h4><p>App Router frontend</p></div>
          <div className="card tech"><div className="ic">🗺️</div><h4>MapLibre GL</h4><p>Open vector map renderer</p></div>
          <div className="card tech"><div className="ic">☁️</div><h4>Cloudflare</h4><p>Workers + D1 microservices</p></div>
          <div className="card tech"><div className="ic">🛰️</div><h4>hel.kartta.fi</h4><p>Open venue geometry</p></div>
        </div>
      </section>

      <section className="how shell">
        <span className="eyebrow">How it works</span>
        <h2 className="section-title">From open data to interactive map</h2>
        <div className="grid steps">
          <div className="card step">
            <div className="n">1</div>
            <h3>Fetch &amp; proxy</h3>
            <p>A Cloudflare Worker calls the Helsinki GIS service, sidestepping CORS and caching the GeoJSON at the edge.</p>
          </div>
          <div className="card step">
            <div className="n">2</div>
            <h3>Render on MapLibre</h3>
            <p>Venues and places become GeoJSON sources styled with custom markers and popups.</p>
          </div>
          <div className="card step">
            <div className="n">3</div>
            <h3>Connect the views</h3>
            <p>Map, calendar, events and spots share one dataset — click a date, jump to its pin.</p>
          </div>
        </div>
      </section>

      <section className="cta-band shell">
        <h2>Want to dig into the map?</h2>
        <p>Jump straight to the interactive map or browse cosplay-friendly spots across the region.</p>
        <div className="flex gap-sm center" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/map">🗺️ Open the map</Link>
          <Link className="btn ghost" href="/spots">📸 Browse spots</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
