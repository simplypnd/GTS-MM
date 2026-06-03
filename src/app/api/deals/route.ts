import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logDealEvent } from "@/lib/escrow/events";
import { PLATFORM_FEE_BPS } from "@/lib/escrow/dealState";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    amount_centavos,
    counterparty_identifier,
    counterparty_email,
    my_side,
  } = body as {
    title: string;
    description?: string;
    amount_centavos: number;
    counterparty_identifier?: string;
    counterparty_email?: string;
    my_side: "buyer" | "seller";
  };

  const identifier =
    counterparty_identifier?.trim() || counterparty_email?.trim() || "";

  if (!title || !amount_centavos || !identifier || !my_side) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const { resolveCounterpartyUserId } = await import(
    "@/lib/users/resolveCounterparty"
  );
  const service = await createServiceClient();
  const resolved = await resolveCounterpartyUserId(service, identifier);

  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 404 });
  }

  if (resolved.userId === user.id) {
    return NextResponse.json(
      { error: "Cannot create a deal with yourself" },
      { status: 400 }
    );
  }

  const buyer_id = my_side === "buyer" ? user.id : resolved.userId;
  const seller_id = my_side === "seller" ? user.id : resolved.userId;

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      title,
      description: description ?? null,
      amount_centavos,
      buyer_id,
      seller_id,
      created_by: user.id,
      status: "draft",
      platform_fee_bps: PLATFORM_FEE_BPS,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logDealEvent(service, {
    dealId: deal.id,
    actorId: user.id,
    actorRole: my_side,
    event: "created",
  });

  return NextResponse.json({ deal });
}
