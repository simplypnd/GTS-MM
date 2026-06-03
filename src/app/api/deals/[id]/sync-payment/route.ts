import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { syncDealPaymentFromPaymongo } from "@/lib/escrow/syncPayment";

/** Poll PayMongo and mark deal funded when payment succeeded (webhook fallback). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("buyer_id, seller_id, status")
    .eq("id", id)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = await createServiceClient();
  const { status, synced } = await syncDealPaymentFromPaymongo(service, id);

  return NextResponse.json({ status, synced });
}
