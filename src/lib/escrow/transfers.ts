import { v4 as uuidv4 } from "uuid";
import { createBatchTransfer } from "@/lib/paymongo/client";
import { computeSellerPayout } from "@/lib/escrow/dealState";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
import type { createServiceClient } from "@/lib/supabase/server";
import type { Deal, PartyRole, TransferType } from "@/lib/types/database";

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

export async function executeTransfer(
  supabase: Supabase,
  deal: Deal,
  type: TransferType,
  amountCentavos: number
) {
  const recipientUserId =
    type === "release" ? deal.seller_id : deal.buyer_id;
  const recipientRole: PartyRole = type === "release" ? "seller" : "buyer";

  const payout = await getDefaultPayoutAccount(
    supabase,
    recipientUserId,
    recipientRole
  );
  if (!payout) {
    throw new Error(
      `No default ${recipientRole} payout account for recipient`
    );
  }

  const idempotencyKey = uuidv4();
  const referenceNumber = `deal_${deal.id}_${type}_${recipientRole}`;

  const { data: row, error: insertErr } = await supabase
    .from("paymongo_transfers")
    .insert({
      deal_id: deal.id,
      type,
      recipient_user_id: recipientUserId,
      recipient_role: recipientRole,
      payout_account_id: payout.id,
      amount_centavos: amountCentavos,
      reference_number: referenceNumber,
      idempotency_key: idempotencyKey,
      status: "pending",
      destination_snapshot: {
        number: payout.account_number,
        name: payout.account_name,
        bic: payout.bank_bic,
      },
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const result = await createBatchTransfer({
      amount: amountCentavos,
      destination: {
        number: payout.account_number,
        name: payout.account_name,
        bic: payout.bank_bic,
      },
      referenceNumber,
      description: `${type} for deal ${deal.id}`,
      callbackUrl: `${appUrl}/api/webhooks/paymongo`,
      metadata: {
        deal_id: deal.id,
        payout_account_id: payout.id,
        user_id: recipientUserId,
        recipient_role: recipientRole,
        transfer_row_id: row.id,
      },
      idempotencyKey,
    });

    const transfer = result.data.transfers?.[0];
    await supabase
      .from("paymongo_transfers")
      .update({
        batch_transfer_id: result.data.id,
        transfer_id: transfer?.id,
        status: transfer?.status === "succeeded" ? "succeeded" : "pending",
      })
      .eq("id", row.id);

    return { transferRow: row, paymongoTransfer: transfer };
  } catch (e) {
    await supabase
      .from("paymongo_transfers")
      .update({ status: "failed" })
      .eq("id", row.id);
    throw e;
  }
}

export async function releaseToSeller(
  supabase: Supabase,
  deal: Deal,
  actorId?: string,
  actorRole?: "buyer" | "seller" | "mediator"
) {
  const amount = computeSellerPayout(
    deal.amount_centavos,
    deal.platform_fee_bps
  );
  await executeTransfer(supabase, deal, "release", amount);
  await supabase
    .from("deals")
    .update({ status: "completed" })
    .eq("id", deal.id);
  await logDealEvent(supabase, {
    dealId: deal.id,
    actorId,
    actorRole,
    event: "released",
    payload: { amount_centavos: amount },
  });
  await postSystemMessage(
    supabase,
    deal.id,
    `Funds released to seller (₱${(amount / 100).toFixed(2)}).`
  );
}

export async function refundToBuyer(
  supabase: Supabase,
  deal: Deal,
  amountCentavos: number,
  actorId?: string,
  actorRole?: "mediator"
) {
  await executeTransfer(supabase, deal, "refund", amountCentavos);
  await supabase
    .from("deals")
    .update({ status: "refunded" })
    .eq("id", deal.id);
  await logDealEvent(supabase, {
    dealId: deal.id,
    actorId,
    actorRole,
    event: "refunded",
    payload: { amount_centavos: amountCentavos },
  });
  await postSystemMessage(
    supabase,
    deal.id,
    `Refund sent to buyer (₱${(amountCentavos / 100).toFixed(2)}).`
  );
}
