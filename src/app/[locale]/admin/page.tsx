import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AdminDashboard from "@/components/AdminDashboard";
import AdminGate from "@/components/AdminGate";

// Admin text stays English on purpose (only the site owner uses it), so it isn't in messages/.
export const metadata = {
  title: "Admin — CosoraAtlas",
  // Keep the admin page out of Google etc. so users never discover it.
  robots: { index: false, follow: false },
};

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
