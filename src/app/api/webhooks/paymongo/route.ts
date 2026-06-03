import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/paymongo/client";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature");

  if (process.env.PAYMONGO_WEBHOOK_SECRET) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody) as {
    data?: {
      attributes?: {
        type?: string;
        status?: string;
        payment_intent_id?: string;
        metadata?: Record<string, string>;
        data?: {
          attributes?: {
            payment_intent_id?: string;
            metadata?: Record<string, string>;
          };
        };
      };
      id?: string;
    };
    type?: string;
  };

  const service = await createServiceClient();
  const attrs = event.data?.attributes;
  const eventType = attrs?.type ?? event.type ?? "";

  // Payment events
  if (
    eventType === "payment.paid" ||
    eventType.includes("payment.paid")
  ) {
    const piId =
      attrs?.payment_intent_id ??
      attrs?.data?.attributes?.payment_intent_id;
    if (!piId) {
      return NextResponse.json({ received: true });
    }

    const { data: payment } = await service
      .from("paymongo_payments")
      .select("deal_id")
      .eq("payment_intent_id", piId)
      .single();

    if (payment?.deal_id) {
      await service
        .from("paymongo_payments")
        .update({ status: "paid", raw_webhook: event as object })
        .eq("payment_intent_id", piId);

      await service
        .from("deals")
        .update({ status: "funded" })
        .eq("id", payment.deal_id);

      await logDealEvent(service, {
        dealId: payment.deal_id,
        event: "payment_paid",
        payload: { payment_intent_id: piId },
      });
      await postSystemMessage(
        service,
        payment.deal_id,
        "Payment received. Funds are held in escrow."
      );
    }
  }

  if (
    eventType === "qrph.expired" ||
    eventType.includes("qrph.expired")
  ) {
    const piId = event.data?.attributes?.payment_intent_id;
    if (piId) {
      const { data: payment } = await service
        .from("paymongo_payments")
        .select("deal_id")
        .eq("payment_intent_id", piId)
        .single();

      if (payment?.deal_id) {
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

  // Transfer callback (batch_transfers callback_url)
  const transferStatus = event.data?.attributes?.status;
  const transferId = event.data?.id;
  const metadata = event.data?.attributes?.metadata;

  if (transferId && transferStatus) {
    const rowId = metadata?.transfer_row_id;
    const statusMap: Record<string, string> = {
      succeeded: "succeeded",
      failed: "failed",
      pending: "pending",
    };
    const mapped = statusMap[transferStatus] ?? "pending";

    if (rowId) {
      await service
        .from("paymongo_transfers")
        .update({ status: mapped, transfer_id: transferId })
        .eq("id", rowId);

      const { data: row } = await service
        .from("paymongo_transfers")
        .select("deal_id, type, status")
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
