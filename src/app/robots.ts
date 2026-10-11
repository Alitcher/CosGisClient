import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/serverData";

/** robots.txt: everything may be indexed except the admin pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/fi/admin", "/et/admin", "/th/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
