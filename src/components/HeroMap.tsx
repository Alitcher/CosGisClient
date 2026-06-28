"use client";

// The React/MapLibre integration kept rendering blank, while the standalone page
// at /map-embed.html renders the 3D map perfectly. So we embed that working page.
export default function HeroMap() {
  return (
    <iframe
      src="/map-embed.html"
      title="Map of cosplay venues"
      className="hero-map"
      style={{ border: 0, width: "100%", height: "100%" }}
    />
  );
}
