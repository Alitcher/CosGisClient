/**
 * "Share as picture": draws an event as a PNG-ready canvas in three formats
 * (Instagram story 9:16, square 1:1, wide 16:9), light or dark, in the site colours
 * (DESIGN.md) with a faint Nordic folk pattern behind the card. Mockup:
 * hel-anime-gis/mockups/share-image.html. Used by ShareImageDialog.
 *
 * Fonts are the site's Google Fonts (Manrope, Inter, Noto Sans Thai for Thai letters);
 * call `loadShareFonts()` before drawing so the canvas uses them.
 */

export type ShareFormat = "story" | "square" | "wide";
export type ShareTheme = "light" | "dark";
export const SHARE_SIZES: Record<ShareFormat, [number, number]> = { story: [1080, 1920], square: [1080, 1080], wide: [1920, 1080] };

/** Everything written on the picture, already in the viewer's language. */
export type ShareCard = {
  day: string;      // "21"
  month: string;    // "NOV"
  weekday: string;  // "Saturday"
  time: string;     // "10:00-18:00" ("" = no time)
  name: string;
  venue: string;
  city: string;     // "Tampere, Finland"
  country: string;  // ISO code for the flag, e.g. "FI"
  price: string;    // "Free", "22-140 EUR"
  free: boolean;    // green price tag
  age: string;      // "All ages", "Ages 9-12"
  repeat: string;   // "Recurring" or "" (not repeating)
  tagline: string;  // "NORDIC & BALTIC"
};

type Theme = {
  bg: string; card: string; border: string; navy: string; text: string; blue2: string; red: string;
  tagFill: string; tagText: string; tagBorder: string; ageFill: string; ageText: string; ageBorder: string; empty: string; pattern: string;
};
// Same colours as globals.css light / dark.
const THEMES: Record<ShareTheme, Theme> = {
  light: {
    bg: "#f3f7fc", card: "#ffffff", border: "rgba(0, 53, 128, 0.16)", navy: "#0b1f3f", text: "#002F6C", blue2: "#0072ce", red: "#c8102e",
    tagFill: "#e8f1fc", tagText: "#003580", tagBorder: "rgba(0, 114, 206, 0.45)", ageFill: "#eef4fc", ageText: "#002F6C", ageBorder: "rgba(0, 53, 128, 0.5)",
    empty: "#eef4fc", pattern: "rgba(0, 53, 128, 0.08)",
  },
  dark: {
    bg: "#040a17", card: "#0e1b31", border: "rgba(255, 255, 255, 0.10)", navy: "#f1f6ff", text: "#bccbe3", blue2: "#4fb0ff", red: "#ff5a6e",
    tagFill: "#14304f", tagText: "#5b9cf0", tagBorder: "rgba(79, 176, 255, 0.35)", ageFill: "#172a4a", ageText: "#bccbe3", ageBorder: "rgba(90, 160, 240, 0.55)",
    empty: "#172a4a", pattern: "rgba(150, 190, 255, 0.07)",
  },
};
const FREE_GREEN = "#006a44"; // Lithuanian flag green, like the site's Free tag
const DISPLAY = `Manrope, "Noto Sans Thai"`;
const BODY = `Inter, "Noto Sans Thai"`;

type Ctx = CanvasRenderingContext2D;
type Pics = { logo: HTMLImageElement | null; img: HTMLImageElement | null };

/** Wait until the fonts the picture uses are loaded (canvas silently falls back otherwise). */
export async function loadShareFonts(): Promise<void> {
  const faces = ["800 40px Manrope", "800 40px Inter", "700 40px Inter", "600 40px Inter", "500 40px Inter", `800 40px "Noto Sans Thai"`, `700 40px "Noto Sans Thai"`];
  await Promise.all(faces.map((f) => document.fonts.load(f, "abc ไทย").catch(() => [])));
}

