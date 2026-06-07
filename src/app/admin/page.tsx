import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin — Stats",
  robots: { index: false, follow: false },
};

export default function AdminStatsPage() {
  return <AdminDashboard />;
}
