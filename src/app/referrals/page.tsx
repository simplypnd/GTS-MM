import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";
import { getSiteUrl } from "@/lib/config/site-url";

export const metadata: Metadata = {
  title: "Referrals",
  description: "Your GTS MM referral link and earnings.",
  robots: { index: false, follow: false },
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/referrals/about");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  const referralCode = profile?.referral_code;
  if (!referralCode) {
    redirect("/dashboard");
  }

  const { data: amounts } = await supabase
    .from("referral_payouts")
    .select("amount_centavos")
    .eq("referrer_id", user.id);

  const totalEarnedCentavos = (amounts ?? []).reduce(
    (sum, row) => sum + row.amount_centavos,
    0
  );

  const { count } = await supabase
    .from("referral_payouts")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const referralUrl = `${getSiteUrl()}/register?ref=${encodeURIComponent(referralCode)}`;

  return (
    <ReferralDashboard
      referralUrl={referralUrl}
      referralCode={referralCode}
      totalEarnedCentavos={totalEarnedCentavos}
      payoutCount={count ?? 0}
    />
  );
}
