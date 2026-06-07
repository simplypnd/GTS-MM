import { redirect } from "next/navigation";

export default function PayoutsSettingsRedirectPage() {
  redirect("/withdraw?tab=payouts");
}
