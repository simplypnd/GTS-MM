import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { assertTransition } from "@/lib/escrow/dealState";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";

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

  if (!deal || deal.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    assertTransition(deal.status, "in_progress");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid transition" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("deals")
    .update({ status: "in_progress" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const service = await createServiceClient();
  await logDealEvent(service, {
    dealId: id,
    actorId: user.id,
    actorRole: "seller",
    event: "delivered",
  });
  await postSystemMessage(
    service,
    id,
    "Seller marked the order as delivered."
  );

  return NextResponse.json({ ok: true });
}
