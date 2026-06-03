import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logDealEvent, postSystemMessage } from "@/lib/escrow/events";

function rpcErrorStatus(message: string): number {
  if (message === "Unauthorized") return 401;
  if (message === "Only the buyer can review") return 403;
  if (message === "Deal not found") return 404;
  if (
    message === "Deal must be completed" ||
    message === "Already reviewed" ||
    message === "Rating must be 1–5"
  ) {
    return 400;
  }
  return 500;
}

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

  if (
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5 ||
    !Number.isInteger(rating)
  ) {
    return NextResponse.json(
      { error: "Rating must be an integer from 1 to 5" },
      { status: 400 }
    );
  }

  const { data: reviewId, error } = await supabase.rpc("insert_deal_review", {
    p_deal_id: dealId,
    p_rating: rating,
    p_comment: comment,
  });

  if (error) {
    const status = rpcErrorStatus(error.message);
    return NextResponse.json({ error: error.message }, { status });
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

  return NextResponse.json({ ok: true, id: reviewId });
}