/** Load a picture for the canvas. Other sites' pictures need CORS, or the PNG can't be saved: null then. */
export function loadPicture(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((ok) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

function wrap(ctx: Ctx, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/), lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width <= maxW || !line) line = test;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const cut = lines.slice(0, maxLines);
  let last = cut[maxLines - 1];
  while (ctx.measureText(`${last}...`).width > maxW && last.length > 1) last = last.slice(0, -1);
  cut[maxLines - 1] = `${last.trimEnd()}...`;
  return cut;
}
const rr = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

/** A card: filled shape with the site's card border. */
function card(ctx: Ctx, t: Theme, x: number, y: number, w: number, h: number, r: number, fill: string, s: number) {
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 4 * s; ctx.strokeStyle = t.border; ctx.stroke();
}

/** A small tag like the site's price / age tags. Returns its width. */
function tag(ctx: Ctx, x: number, y: number, text: string, size: number, fill: string, color: string, border: string, s: number): number {
  ctx.font = `800 ${size}px ${BODY}`;
  const w = ctx.measureText(text).width + size * 1.3, h = size * 1.75;
  rr(ctx, x, y, w, h, 6 * s); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 3 * s; ctx.strokeStyle = border; ctx.stroke();
  ctx.fillStyle = color; ctx.textBaseline = "middle"; ctx.fillText(text, x + size * 0.65, y + h / 2 + 2 * s); ctx.textBaseline = "alphabetic";
  return w;
}

/**
 * The colour used most in a picture, as "rgb(r, g, b)":
 * 1. shrink the picture to 64 x 64 (4096 pixels is plenty and fast),
 * 2. put every pixel in a bucket by its colour, rounded to 16 steps per channel,
 *    so near-identical shades count together (see-through pixels are skipped),
 * 3. take the bucket with the most pixels,
 * 4. return the average of the real colours in that bucket (exact, not rounded).
 * Unreadable picture = `fallback`.
 */
const colorCache = new WeakMap<HTMLImageElement, string>();
export function dominantColor(img: HTMLImageElement, fallback: string): string {
  const cached = colorCache.get(img);
  if (cached) return cached;
  let result = fallback;
  try {
    const N = 64, c = document.createElement("canvas"); c.width = N; c.height = N;
    const cx = c.getContext("2d", { willReadFrequently: true })!;
    cx.drawImage(img, 0, 0, N, N);
    const px = cx.getImageData(0, 0, N, N).data;
    const buckets = new Map<number, [number, number, number, number]>(); // key -> count, sum r, g, b
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      const key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
      const b = buckets.get(key) ?? [0, 0, 0, 0];
      b[0]++; b[1] += px[i]; b[2] += px[i + 1]; b[3] += px[i + 2];
      buckets.set(key, b);
    }
    let best: [number, number, number, number] | null = null;
    for (const b of buckets.values()) if (!best || b[0] > best[0]) best = b;
    if (best) result = `rgb(${Math.round(best[1] / best[0])}, ${Math.round(best[2] / best[0])}, ${Math.round(best[3] / best[0])})`;
  } catch {
    // unreadable picture: keep the fallback
  }
  colorCache.set(img, result);
  return result;
}

/** Event picture, whole (never cut off); leftover space gets its most used colour. No picture = logo. */
function picture(ctx: Ctx, t: Theme, pics: Pics, x: number, y: number, w: number, h: number, r: number) {
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
  const { img, logo } = pics;
  if (img) {
    ctx.fillStyle = dominantColor(img, t.empty); ctx.fillRect(x, y, w, h);
    const k = Math.min(w / img.width, h / img.height), iw = img.width * k, ih = img.height * k;
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } else {
    ctx.fillStyle = t.empty; ctx.fillRect(x, y, w, h);
    if (logo) { const L = Math.min(w, h) * 0.5; ctx.drawImage(logo, x + (w - L) / 2, y + (h - L) / 2, L, L); }
  }
  ctx.restore();
}

/**
 * Faint Nordic folk-style line pattern (our own take: spruce trees, staves with antler
 * tips, snow stars with dots, "M" mountains). Brick layout: every second row shifted.
 */
