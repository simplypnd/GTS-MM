import { getTransfer } from "@/lib/paymongo/client";
import { parsePaymongoTransferResource } from "@/lib/paymongo/transferFields";
import type { TransferDbStatus } from "@/lib/paymongo/transferWebhook";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

type TransferSyncRow = {
  id: string;
  transfer_id: string | null;
  status: string;
  instruction_id: string | null;
};

function mapPaymongoStatus(raw: string): TransferDbStatus {
  const s = raw.toLowerCase();
  if (s === "succeeded" || s === "success" || s === "paid") return "succeeded";
  if (s === "failed" || s === "failure") return "failed";
  return "pending";
}

async function refetchAndPatchTransferRow(
  supabase: Supabase,
  row: TransferSyncRow
): Promise<boolean> {
  if (!row.transfer_id) return false;

  const res = await getTransfer(row.transfer_id);
  const parsed = parsePaymongoTransferResource(res.data);

  if (row.status === "succeeded") {
    if (
      !parsed.instructionId ||
      parsed.instructionId === row.instruction_id
    ) {
      return false;
    }
    const { error } = await supabase
      .from("paymongo_transfers")
      .update({ instruction_id: parsed.instructionId })
      .eq("id", row.id);
    return !error;
  }

  const remoteStatus = parsed.status;
  if (!remoteStatus) return false;
  const mapped = mapPaymongoStatus(remoteStatus);

  const patch: {
    status?: TransferDbStatus;
    instruction_id?: string;
  } = {};

  if (mapped !== "pending") {
    patch.status = mapped;
  }
  if (
    parsed.instructionId &&
    parsed.instructionId !== row.instruction_id
  ) {
    patch.instruction_id = parsed.instructionId;
  }

  if (Object.keys(patch).length === 0) return false;

  const { error } = await supabase
    .from("paymongo_transfers")
    .update(patch)
    .eq("id", row.id);

  return !error;
}

async function syncTransferRows(
  supabase: Supabase,
  rows: TransferSyncRow[]
): Promise<number> {
  let updated = 0;
  for (const row of rows) {
    try {
      if (await refetchAndPatchTransferRow(supabase, row)) updated += 1;
    } catch (e) {
      console.warn(
        "[syncWithdrawals] Failed for",
        row.transfer_id,
        e instanceof Error ? e.message : e
      );
    }
  }
  return updated;
}

export async function syncPendingWithdrawalsForUser(
  supabase: Supabase,
  userId: string
): Promise<{ updated: number }> {
  const { data: pending } = await supabase
    .from("paymongo_transfers")
    .select("id, transfer_id, status, instruction_id")
    .eq("recipient_user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "pending")
    .not("transfer_id", "is", null);

  const { data: missingInstructionId } = await supabase
    .from("paymongo_transfers")
    .select("id, transfer_id, status, instruction_id")
    .eq("recipient_user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "succeeded")
    .is("instruction_id", null)
    .not("transfer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const pendingRows = (pending ?? []) as TransferSyncRow[];
  const backfillRows = (missingInstructionId ?? []) as TransferSyncRow[];

  const updated =
    (await syncTransferRows(supabase, pendingRows)) +
    (await syncTransferRows(supabase, backfillRows));

  return { updated };
}
