import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { markDealFundedFromBalance } from "@/lib/escrow/markFundedFromBalance";
import type { Deal } from "@/lib/types/database";

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
    .select("*")
    .eq("id", id)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (deal.buyer_id !== user.id) {
    return NextResponse.json(
      { error: "Only the buyer can pay with balance" },
      { status: 403 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance_centavos")
    .eq("id", user.id)
    .single();

  const balance = profile?.balance_centavos ?? 0;
  if (balance < deal.amount_centavos) {
    return NextResponse.json(
      {
        error: `Insufficient balance. You have ₱${(balance / 100).toFixed(2)} but need ₱${(deal.amount_centavos / 100).toFixed(2)}.`,
      },
      { status: 400 }
    );
  }

  const service = await createServiceClient();

  try {
    const result = await markDealFundedFromBalance(
      service,
      deal as Deal,
      user.id
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment failed" },
      { status: 500 }
    );
  }
}
