import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ admin_required?: string }>;
};

export default async function SecuritySettingsRedirectPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "security" });
  if (params.admin_required === "1") {
    query.set("admin_required", "1");
  }
  redirect(`/settings?${query.toString()}`);
}
