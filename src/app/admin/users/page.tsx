import type { Metadata } from "next";
import { AdminUserSearch } from "@/components/admin/AdminUserSearch";

export const metadata: Metadata = {
  title: "Admin — Users",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        User moderation
      </h2>
      <AdminUserSearch />
    </div>
  );
}
