import { assertTransition } from "@/lib/escrow/dealState";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
import type { createServiceClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/types/database";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export const DEAL_SLA_MS = 20 * 60 * 1000;

/** @deprecated Use DEAL_SLA_MS */
export const DELIVERY_SLA_MS = DEAL_SLA_MS;

export const PAYMENT_SLA_MS = DEAL_SLA_MS;

export function getPaymentPaidAt(
  events: { event: string; created_at: string }[]
): Date | null {
  const row = events.find((e) => e.event === "payment_paid");
  return row ? new Date(row.created_at) : null;
}

export function getPaymentWindowStartAt(
  events: { event: string; created_at: string }[],
  dealUpdatedAt: string
): Date {
  const starts = events
    .filter(
      (e) =>
        e.event === "payment_window_started" || e.event === "payment_started"
    )
    .map((e) => new Date(e.created_at).getTime());
  if (starts.length > 0) {
    return new Date(Math.min(...starts));
  }
  return new Date(dealUpdatedAt);
}

export function canBuyerCancelForNonDelivery(paymentPaidAt: Date | null): {
  allowed: boolean;
  waitMinutes: number;
} {
  if (!paymentPaidAt) {
    return { allowed: false, waitMinutes: 20 };
  }
  const elapsed = Date.now() - paymentPaidAt.getTime();
  if (elapsed >= DEAL_SLA_MS) {
    return { allowed: true, waitMinutes: 0 };
  }
  const remainingMs = DEAL_SLA_MS - elapsed;
  return {
    allowed: false,
    waitMinutes: Math.ceil(remainingMs / 60000),
  };
}

/** Auto-cancel awaiting_payment when no payment_paid within PAYMENT_SLA_MS. */
export async function enforceUnpaidDealTimeout(
  service: Supabase,
  dealId: string
): Promise<{ status: DealStatus | string; cancelled: boolean }> {
  const { data: deal } = await service
    .from("deals")
    .select("status, updated_at")
    .eq("id", dealId)
    .single();

  if (!deal || deal.status !== "awaiting_payment") {
    return { status: deal?.status ?? "unknown", cancelled: false };
  }

  const { data: events } = await service
    .from("deal_events")
    .select("event, created_at, payload")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  const eventRows = events ?? [];

  if (getPaymentPaidAt(eventRows)) {
    return { status: deal.status, cancelled: false };
  }

  const windowStart = getPaymentWindowStartAt(eventRows, deal.updated_at);
  if (Date.now() - windowStart.getTime() < PAYMENT_SLA_MS) {
    return { status: deal.status, cancelled: false };
  }

  const hasTimeoutCancel = eventRows.some((e) => {
    if (e.event !== "deal_cancelled") return false;
    const payload = e.payload as { reason?: string } | null;
    return payload?.reason === "payment_timeout";
  });
  if (hasTimeoutCancel) {
    return { status: "cancelled", cancelled: false };
  }

  try {
    assertTransition("awaiting_payment", "cancelled");
  } catch {
    return { status: deal.status, cancelled: false };
  }

  const { data: updated, error } = await service
    .from("deals")
    .update({ status: "cancelled" })
    .eq("id", dealId)
    .eq("status", "awaiting_payment")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    const { data: current } = await service
      .from("deals")
      .select("status")
      .eq("id", dealId)
      .single();
    return { status: current?.status ?? deal.status, cancelled: false };
  }

  await logDealEvent(service, {
    dealId,
    event: "deal_cancelled",
    payload: { reason: "payment_timeout" },
  });
  await postSystemMessage(
    service,
    dealId,
    "This deal was automatically cancelled because payment was not received within 20 minutes."
  );

  return { status: "cancelled", cancelled: true };
}
