import type { Locale } from "next-intl";
import { pageMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MonthCalendar from "@/components/MonthCalendar";

/** Search-engine title, description and language links (lib/seo.ts). */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "calendar", "/calendar");
}

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <Nav />
      <MonthCalendar />
      <Footer />
    </>
  );
}
