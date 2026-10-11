import { ImageResponse } from "next/og";

/** Share-preview image size (Facebook / Discord / X recommend 1200x630). */
export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Fetch an image and inline it as a data URL, or null when it can't be used.
 * The image renderer only reads PNG/JPEG/GIF, and a failing remote image would
 * break the whole preview, so anything else is dropped.
 */
async function inlineImage(url: string | undefined): Promise<string | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(png|jpe?g|gif)/i.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * The preview card: site gradient, a small top line (date or type), the name,
 * a place line and the site name; the item's picture fills the right side.
 */
export async function ogCard(o: { kicker?: string; title: string; sub?: string; image?: string; site: string }) {
  const img = await inlineImage(o.image);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #ff4f96, #8b5cf6)", color: "#ffffff" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: img ? "60%" : "100%" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {o.kicker && <div style={{ fontSize: 30, fontWeight: 600, opacity: 0.9 }}>{o.kicker}</div>}
            <div style={{ fontSize: o.title.length > 40 ? 54 : 68, fontWeight: 800, lineHeight: 1.1, marginTop: 18 }}>{o.title}</div>
            {o.sub && <div style={{ fontSize: 30, marginTop: 22, opacity: 0.95 }}>{o.sub}</div>}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{o.site}</div>
        </div>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" width={480} height={630} style={{ width: "40%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
    ),
    OG_SIZE,
  );
}
