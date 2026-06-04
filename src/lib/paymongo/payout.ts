import { v4 as uuidv4 } from "uuid";
import { createBatchTransfer } from "@/lib/paymongo/client";
import { extractInstructionId } from "@/lib/paymongo/transferFields";
import type { WithdrawalProvider } from "@/lib/wallet/withdrawal";
import type { createServiceClient } from "@/lib/supabase/server";
import type { PartyRole } from "@/lib/types/database";
import { getDefaultPayoutAccount } from "@/lib/escrow/transfers";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function executePaymongoWithdrawal(
  supabase: Supabase,
  params: {
    userId: string;
    partyRole: PartyRole;
    amountCentavos: number;
    feeCentavos: number;
    provider: WithdrawalProvider;
    idempotencyKey?: string;
  }
) {
  const payout = await getDefaultPayoutAccount(
    supabase,
    params.userId,
    params.partyRole
  );
  if (!payout) {
    throw new Error(
      `No default ${params.partyRole} payout account. Add one under Settings → Payouts.`
    );
  }

  const idempotencyKey = params.idempotencyKey ?? uuidv4();
  const referenceNumber = `withdraw_${params.userId}_${Date.now()}`;

  const { data: row, error: insertErr } = await supabase
    .from("paymongo_transfers")
    .insert({
      deal_id: null,
      type: "withdrawal",
      recipient_user_id: params.userId,
      recipient_role: params.partyRole,
      payout_account_id: payout.id,
      amount_centavos: params.amountCentavos,
      fee_centavos: params.feeCentavos,
      provider: params.provider,
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
      amount: params.amountCentavos,
      provider: params.provider,
      destination: {
        number: payout.account_number,
        name: payout.account_name,
        bic: payout.bank_bic,
      },
      referenceNumber,
      description: `Withdrawal via ${params.provider}`,
      callbackUrl: `${appUrl}/api/webhooks/paymongo`,
      metadata: {
        user_id: params.userId,
        recipient_role: params.partyRole,
        transfer_row_id: row.id,
        provider: params.provider,
      },
      idempotencyKey,
    });

    const transfer = result.data.transfers?.[0];
    await supabase
      .from("paymongo_transfers")
      .update({
        batch_transfer_id: result.data.id,
        transfer_id: transfer?.id,
        instruction_id:
          extractInstructionId(transfer?.metadata) ?? null,
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
