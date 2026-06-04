import { creditUserBalance } from "@/lib/wallet/balance";
import type { createServiceClient } from "@/lib/supabase/server";
import type { Deal } from "@/lib/types/database";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export const REFERRAL_REWARD_BPS = 50;

export function computeReferralReward(amountCentavos: number): number {
  return Math.floor((amountCentavos * REFERRAL_REWARD_BPS) / 10000);
}

export async function payReferralOnDealComplete(
  supabase: Supabase,
  deal: Deal
): Promise<void> {
  const reward = computeReferralReward(deal.amount_centavos);
  if (reward <= 0) return;

  const { data: buyer } = await supabase
    .from("profiles")
    .select("referred_by_user_id")
    .eq("id", deal.buyer_id)
    .single();

  const referrerId = buyer?.referred_by_user_id;
  if (!referrerId) return;
  if (referrerId === deal.buyer_id || referrerId === deal.seller_id) return;

  const { data: existing } = await supabase
    .from("referral_payouts")
    .select("id")
    .eq("deal_id", deal.id)
    .maybeSingle();

  if (existing) return;

  const { error: insertError } = await supabase.from("referral_payouts").insert({
    deal_id: deal.id,
    referrer_id: referrerId,
    referred_user_id: deal.buyer_id,
    amount_centavos: reward,
  });

  if (insertError) {
    if (insertError.code === "23505") return;
    throw insertError;
  }

  await creditUserBalance(supabase, {
    userId: referrerId,
    amountCentavos: reward,
    kind: "referral_reward",
    dealId: deal.id,
    metadata: {
      referred_user_id: deal.buyer_id,
      gross_centavos: deal.amount_centavos,
    },
  });
}