function folkPattern(ctx: Ctx, W: number, H: number, s: number, color: string) {
  const tw = 220 * s, th = 300 * s;
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 6 * s; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const line = (pts: [number, number][]) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); };
  const spruce = (x: number, y: number) => { // trunk, branches pointing down, small diamond at the foot
    line([[x, y], [x, y + 150 * s]]);
    for (let i = 0; i < 5; i++) { const by = y + (18 + i * 26) * s, bw = (16 + i * 8) * s; line([[x - bw, by + 18 * s], [x, by], [x + bw, by + 18 * s]]); }
    line([[x, y + 158 * s], [x + 12 * s, y + 172 * s], [x, y + 186 * s], [x - 12 * s, y + 172 * s], [x, y + 158 * s]]);
  };
  const stave = (x: number, y: number) => { // post with three bars and an antler tip
    line([[x, y + 20 * s], [x, y + 150 * s]]);
    [60, 95, 130].forEach((b) => line([[x - 14 * s, y + b * s], [x + 14 * s, y + b * s]]));
    line([[x - 22 * s, y], [x, y + 20 * s], [x + 22 * s, y]]);
    line([[x - 22 * s, y], [x - 30 * s, y - 10 * s]]); line([[x + 22 * s, y], [x + 30 * s, y - 10 * s]]);
  };
  const snow = (x: number, y: number) => { // eight-arm star, a dot at each tip
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4, r = (a % 2 ? 22 : 30) * s;
      line([[x, y], [x + r * Math.cos(ang), y + r * Math.sin(ang)]]);
      ctx.beginPath(); ctx.arc(x + (r + 9 * s) * Math.cos(ang), y + (r + 9 * s) * Math.sin(ang), 4 * s, 0, Math.PI * 2); ctx.fill();
    }
  };
  // an "M": two equal peaks, mirrored around the middle dip
  const hills = (x: number, y: number) => line([[x - 50 * s, y + 18 * s], [x - 25 * s, y - 18 * s], [x, y + 8 * s], [x + 25 * s, y - 18 * s], [x + 50 * s, y + 18 * s]]);
  for (let row = -1; row * th < H + th; row++) {
    const shift = row % 2 ? tw / 2 : 0;
    for (let col = -1; col * tw < W + tw; col++) {
      const x = col * tw + shift, y = row * th;
      stave(x + 55 * s, y + 30 * s);
      spruce(x + 160 * s, y + 20 * s);
      snow(x + 55 * s, y + 245 * s);
      hills(x + 160 * s, y + 250 * s);
    }
  }
  ctx.restore();
}

/** Country flag: Nordic crosses, Baltic stripes, Greenland. Unknown = grey box. */
function flag(ctx: Ctx, code: string, x: number, y: number, w: number, h: number, s: number) {
  const CROSS: Record<string, string[]> = {
    FI: ["#ffffff", "#003580"], SE: ["#006aa7", "#fecc02"], DK: ["#c8102e", "#ffffff"], NO: ["#ba0c2f", "#ffffff", "#00205b"],
    IS: ["#02529c", "#ffffff", "#dc1e35"], FO: ["#ffffff", "#0065bd", "#ef303e"], AX: ["#0064ad", "#ffd300", "#da0e15"],
  };
  const STRIPES: Record<string, string[]> = {
    EE: ["#0072ce", "#000000", "#ffffff"], LV: ["#9e3039", "#9e3039", "#ffffff", "#9e3039", "#9e3039"], LT: ["#fdb913", "#006a44", "#c1272d"],
  };
  ctx.save(); rr(ctx, x, y, w, h, 4 * s); ctx.clip();
  if (CROSS[code]) {
    const [bg, cross, inner] = CROSS[code];
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    const cx = x + w * 0.36, t = h * 0.28;
    ctx.fillStyle = cross; ctx.fillRect(cx - t / 2, y, t, h); ctx.fillRect(x, y + h / 2 - t / 2, w, t);
    if (inner) { const ti = t * 0.5; ctx.fillStyle = inner; ctx.fillRect(cx - ti / 2, y, ti, h); ctx.fillRect(x, y + h / 2 - ti / 2, w, ti); }
  } else if (STRIPES[code]) {
    const st = STRIPES[code];
    st.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + (h * i) / st.length, w, h / st.length + 1); });
  } else if (code === "GL") {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y, w, h / 2); ctx.fillStyle = "#c8102e"; ctx.fillRect(x, y + h / 2, w, h / 2);
    ctx.save(); ctx.beginPath(); ctx.arc(x + w * 0.38, y + h / 2, h * 0.34, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#c8102e"; ctx.fillRect(x, y, w, h / 2); ctx.fillStyle = "#ffffff"; ctx.fillRect(x, y + h / 2, w, h / 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#d5dde8"; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  rr(ctx, x, y, w, h, 4 * s); ctx.lineWidth = 2 * s; ctx.strokeStyle = "rgba(0, 53, 128, 0.25)"; ctx.stroke();
}

