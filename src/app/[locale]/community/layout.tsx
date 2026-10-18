import { pageMetadata } from "@/lib/seo";

// The community page is a client component, so its search-engine metadata lives here.
/** Search-engine title, description and language links (lib/seo.ts). */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "community", "/community");
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
