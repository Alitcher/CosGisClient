import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MonthCalendar from "@/components/MonthCalendar";

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