type Sizes = { title: number; lines: number; row: number; tag: number };

/** Date, repeat tag, title, time / place / city rows, price and age. Returns the height; draws only when `draw`. */
function info(ctx: Ctx, t: Theme, e: ShareCard, x: number, y: number, w: number, s: number, sz: Sizes, draw: boolean): number {
  let h = 0;
  // date like the event cards on the site: big day, red month next to it
  const daySize = sz.title * 1.25;
  if (draw) {
    ctx.fillStyle = t.navy; ctx.font = `800 ${daySize}px ${DISPLAY}`; ctx.fillText(e.day, x, y + daySize * 0.8);
    const dw = ctx.measureText(e.day).width;
    ctx.fillStyle = t.red; ctx.font = `800 ${daySize * 0.55}px ${DISPLAY}`; ctx.fillText(e.month, x + dw + 14 * s, y + daySize * 0.8);
  }
  h += daySize * 0.95 + 18 * s;
  if (e.repeat) {
    if (draw) tag(ctx, x, y + h, e.repeat, sz.tag * 0.8, t.tagFill, t.tagText, t.tagBorder, s);
    h += sz.tag * 0.8 * 1.75 + 24 * s;
  }
  ctx.font = `800 ${sz.title}px ${DISPLAY}`;
  const lines = wrap(ctx, e.name, w, sz.lines);
  if (draw) { ctx.fillStyle = t.navy; lines.forEach((l, i) => ctx.fillText(l, x, y + h + sz.title * (0.85 + i * 1.08))); }
  h += lines.length * sz.title * 1.08 + 20 * s;
  const row = (text: string, size: number, weight: number) => {
    ctx.font = `${weight} ${size}px ${BODY}`;
    const line1 = wrap(ctx, text, w - size * 1.1, 1)[0] ?? "";
    if (draw) {
      ctx.beginPath(); ctx.arc(x + size * 0.32, y + h + size * 0.55, size * 0.22, 0, Math.PI * 2); ctx.fillStyle = t.blue2; ctx.fill();
      ctx.fillStyle = t.text; ctx.fillText(line1, x + size * 0.95, y + h + size * 0.85);
    }
    h += size * 1.35;
  };
  row(e.time ? `${e.weekday} | ${e.time}` : e.weekday, sz.row, 700);
  row(e.venue, sz.row, 600);
  { // city, country with the flag in front (like the city chip on the site)
    const size = sz.row * 0.95, fh = size * 0.78, fw = fh * 1.5;
    ctx.font = `600 ${size}px ${BODY}`;
    const city = wrap(ctx, e.city, w - fw - size * 0.5, 1)[0] ?? "";
    if (draw) {
      flag(ctx, e.country, x, y + h + size * 0.2, fw, fh, s);
      ctx.fillStyle = t.text; ctx.fillText(city, x + fw + size * 0.4, y + h + size * 0.85);
    }
    h += size * 1.35;
  }
  h += 18 * s;
  if (draw) {
    const pw = e.free
      ? tag(ctx, x, y + h, e.price, sz.tag, FREE_GREEN, "#ffffff", FREE_GREEN, s)
      : tag(ctx, x, y + h, e.price, sz.tag, t.tagFill, t.tagText, t.tagBorder, s);
    tag(ctx, x + pw + 16 * s, y + h, e.age, sz.tag, t.ageFill, t.ageText, t.ageBorder, s);
  }
  h += sz.tag * 1.75 + 8 * s;
  return h;
}

