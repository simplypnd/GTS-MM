import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logDealEvent } from "@/lib/escrow/events";

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
    counterparty_email,
    my_side,
  } = body as {
    title: string;
    description?: string;
    amount_centavos: number;
    counterparty_email: string;
    my_side: "buyer" | "seller";
  };

  if (!title || !amount_centavos || !counterparty_email || !my_side) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Look up counterparty by email via service client
  const { createServiceClient } = await import("@/lib/supabase/server");
  const service = await createServiceClient();
  const { data: authUsers } = await service.auth.admin.listUsers();
  const counterparty = authUsers?.users?.find(
    (u) => u.email?.toLowerCase() === counterparty_email.toLowerCase()
  );

  if (!counterparty) {
    return NextResponse.json(
      { error: "Counterparty not found. They must register first." },
      { status: 404 }
    );
  }

  if (counterparty.id === user.id) {
    return NextResponse.json(
      { error: "Cannot create a deal with yourself" },
      { status: 400 }
    );
  }

  const buyer_id = my_side === "buyer" ? user.id : counterparty.id;
  const seller_id = my_side === "seller" ? user.id : counterparty.id;

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
