import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { assertTransition } from "@/lib/escrow/dealState";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";
import type { PartyRole } from "@/lib/types/database";

export async function POST(
  request: Request,
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

  const { reason } = (await request.json()) as { reason: string };
  if (!reason?.trim()) {
    return NextResponse.json({ error: "Reason required" }, { status: 400 });
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let openedByRole: PartyRole | null = null;
  if (deal.buyer_id === user.id) openedByRole = "buyer";
  else if (deal.seller_id === user.id) openedByRole = "seller";
  else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    assertTransition(deal.status, "disputed");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid transition" },
      { status: 400 }
    );
  }

  const service = await createServiceClient();

  const { data: mediator } = await service
    .from("profiles")
    .select("id")
    .eq("is_mediator", true)
    .limit(1)
    .maybeSingle();

  const mediatorId = mediator?.id ?? null;

  const { error: disputeErr } = await service.from("disputes").insert({
    deal_id: id,
    opened_by: user.id,
    opened_by_role: openedByRole,
    reason: reason.trim(),
    mediator_id: mediatorId,
  });

  if (disputeErr) {
    return NextResponse.json({ error: disputeErr.message }, { status: 500 });
  }

  await supabase.from("deals").update({ status: "disputed" }).eq("id", id);

  if (mediatorId) {
    await service.from("deal_participants").upsert(
      {
        deal_id: id,
        user_id: mediatorId,
        role: "mediator",
      },
      { onConflict: "deal_id,user_id" }
    );
    await postSystemMessage(service, id, "A mediator has joined this deal.");
  }

  await logDealEvent(service, {
    dealId: id,
    actorId: user.id,
    actorRole: openedByRole,
    event: "dispute_opened",
    payload: { reason },
  });
  await postSystemMessage(
    service,
    id,
    `Dispute opened by ${openedByRole}: ${reason.trim()}`
  );

  return NextResponse.json({ ok: true });
}
