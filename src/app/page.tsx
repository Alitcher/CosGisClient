import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroMap from "@/components/HeroMap";
import UpcomingEvents from "@/components/UpcomingEvents";

export default function Home() {
  return (
    <>
      <Nav />

      <section className="hero shell">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">✨ your cosplay map</span>
            <h1>
              Anime cons <span className="grad">+ cosplay spots</span> in Helsinki &amp; Vantaa 🎌
            </h1>
            <p className="lead">
              Find every con near you — plus the cafés, malls and photo spots that welcome
              cosplayers, with pics and themes so you know exactly where to shoot. 💜
            </p>
            <div className="hero-stats">
              <div className="stat"><div className="n">12</div><div className="l">Conventions</div></div>
              <div className="stat"><div className="n">7</div><div className="l">Venues</div></div>
              <div className="stat"><div className="n">3</div><div className="l">Cities</div></div>
              <div className="stat"><div className="n">€0</div><div className="l">Hosting cost</div></div>
            </div>
          </div>

          {/* Interactive map with the "Explore the map" button overlaid inside it */}
          <div className="hero-visual">
            <HeroMap />
            <Link className="map-cta" href="/map">🗺️ Explore the map</Link>
          </div>
        </div>
      </section>

      <section className="features shell">
        <span className="eyebrow">why you&apos;ll love it</span>
        <h2 className="section-title">Everything in one place 🌸</h2>
        <div className="grid feature-grid" style={{ marginTop: 30 }}>
          <div className="card feature">
            <div className="ic">🗺️</div>
            <h3>See it on the map</h3>
            <p>Cute markers for every venue, tap one to see what&apos;s happening there. Find the con closest to you in seconds.</p>
          </div>
          <div className="card feature">
            <div className="ic">📅</div>
            <h3>Plan your year</h3>
            <p>A full calendar to plan ahead, plus a mini one tucked right inside the map so you never lose track of dates.</p>
          </div>
          <div className="card feature">
            <div className="ic">📸</div>
            <h3>Cosplay-friendly spots</h3>
            <p>Cafés, restaurants and malls that welcome cosplayers — browse their photos and themes to find your perfect shoot location.</p>
          </div>
        </div>
      </section>

      <section className="upcoming shell">
        <div className="up-head">
          <div>
            <span className="eyebrow">Next on the schedule</span>
            <h2 className="section-title">Upcoming conventions</h2>
          </div>
          <Link className="btn ghost" href="/events">See all events →</Link>
        </div>
        <UpcomingEvents />
      </section>

      <Footer />
    </>
  );
}
