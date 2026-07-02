import AdminDashboard from "@/components/AdminDashboard";
import AdminGate from "@/components/AdminGate";

export const metadata = {
  title: "Admin — CosoraAtlas",
  // Keep the admin page out of Google etc. so users never discover it.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
