import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { assertTransition } from "@/lib/escrow/dealState";
import { logDealEvent } from "@/lib/escrow/events";
import { loadAndAssertCanTransact } from "@/lib/admin/assertCanTransact";
import { moderationErrorResponse } from "@/lib/admin/moderation";

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

  const service = await createServiceClient();
  try {
    await loadAndAssertCanTransact(service, user.id);
  } catch (e) {
    const mod = moderationErrorResponse(e);
    if (mod) {
      return NextResponse.json({ error: mod.error, code: mod.code }, { status: mod.status });
    }
    throw e;
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
      { error: "Only the buyer can start payment" },
      { status: 403 }
    );
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

  await logDealEvent(service, {
    dealId: id,
    actorId: user.id,
    actorRole: "buyer",
    event: "payment_window_started",
  });

  return NextResponse.json({ ok: true });
}
