import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/config/site-url";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.referral_code) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  const { data: amounts, error: sumError } = await supabase
    .from("referral_payouts")
    .select("amount_centavos")
    .eq("referrer_id", user.id);

  if (sumError) {
    return NextResponse.json({ error: sumError.message }, { status: 500 });
  }

  const totalEarnedCentavos = (amounts ?? []).reduce(
    (sum, p) => sum + p.amount_centavos,
    0
  );

  const { count } = await supabase
    .from("referral_payouts")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const { data: payouts, error: payoutsError } = await supabase
    .from("referral_payouts")
    .select("id, deal_id, amount_centavos, created_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (payoutsError) {
    return NextResponse.json({ error: payoutsError.message }, { status: 500 });
  }

  const siteUrl = getSiteUrl();
  const referralUrl = `${siteUrl}/register?ref=${encodeURIComponent(profile.referral_code)}`;

  return NextResponse.json({
    referral_code: profile.referral_code,
    referral_url: referralUrl,
    total_earned_centavos: totalEarnedCentavos,
    payout_count: count ?? payouts?.length ?? 0,
    recent_payouts: payouts ?? [],
  });
}
