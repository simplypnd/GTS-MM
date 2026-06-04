import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReferralHookPage } from "@/components/referrals/ReferralHookPage";

export const metadata: Metadata = {
  title: "Referral program",
  description:
    "Invite friends to GTS MM and earn 0.5% on completed buyer deals. Philippines secure escrow referrals.",
};

export default async function ReferralsAboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ReferralHookPage isLoggedIn={!!user} />;
}
