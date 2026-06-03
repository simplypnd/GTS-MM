import { assertTransition } from "@/lib/escrow/dealState";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
import { debitUserBalance } from "@/lib/wallet/balance";
import type { createServiceClient } from "@/lib/supabase/server";
import type { Deal, DealStatus } from "@/lib/types/database";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function markDealFundedFromBalance(
  service: Supabase,
  deal: Deal,
  buyerId: string
) {
  const status = deal.status as DealStatus;

  if (status === "funded" || status === "completed") {
    return { updated: false, status };
  }

  if (status === "draft") {
    assertTransition(status, "awaiting_payment");
    await service
      .from("deals")
      .update({ status: "awaiting_payment" })
      .eq("id", deal.id);
    deal.status = "awaiting_payment";
  }

  if (deal.status !== "awaiting_payment" && deal.status !== "expired") {
    throw new Error("Deal is not awaiting payment");
  }

  await debitUserBalance(service, {
    userId: buyerId,
    amountCentavos: deal.amount_centavos,
    kind: "deal_payment",
    dealId: deal.id,
  });

  await service
    .from("deals")
    .update({ status: "funded", payment_source: "balance" })
    .eq("id", deal.id);

  await logDealEvent(service, {
    dealId: deal.id,
    actorId: buyerId,
    actorRole: "buyer",
    event: "payment_paid",
    payload: { source: "balance", amount_centavos: deal.amount_centavos },
  });

  await postSystemMessage(
    service,
    deal.id,
    "Payment received from buyer balance. Funds are held by MidMan."
  );

  return { updated: true, status: "funded" as const };
}
