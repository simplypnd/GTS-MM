import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertTransition } from "@/lib/escrow/dealState";

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

  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    assertTransition(deal.status, "awaiting_payment");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid transition" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("deals")
    .update({ status: "awaiting_payment" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