/** Draw the share picture on `canvas` (resized to the format). */
export function drawSharePicture(canvas: HTMLCanvasElement, format: ShareFormat, e: ShareCard, pics: Pics, theme: ShareTheme): void {
  const t = THEMES[theme];
  const [W, H] = SHARE_SIZES[format];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(W, H) / 1080, pad = 64 * s;
  ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);
  folkPattern(ctx, W, H, s, t.pattern);

  // brand, top left
  const bs = 104 * s;
  card(ctx, t, pad, pad, bs, bs, 28 * s, "#ffffff", s);
  if (pics.logo) ctx.drawImage(pics.logo, pad + 10 * s, pad + 10 * s, bs - 20 * s, bs - 20 * s);
  ctx.fillStyle = t.navy; ctx.font = `800 ${54 * s}px ${DISPLAY}`; ctx.fillText("CosOverHere", pad + bs + 26 * s, pad + 62 * s);
  ctx.font = `600 ${26 * s}px ${BODY}`; ctx.fillStyle = t.text; ctx.fillText(e.tagline, pad + bs + 28 * s, pad + 98 * s);

  // card below the brand, down to the bottom edge
  const top = pad + bs + 60 * s, bottom = H - pad;
  const cx = pad, cw = W - pad * 2, inner = 44 * s;
  if (format === "story") {
    const sz = { title: 84 * s, lines: 3, row: 42 * s, tag: 40 * s };
    // picture box follows the picture's own shape, within limits
    const aspect = pics.img ? pics.img.width / pics.img.height : 16 / 9;
    const picH = Math.min(Math.max((cw - inner * 2) / aspect, (cw - inner * 2) * 0.45), (cw - inner * 2) * 0.9);
    const textH = info(ctx, t, e, 0, 0, cw - inner * 2, s, sz, false);
    const ch = Math.min(bottom - top, inner * 2 + picH + 40 * s + textH);
    const cy = top + (bottom - top - ch) / 2;
    card(ctx, t, cx, cy, cw, ch, 48 * s, t.card, s);
    picture(ctx, t, pics, cx + inner, cy + inner, cw - inner * 2, picH, 30 * s);
    info(ctx, t, e, cx + inner, cy + inner + picH + 40 * s, cw - inner * 2 - 10 * s, s, sz, true);
  } else {
    // square and wide: picture on the left, text on the right
    const sz = format === "wide" ? { title: 78 * s, lines: 3, row: 40 * s, tag: 38 * s } : { title: 58 * s, lines: 3, row: 32 * s, tag: 30 * s };
    const ch = bottom - top, cy = top;
    card(ctx, t, cx, cy, cw, ch, 48 * s, t.card, s);
    const ph = ch - inner * 2;
    // picture width follows its shape, but leaves about half the card for the text
    const aspect = pics.img ? pics.img.width / pics.img.height : 1;
    const maxW = format === "wide" ? (cw - inner * 3) * 0.5 : (cw - inner * 3) * 0.45;
    const pw = Math.min(Math.max(ph * aspect, ph * 0.6), maxW);
    picture(ctx, t, pics, cx + inner, cy + inner, pw, ph, 30 * s);
    const tx = cx + inner * 2 + pw, tw = cw - pw - inner * 3;
    const th = info(ctx, t, e, 0, 0, tw, s, sz, false);
    info(ctx, t, e, tx, cy + Math.max(inner, (ch - th) / 2), tw, s, sz, true);
  }
}
