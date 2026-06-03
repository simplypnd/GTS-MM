import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { markDealFunded } from "@/lib/escrow/markFunded";
import { applyTransferUpdate } from "@/lib/paymongo/applyTransferUpdate";
import { extractTransferUpdate } from "@/lib/paymongo/transferWebhook";
import {
  extractPaymentIntentId,
  getWebhookEventType,
  verifyWebhookSignature,
} from "@/lib/paymongo/webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("paymongo-signature") ??
    request.headers.get("Paymongo-Signature");

  if (process.env.PAYMONGO_WEBHOOK_SECRET) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[paymongo webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: Parameters<typeof extractPaymentIntentId>[0];
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const service = await createServiceClient();
  const eventType = getWebhookEventType(event);

  const isPaymentPaid =
    eventType === "payment.paid" || eventType.includes("payment.paid");
  const isIntentSucceeded =
    eventType === "payment_intent.succeeded" ||
    eventType.includes("payment_intent.succeeded");

  if (isPaymentPaid || isIntentSucceeded) {
    const piId = extractPaymentIntentId(event);
    if (piId) {
      const { data: payment } = await service
        .from("paymongo_payments")
        .select("deal_id")
        .eq("payment_intent_id", piId)
        .maybeSingle();

      if (payment?.deal_id) {
        await markDealFunded(service, payment.deal_id, piId, event as object);
      } else {
        console.warn(
          "[paymongo webhook] No paymongo_payments row for",
          piId,
          eventType
        );
      }
    } else {
      console.warn(
        "[paymongo webhook] Missing payment_intent_id",
        eventType,
        rawBody.slice(0, 500)
      );
    }
  }

  if (
    eventType === "qrph.expired" ||
    eventType.includes("qrph.expired")
  ) {
    const piId = extractPaymentIntentId(event);
    if (piId) {
      const { data: payment } = await service
        .from("paymongo_payments")
        .select("deal_id")
        .eq("payment_intent_id", piId)
        .maybeSingle();

      if (payment?.deal_id) {
        const { postSystemMessage } = await import("@/lib/escrow/events");
        await service
          .from("deals")
          .update({ status: "expired" })
          .eq("id", payment.deal_id);
        await postSystemMessage(
          service,
          payment.deal_id,
          "QR Ph payment expired. Buyer can retry payment."
        );
      }
    }
  }

  const transferUpdate = extractTransferUpdate(event);
  if (transferUpdate) {
    const { postSystemMessage } = await import("@/lib/escrow/events");
    const { rowId, mapped } = await applyTransferUpdate(
      service,
      transferUpdate
    );

    if (rowId) {
      const { data: row } = await service
        .from("paymongo_transfers")
        .select("deal_id, type")
        .eq("id", rowId)
        .single();

      if (row?.deal_id && mapped === "succeeded") {
        await postSystemMessage(
          service,
          row.deal_id,
          `${row.type} transfer completed successfully.`
        );
      } else if (row?.deal_id && mapped === "failed") {
        await postSystemMessage(
          service,
          row.deal_id,
          `${row.type} transfer failed. Please contact support.`
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
