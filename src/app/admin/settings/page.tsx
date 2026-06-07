import type { Metadata } from "next";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export const metadata: Metadata = {
  title: "Admin — Settings",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Platform settings
      </h2>
      <AdminSettingsForm />
    </div>
  );
}
