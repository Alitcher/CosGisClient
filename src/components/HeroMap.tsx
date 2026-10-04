"use client";

// The React/MapLibre integration kept rendering blank, while the standalone page
// at /map-embed.html renders the 3D map perfectly. So we embed that working page.
export default function HeroMap({ title }: { title: string }) {
  return (
    <iframe
      src="/map-embed.html"
      title={title}
      className="hero-map"
      style={{ border: 0, width: "100%", height: "100%" }}
    />
  );
}
