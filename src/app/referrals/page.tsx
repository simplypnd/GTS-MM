import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ReferralsRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/referrals/about");
  }

  redirect("/settings?tab=referrals");
}
