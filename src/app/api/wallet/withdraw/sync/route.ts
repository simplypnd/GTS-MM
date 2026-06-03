import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { syncPendingWithdrawalsForUser } from "@/lib/wallet/syncWithdrawals";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createServiceClient();
  const { updated } = await syncPendingWithdrawalsForUser(service, user.id);

  const { data: transfers } = await service
    .from("paymongo_transfers")
    .select("id, amount_centavos, fee_centavos, provider, status, created_at")
    .eq("recipient_user_id", user.id)
    .eq("type", "withdrawal")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ updated, transfers: transfers ?? [] });
}
