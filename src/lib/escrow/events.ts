import type { createServiceClient } from "@/lib/supabase/server";
import type { ParticipantRole } from "@/lib/types/database";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export async function logDealEvent(
  supabase: Supabase,
  params: {
    dealId: string;
    actorId?: string;
    actorRole?: ParticipantRole;
    event: string;
    payload?: Record<string, unknown>;
  }
) {
  await supabase.from("deal_events").insert({
    deal_id: params.dealId,
    actor_id: params.actorId ?? null,
    actor_role: params.actorRole ?? null,
    event: params.event,
    payload: params.payload ?? null,
  });
}

export async function postSystemMessage(
  supabase: Supabase,
  dealId: string,
  body: string
) {
  await supabase.from("messages").insert({
    deal_id: dealId,
    sender_id: null,
    sender_role: null,
    body,
    is_system: true,
  });
}
