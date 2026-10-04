import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Picks the language for each request (from the URL, a cookie, or the browser's
// preferred language) and routes it to app/[locale]/.
export default createMiddleware(routing);

export const config = {
  // Everything except Next internals, API routes and plain files (map-embed.html,
  // /maplibre/*, images...), which have a dot in their path.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
