import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createPaymentIntent,
  createQrphPaymentMethod,
  attachPaymentMethod,
} from "@/lib/paymongo/client";
import { isQrActive } from "@/lib/deals/paymentQr";
import { logDealEvent } from "@/lib/escrow/events";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .single();

  if (error || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.buyer_id !== user.id) {
    return NextResponse.json(
      { error: "Only the designated buyer can pay" },
      { status: 403 }
    );
  }

  if (deal.status !== "awaiting_payment" && deal.status !== "expired") {
    return NextResponse.json(
      { error: "Deal is not awaiting payment" },
      { status: 400 }
    );
  }

  if (deal.status === "expired") {
    await supabase
      .from("deals")
      .update({ status: "awaiting_payment" })
      .eq("id", dealId);
  }

  const service = await createServiceClient();
  const { data: existing } = await service
    .from("paymongo_payments")
    .select("payment_intent_id, qr_image_url, expires_at, status")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && isQrActive(existing)) {
    return NextResponse.json({
      qrImageUrl: existing.qr_image_url,
      expiresAt: existing.expires_at,
      paymentIntentId: existing.payment_intent_id,
      reused: true,
    });
  }

  try {
    const pi = await createPaymentIntent({
      amount: deal.amount_centavos,
      dealId,
      description: deal.title,
    });

    const pm = await createQrphPaymentMethod();
    const attached = await attachPaymentMethod(
      pi.data.id,
      pm.data.id,
      pi.data.attributes.client_key
    );

    const qrImageUrl =
      attached.data.attributes.next_action?.code?.image_url ?? null;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await service.from("paymongo_payments").upsert({
      deal_id: dealId,
      payment_intent_id: pi.data.id,
      client_key: pi.data.attributes.client_key,
      status: attached.data.attributes.status,
      qr_image_url: qrImageUrl,
      expires_at: expiresAt,
      paid_by_user_id: user.id,
    }, { onConflict: "payment_intent_id" });

    await logDealEvent(service, {
      dealId,
      actorId: user.id,
      actorRole: "buyer",
      event: "payment_started",
    });

    return NextResponse.json({
      qrImageUrl,
      expiresAt,
      paymentIntentId: pi.data.id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PayMongo error" },
      { status: 500 }
    );
  }
}
