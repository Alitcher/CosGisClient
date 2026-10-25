import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { COUNTRIES, VISITOR_COUNTRY_COOKIE } from "./lib/cities";

// Picks the language for each request (from the URL, a cookie, or the browser's
// preferred language) and routes it to app/[locale]/.
const intl = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const res = intl(req);

  // Visitor's country from the IP, added by Vercel (or Cloudflare). Saved in a cookie
  // so event lists can start filtered to it (lib/visitorCountry). Not one of our
  // countries, or no header (e.g. npm run dev) = no cookie = all countries.
  const header = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? "";
  const country = (COUNTRIES as string[]).includes(header.toUpperCase()) ? header.toUpperCase() : null;
  const saved = req.cookies.get(VISITOR_COUNTRY_COOKIE)?.value ?? null;
  if (country && country !== saved) {
    res.cookies.set(VISITOR_COUNTRY_COOKIE, country, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  } else if (!country && saved) {
    res.cookies.delete(VISITOR_COUNTRY_COOKIE);
  }
  return res;
}

export const config = {
  // Everything except Next internals, API routes and plain files (map-embed.html,
  // /maplibre/*, images...), which have a dot in their path.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
