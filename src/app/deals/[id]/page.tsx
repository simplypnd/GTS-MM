import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PartyStrip } from "@/components/deals/PartyStrip";
import { DealChat } from "@/components/deals/DealChat";
import { DealStatusSection } from "@/components/deals/DealStatusSection";
import { formatPHP, maskAccountNumber } from "@/lib/utils";
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
    .select("is_mediator")
    .eq("id", user.id)
    .single();

  const { data: dispute } = await supabase
    .from("disputes")
    .select("*")
    .eq("deal_id", id)
    .maybeSingle();

  let sellerPayout = null;
  let buyerPayout = null;
  if (deal.status === "disputed" && profile?.is_mediator) {
    const service = await createServiceClient();
    const { data: sp } = await service
      .from("payout_accounts")
      .select("account_number, account_name")
      .eq("user_id", deal.seller_id)
      .eq("party_role", "seller")
      .eq("is_default", true)
      .maybeSingle();
    const { data: bp } = await service
      .from("payout_accounts")
      .select("account_number, account_name")
      .eq("user_id", deal.buyer_id)
      .eq("party_role", "buyer")
      .eq("is_default", true)
      .maybeSingle();
    sellerPayout = sp;
    buyerPayout = bp;
  }

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
      />

      {deal.status === "disputed" && profile?.is_mediator && (
        <div className="rounded-lg border p-4 text-sm space-y-2 break-words">
          <p className="font-medium text-zinc-900">Mediator payout details</p>
          <p>
            Release to Seller ({seller?.display_name}):{" "}
            {sellerPayout
              ? `${sellerPayout.account_name} ${maskAccountNumber(sellerPayout.account_number)}`
              : "No payout account — seller must add one"}
          </p>
          <p>
            Refund to Buyer ({buyer?.display_name}):{" "}
            {buyerPayout
              ? `${buyerPayout.account_name} ${maskAccountNumber(buyerPayout.account_number)}`
              : "No refund account — buyer must add one"}
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
