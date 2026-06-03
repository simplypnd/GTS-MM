import { getTransfer } from "@/lib/paymongo/client";
import type { TransferDbStatus } from "@/lib/paymongo/transferWebhook";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

function mapPaymongoStatus(raw: string): TransferDbStatus {
  const s = raw.toLowerCase();
  if (s === "succeeded" || s === "success" || s === "paid") return "succeeded";
  if (s === "failed" || s === "failure") return "failed";
  return "pending";
}

export async function syncPendingWithdrawalsForUser(
  supabase: Supabase,
  userId: string
): Promise<{ updated: number }> {
  const { data: pending } = await supabase
    .from("paymongo_transfers")
    .select("id, transfer_id, status")
    .eq("recipient_user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "pending")
    .not("transfer_id", "is", null);

  if (!pending?.length) return { updated: 0 };

  let updated = 0;
  for (const row of pending) {
    if (!row.transfer_id) continue;
    try {
      const res = await getTransfer(row.transfer_id);
      const remoteStatus =
        res.data?.attributes?.status ?? res.data?.status;
      if (!remoteStatus) continue;
      const mapped = mapPaymongoStatus(remoteStatus);
      if (mapped === "pending") continue;

      const { error } = await supabase
        .from("paymongo_transfers")
        .update({ status: mapped })
        .eq("id", row.id)
        .eq("status", "pending");

      if (!error) updated += 1;
    } catch (e) {
      console.warn(
        "[syncWithdrawals] Failed for",
        row.transfer_id,
        e instanceof Error ? e.message : e
      );
    }
  }

  return { updated };
}
