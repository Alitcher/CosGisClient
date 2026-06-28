import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function DonatePage() {
  return (
    <>
      <Nav />

      <section className="d-hero">
        <span className="d-emoji">☕</span>
        <h1>Keep the map <span className="grad">caffeinated</span> 💛</h1>
        <p>
          This whole thing is a free, no-ads passion project for the Finnish cosplay community.
          If it helped you find your next con or shoot spot, a coffee keeps the data fresh and
          the servers humming!
        </p>
        <div className="bmc-wrap">
          <a className="bmc" href="https://www.buymeacoffee.com/" target="_blank" rel="noopener noreferrer">
            <span className="cup">☕</span> Buy me a coffee
          </a>
          <span className="bmc-note">Secure checkout via Buy Me a Coffee · no account needed</span>
        </div>
      </section>

      <section className="tiers">
        <div style={{ textAlign: "center" }}>
          <span className="eyebrow">pick your cup</span>
          <h2 className="section-title">Every sip helps 🌸</h2>
        </div>
        <div className="grid tiers-grid">
          <div className="card tier">
            <div className="cups">☕</div>
            <h3>Espresso</h3>
            <div className="price">€3</div>
            <ul>
              <li>A warm thank-you</li>
              <li>Keeps the lights on for a day</li>
              <li>Good vibes sent your way</li>
            </ul>
          </div>
          <div className="card tier pop">
            <span className="badge">⭐ most loved</span>
            <div className="cups">☕☕</div>
            <h3>Latte</h3>
            <div className="price">€8</div>
            <ul>
              <li>Everything in Espresso</li>
              <li>Your name on the supporters wall</li>
              <li>Helps add new spots faster</li>
            </ul>
          </div>
          <div className="card tier">
            <div className="cups">☕☕☕</div>
            <h3>Whole pot</h3>
            <div className="price">€20</div>
            <ul>
              <li>Everything in Latte</li>
              <li>Shoutout on the socials</li>
              <li>Funds a month of hosting</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="why">
        <div className="card why-card">
          <h2>Where your coffee goes ☕→🗺️</h2>
          <p>
            100% of donations go straight into running the project — there are no salaries here,
            just someone who loves cosplay and open maps.
          </p>
          <div className="why-stats">
            <div className="s"><div className="n">€0</div><div className="l">Ads ever</div></div>
            <div className="s"><div className="n">100%</div><div className="l">To the project</div></div>
            <div className="s"><div className="n">∞</div><div className="l">Gratitude</div></div>
          </div>
        </div>
      </section>

      <section className="other">
        <a href="#">⭐ Star on GitHub</a>
        <a href="#">📣 Share with friends</a>
        <a href="#">✍️ Submit a spot</a>
      </section>

      <Footer />
    </>
  );
}
