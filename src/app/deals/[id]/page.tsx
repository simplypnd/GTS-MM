import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartyStrip } from "@/components/deals/PartyStrip";
import { DealChat } from "@/components/deals/DealChat";
import { DealStatusSection } from "@/components/deals/DealStatusSection";
import { formatPHP } from "@/lib/utils";
import type { Deal, Profile, ParticipantRole } from "@/lib/types/database";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (!deal) notFound();

  const { data: buyer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", deal.buyer_id)
    .single();

  const { data: seller } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", deal.seller_id)
    .single();

  const { data: participant } = await supabase
    .from("deal_participants")
    .select("role")
    .eq("deal_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_mediator, balance_centavos")
    .eq("id", user.id)
    .single();

  const { data: dispute } = await supabase
    .from("disputes")
    .select("*")
    .eq("deal_id", id)
    .maybeSingle();


  const participantRole = (participant?.role ?? null) as ParticipantRole | null;
  const typedDeal = deal as Deal;

  let paymentQr: { qr_image_url: string | null; expires_at: string | null } | null =
    null;
  if (deal.status === "awaiting_payment" && deal.buyer_id === user.id) {
    const { data: payment } = await supabase
      .from("paymongo_payments")
      .select("qr_image_url, expires_at")
      .eq("deal_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    paymentQr = payment;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{deal.title}</h1>
        {deal.description && (
          <p className="mt-1 text-zinc-600">{deal.description}</p>
        )}
        <p className="mt-2 text-xl font-semibold sm:text-2xl">
          {formatPHP(deal.amount_centavos)}
        </p>
      </div>

      <PartyStrip buyer={buyer as Profile} seller={seller as Profile} />

      <DealStatusSection
        deal={typedDeal}
        participantRole={participantRole}
        isMediator={!!profile?.is_mediator}
        dispute={dispute}
        paymentQr={paymentQr}
        currentUserId={user.id}
        buyerBalanceCentavos={
          deal.buyer_id === user.id ? profile?.balance_centavos : null
        }
      />

      {deal.status === "disputed" && profile?.is_mediator && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Mediator resolution</p>
          <p className="mt-1">
            Release and refund credit party balances. They can withdraw to their
            bank on <strong>/withdraw</strong> when ready.
          </p>
        </div>
      )}

      {participantRole && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Chat</h2>
          <DealChat
            dealId={id}
            currentUserId={user.id}
            senderRole={participantRole}
          />
        </section>
      )}
    </div>
  );
}
