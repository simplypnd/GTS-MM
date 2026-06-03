import {
  computeNetAfterFee,
  computePlatformFee,
} from "@/lib/escrow/dealState";
import { dealFeeBreakdown } from "@/lib/escrow/fees";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
import { creditUserBalance } from "@/lib/wallet/balance";
import type { createServiceClient } from "@/lib/supabase/server";
import type { Deal, PartyRole } from "@/lib/types/database";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function getDefaultPayoutAccount(
  supabase: Supabase,
  userId: string,
  partyRole: PartyRole
) {
  const { data, error } = await supabase
    .from("payout_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("party_role", partyRole)
    .eq("is_default", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function releaseToSeller(
  supabase: Supabase,
  deal: Deal,
  actorId?: string,
  actorRole?: "buyer" | "seller" | "mediator"
) {
  const { gross, fee, net } = dealFeeBreakdown(deal);
  await creditUserBalance(supabase, {
    userId: deal.seller_id,
    amountCentavos: net,
    kind: "deal_release",
    dealId: deal.id,
  });
  await supabase
    .from("deals")
    .update({ status: "completed" })
    .eq("id", deal.id);
  await logDealEvent(supabase, {
    dealId: deal.id,
    actorId,
    actorRole,
    event: "released",
    payload: {
      amount_centavos: net,
      gross_centavos: gross,
      fee_centavos: fee,
    },
  });
  await postSystemMessage(
    supabase,
    deal.id,
    `Funds credited to seller balance (₱${(net / 100).toFixed(2)} after ${deal.platform_fee_bps / 100}% fee on ₱${(gross / 100).toFixed(2)}). Withdraw at /withdraw.`
  );
}

export async function refundToBuyer(
  supabase: Supabase,
  deal: Deal,
  amountCentavos?: number,
  actorId?: string,
  actorRole?: "mediator" | "buyer"
) {
  const { gross, fee } = dealFeeBreakdown(deal);
  const refundAmount =
    amountCentavos ??
    computeNetAfterFee(deal.amount_centavos, deal.platform_fee_bps);

  await creditUserBalance(supabase, {
    userId: deal.buyer_id,
    amountCentavos: refundAmount,
    kind: "deal_refund",
    dealId: deal.id,
  });
  await supabase
    .from("deals")
    .update({ status: "refunded" })
    .eq("id", deal.id);
  await logDealEvent(supabase, {
    dealId: deal.id,
    actorId,
    actorRole,
    event: "refunded",
    payload: {
      amount_centavos: refundAmount,
      gross_centavos: gross,
      fee_centavos: fee,
    },
  });
  await postSystemMessage(
    supabase,
    deal.id,
    `Refund credited to buyer balance (₱${(refundAmount / 100).toFixed(2)} after ${deal.platform_fee_bps / 100}% fee on ₱${(gross / 100).toFixed(2)}).`
  );
}

export async function creditPartialResolution(
  supabase: Supabase,
  deal: Deal,
  sellerAmountCentavos: number,
  buyerAmountCentavos: number,
  actorId?: string
) {
  const net = computeNetAfterFee(
    deal.amount_centavos,
    deal.platform_fee_bps
  );
  if (sellerAmountCentavos + buyerAmountCentavos > net) {
    throw new Error(
      `Partial amounts exceed net escrow (₱${(net / 100).toFixed(2)})`
    );
  }

  if (sellerAmountCentavos > 0) {
    await creditUserBalance(supabase, {
      userId: deal.seller_id,
      amountCentavos: sellerAmountCentavos,
      kind: "deal_release",
      dealId: deal.id,
      metadata: { partial: true },
    });
  }
  if (buyerAmountCentavos > 0) {
    await creditUserBalance(supabase, {
      userId: deal.buyer_id,
      amountCentavos: buyerAmountCentavos,
      kind: "deal_refund",
      dealId: deal.id,
      metadata: { partial: true },
    });
  }
  await supabase
    .from("deals")
    .update({ status: "completed" })
    .eq("id", deal.id);
  await logDealEvent(supabase, {
    dealId: deal.id,
    actorId,
    actorRole: "mediator",
    event: "resolved",
    payload: {
      seller_amount_centavos: sellerAmountCentavos,
      buyer_amount_centavos: buyerAmountCentavos,
      net_escrow_centavos: net,
    },
  });
  await postSystemMessage(
    supabase,
    deal.id,
    `Dispute resolved. Seller ₱${(sellerAmountCentavos / 100).toFixed(2)}, buyer ₱${(buyerAmountCentavos / 100).toFixed(2)} credited (net escrow ₱${(net / 100).toFixed(2)}).`
  );
}
