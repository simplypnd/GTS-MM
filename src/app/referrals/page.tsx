import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReferralHookPage } from "@/components/referrals/ReferralHookPage";
import { getSiteUrl } from "@/lib/config/site-url";

export const metadata: Metadata = {
  title: "Referral program",
  description:
    "Invite friends to GTS MM and earn 0.5% on completed buyer deals. Philippines secure escrow referrals.",
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let referralCode: string | null = null;
  let totalEarnedCentavos = 0;
  let payoutCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    referralCode = profile?.referral_code ?? null;

    const { data: amounts } = await supabase
      .from("referral_payouts")
      .select("amount_centavos")
      .eq("referrer_id", user.id);

    totalEarnedCentavos = (amounts ?? []).reduce(
      (sum, row) => sum + row.amount_centavos,
      0
    );

    const { count } = await supabase
      .from("referral_payouts")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    payoutCount = count ?? 0;
  }

  const referralUrl = referralCode
    ? `${getSiteUrl()}/register?ref=${encodeURIComponent(referralCode)}`
    : null;

  return (
    <ReferralHookPage
      isLoggedIn={!!user}
      referralUrl={referralUrl}
      referralCode={referralCode}
      totalEarnedCentavos={totalEarnedCentavos}
      payoutCount={payoutCount}
    />
  );
}
