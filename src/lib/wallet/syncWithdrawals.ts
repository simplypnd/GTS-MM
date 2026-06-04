import { getTransfer } from "@/lib/paymongo/client";
import { parsePaymongoTransferResource } from "@/lib/paymongo/transferFields";
import type { TransferDbStatus } from "@/lib/paymongo/transferWebhook";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

type TransferSyncRow = {
  id: string;
  transfer_id: string | null;
  status: string;
  provider_reference_number: string | null;
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
      !parsed.providerReferenceNumber ||
      parsed.providerReferenceNumber === row.provider_reference_number
    ) {
      return false;
    }
    const { error } = await supabase
      .from("paymongo_transfers")
      .update({ provider_reference_number: parsed.providerReferenceNumber })
      .eq("id", row.id);
    return !error;
  }

  const remoteStatus = parsed.status;
  if (!remoteStatus) return false;
  const mapped = mapPaymongoStatus(remoteStatus);

  const patch: {
    status?: TransferDbStatus;
    provider_reference_number?: string;
  } = {};

  if (mapped !== "pending") {
    patch.status = mapped;
  }
  if (
    parsed.providerReferenceNumber &&
    parsed.providerReferenceNumber !== row.provider_reference_number
  ) {
    patch.provider_reference_number = parsed.providerReferenceNumber;
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
    .select("id, transfer_id, status, provider_reference_number")
    .eq("recipient_user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "pending")
    .not("transfer_id", "is", null);

  const { data: missingProviderRef } = await supabase
    .from("paymongo_transfers")
    .select("id, transfer_id, status, provider_reference_number")
    .eq("recipient_user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "succeeded")
    .is("provider_reference_number", null)
    .not("transfer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  const pendingRows = (pending ?? []) as TransferSyncRow[];
  const backfillRows = (missingProviderRef ?? []) as TransferSyncRow[];

  const updated =
    (await syncTransferRows(supabase, pendingRows)) +
    (await syncTransferRows(supabase, backfillRows));

  return { updated };
}
