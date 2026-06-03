import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { releaseToSeller, refundToBuyer } from "@/lib/escrow/transfers";
import type { Deal } from "@/lib/types/database";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_mediator")
    .eq("id", user.id)
    .single();

  if (!profile?.is_mediator) {
    return NextResponse.json({ error: "Mediator only" }, { status: 403 });
  }

  const body = (await request.json()) as {
    resolution: "release" | "refund" | "partial";
    resolution_notes?: string;
    seller_amount_centavos?: number;
    buyer_amount_centavos?: number;
  };
  const { resolution, resolution_notes, seller_amount_centavos } = body;

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (!deal || deal.status !== "disputed") {
    return NextResponse.json({ error: "Deal not in dispute" }, { status: 400 });
  }

  const service = await createServiceClient();

  try {
    if (resolution === "release") {
      await releaseToSeller(service, deal as Deal, user.id, "mediator");
      await service
        .from("disputes")
        .update({
          resolution: "release",
          resolved_at: new Date().toISOString(),
          resolution_notes: resolution_notes ?? null,
          mediator_id: user.id,
        })
        .eq("deal_id", id);
    } else if (resolution === "refund") {
      await refundToBuyer(
        service,
        deal as Deal,
        deal.amount_centavos,
        user.id,
        "mediator"
      );
      await service
        .from("disputes")
        .update({
          resolution: "refund",
          resolved_at: new Date().toISOString(),
          resolution_notes: resolution_notes ?? null,
          mediator_id: user.id,
        })
        .eq("deal_id", id);
    } else if (resolution === "partial") {
      const sellerAmt =
        seller_amount_centavos ?? Math.floor(deal.amount_centavos / 2);
      const buyerAmt = deal.amount_centavos - sellerAmt;
      const { executeTransfer } = await import("@/lib/escrow/transfers");
      await executeTransfer(service, deal as Deal, "release", sellerAmt);
      await executeTransfer(service, deal as Deal, "refund", buyerAmt);
      await service
        .from("deals")
        .update({ status: "completed" })
        .eq("id", id);
      await service
        .from("disputes")
        .update({
          resolution: "partial",
          seller_amount_centavos: sellerAmt,
          buyer_amount_centavos: buyerAmt,
          resolved_at: new Date().toISOString(),
          mediator_id: user.id,
        })
        .eq("deal_id", id);
    } else {
      return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Resolution failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
