import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { syncDealPaymentFromPaymongo } from "@/lib/escrow/syncPayment";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("status, buyer_id, seller_id")
    .eq("id", id)
    .single();

  if (!deal) {
    return NextResponse.json({ status: null });
  }

  if (
    deal.status === "awaiting_payment" ||
    deal.status === "expired"
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && (deal.buyer_id === user.id || deal.seller_id === user.id)) {
      const service = await createServiceClient();
      const { status } = await syncDealPaymentFromPaymongo(service, id);
      return NextResponse.json({ status });
    }
  }

  return NextResponse.json({ status: deal.status });
}
