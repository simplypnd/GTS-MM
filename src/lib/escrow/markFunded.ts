import { dealFeeBreakdown, formatFeeMessage } from "@/lib/escrow/fees";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function markDealFunded(
  service: Supabase,
  dealId: string,
  paymentIntentId: string,
  rawWebhook?: object
) {
  const { data: deal } = await service
    .from("deals")
    .select("status, amount_centavos, platform_fee_bps")
    .eq("id", dealId)
    .single();

  if (!deal || deal.status === "funded" || deal.status === "completed") {
    return { updated: false, status: deal?.status ?? null };
  }

  if (deal.status !== "awaiting_payment" && deal.status !== "expired") {
    return { updated: false, status: deal.status };
  }

  await service
    .from("paymongo_payments")
    .update({
      status: "paid",
      ...(rawWebhook ? { raw_webhook: rawWebhook } : {}),
    })
    .eq("payment_intent_id", paymentIntentId);

  await service.from("deals").update({ status: "funded" }).eq("id", dealId);

  const breakdown = dealFeeBreakdown(deal);
  await logDealEvent(service, {
    dealId,
    event: "payment_paid",
    payload: {
      payment_intent_id: paymentIntentId,
      gross_centavos: breakdown.gross,
      fee_centavos: breakdown.fee,
      net_escrow_centavos: breakdown.net,
    },
  });
  await postSystemMessage(service, dealId, formatFeeMessage(deal));

  return { updated: true, status: "funded" as const };
}
