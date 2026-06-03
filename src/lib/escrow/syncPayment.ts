import { getPaymentIntent } from "@/lib/paymongo/client";
import { markDealFunded } from "@/lib/escrow/markFunded";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

const PAID_PI_STATUSES = new Set(["succeeded", "paid"]);

export async function syncDealPaymentFromPaymongo(
  service: Supabase,
  dealId: string
): Promise<{ status: string | null; synced: boolean }> {
  const { data: deal } = await service
    .from("deals")
    .select("status")
    .eq("id", dealId)
    .single();

  if (!deal) {
    return { status: null, synced: false };
  }

  if (deal.status === "funded" || deal.status === "completed") {
    return { status: deal.status, synced: false };
  }

  if (deal.status !== "awaiting_payment" && deal.status !== "expired") {
    return { status: deal.status, synced: false };
  }

  const { data: payment } = await service
    .from("paymongo_payments")
    .select("payment_intent_id")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment?.payment_intent_id) {
    return { status: deal.status, synced: false };
  }

  try {
    const pi = await getPaymentIntent(payment.payment_intent_id);
    const piStatus = pi.data.attributes.status;

    if (!PAID_PI_STATUSES.has(piStatus)) {
      return { status: deal.status, synced: false };
    }

    const result = await markDealFunded(
      service,
      dealId,
      payment.payment_intent_id,
      { source: "sync", payment_intent_status: piStatus }
    );

    return {
      status: result.status,
      synced: result.updated,
    };
  } catch {
    return { status: deal.status, synced: false };
  }
}
