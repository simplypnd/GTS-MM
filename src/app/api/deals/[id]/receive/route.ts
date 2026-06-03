import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { releaseToSeller } from "@/lib/escrow/transfers";
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

  if (!deal || deal.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (deal.status !== "in_progress") {
    return NextResponse.json(
      { error: "Buyer must mark delivered before you can confirm receipt" },
      { status: 400 }
    );
  }

  const service = await createServiceClient();

  try {
    await releaseToSeller(service, deal as Deal, user.id, "seller");
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Release failed — ensure seller payout account is set",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
