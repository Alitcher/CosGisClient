import { Suspense } from "react";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Nav from "@/components/Nav";
import MapView from "@/components/MapView";

export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Map");

  return (
    <>
      <Nav />
      {/* MapView reads ?lng=&lat= via useSearchParams, which needs a Suspense boundary. */}
      <Suspense fallback={<div style={{ padding: 24, color: "var(--text-2)" }}>{t("loading")}</div>}>
        <MapView />
      </Suspense>
    </>
  );
}
