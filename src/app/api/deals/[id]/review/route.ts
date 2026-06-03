import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { rating?: number; comment?: string };
  const rating = body.rating;
  const comment = body.comment?.trim() || null;

  if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json(
      { error: "Rating must be an integer from 1 to 5" },
      { status: 400 }
    );
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, status, buyer_id, seller_id, title")
    .eq("id", dealId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (deal.buyer_id !== user.id) {
    return NextResponse.json({ error: "Only the buyer can review" }, { status: 403 });
  }

  if (deal.status !== "completed") {
    return NextResponse.json(
      { error: "You can only review completed deals" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("deal_reviews")
    .select("id")
    .eq("deal_id", dealId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already reviewed this deal" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("deal_reviews").insert({
    deal_id: dealId,
    reviewer_id: user.id,
    reviewee_id: deal.seller_id,
    rating,
    comment,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const service = await createServiceClient();
  await logDealEvent(service, {
    dealId,
    actorId: user.id,
    actorRole: "buyer",
    event: "deal_reviewed",
    payload: { rating },
  });
  await postSystemMessage(
    service,
    dealId,
    `Buyer left a ${rating}/5 star review.`
  );

  return NextResponse.json({ ok: true });
}
