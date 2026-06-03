import type { createServiceClient } from "@/lib/supabase/server";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function markDealFunded(
  service: Supabase,
  dealId: string,
  paymentIntentId: string,
  rawWebhook?: object
) {
  const { data: deal } = await service
    .from("deals")
    .select("status")
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

  await logDealEvent(service, {
    dealId,
    event: "payment_paid",
    payload: { payment_intent_id: paymentIntentId },
  });
  await postSystemMessage(
    service,
    dealId,
    "Payment received. Funds are held by MidMan."
  );

  return { updated: true, status: "funded" as const };
}
