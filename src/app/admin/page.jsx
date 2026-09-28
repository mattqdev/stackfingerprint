// src/app/admin/page.jsx
import { isAdmin } from "../../lib/server/adminAuth";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const configured = !!process.env.ADMIN_PASSWORD;
  return (await isAdmin()) ? (
    <AdminDashboard />
  ) : (
    <AdminLogin configured={configured} />
  );
}
