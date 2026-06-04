import type { TransferUpdate } from "@/lib/paymongo/transferWebhook";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function applyTransferUpdate(
  supabase: Supabase,
  update: TransferUpdate
): Promise<{ rowId: string | null; mapped: string }> {
  const payload: {
    status: typeof update.status;
    transfer_id: string;
    provider_reference_number?: string;
  } = {
    status: update.status,
    transfer_id: update.transferId,
  };
  if (update.providerReferenceNumber) {
    payload.provider_reference_number = update.providerReferenceNumber;
  }

  if (update.transferRowId) {
    const { data } = await supabase
      .from("paymongo_transfers")
      .update(payload)
      .eq("id", update.transferRowId)
      .select("id, deal_id, type")
      .maybeSingle();
    if (data) return { rowId: data.id, mapped: update.status };
  }

  const { data: byTransferId } = await supabase
    .from("paymongo_transfers")
    .update(payload)
    .eq("transfer_id", update.transferId)
    .select("id, deal_id, type")
    .maybeSingle();
  if (byTransferId) return { rowId: byTransferId.id, mapped: update.status };

  if (update.referenceNumber) {
    const { data: byRef } = await supabase
      .from("paymongo_transfers")
      .update(payload)
      .eq("reference_number", update.referenceNumber)
      .select("id, deal_id, type")
      .maybeSingle();
    if (byRef) return { rowId: byRef.id, mapped: update.status };
  }

  console.warn(
    "[paymongo webhook] No paymongo_transfers row matched",
    update.transferId,
    update.transferRowId,
    update.referenceNumber
  );
  return { rowId: null, mapped: update.status };
}
