import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { assertTransition } from "@/lib/escrow/dealState";
import {
  canBuyerCancelForNonDelivery,
  getPaymentPaidAt,
} from "@/lib/escrow/cancelDeal";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
import { refundToBuyer } from "@/lib/escrow/transfers";
import type { Deal, DealStatus } from "@/lib/types/database";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isBuyer = deal.buyer_id === user.id;
  const isSeller = deal.seller_id === user.id;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = deal.status as DealStatus;
  const service = await createServiceClient();

  if (status === "draft" || status === "awaiting_payment") {
    try {
      assertTransition(status, "cancelled");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid transition" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("deals")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logDealEvent(service, {
      dealId: id,
      actorId: user.id,
      actorRole: isBuyer ? "buyer" : "seller",
      event: "deal_cancelled",
    });
    await postSystemMessage(service, id, "This deal was cancelled.");

    return NextResponse.json({ ok: true });
  }

  if (status === "funded") {
    if (!isBuyer) {
      return NextResponse.json(
        { error: "Only the buyer can cancel for non-delivery" },
        { status: 403 }
      );
    }

    const { data: events } = await service
      .from("deal_events")
      .select("event, created_at")
      .eq("deal_id", id)
      .order("created_at", { ascending: false });

    const paymentPaidAt = getPaymentPaidAt(events ?? []);
    const { allowed, waitMinutes } =
      canBuyerCancelForNonDelivery(paymentPaidAt);

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            waitMinutes > 0
              ? `Seller has ${waitMinutes} minute(s) left to deliver before you can cancel for a refund.`
              : "Cannot cancel yet",
        },
        { status: 400 }
      );
    }

    try {
      assertTransition(status, "refunded");
      await refundToBuyer(service, deal as Deal, undefined, user.id, "buyer");
      await logDealEvent(service, {
        dealId: id,
        actorId: user.id,
        actorRole: "buyer",
        event: "deal_cancelled",
        payload: { reason: "non_delivery_sla" },
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Cancel failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "This deal cannot be cancelled" },
    { status: 400 }
  );
}
