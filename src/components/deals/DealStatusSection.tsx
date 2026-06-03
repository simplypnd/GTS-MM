"use client";

import { useEffect, useState } from "react";
import { DealActions } from "@/components/deals/DealActions";
import { QrPaymentClient } from "@/components/deals/QrPaymentClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalizedTime } from "@/components/ui/LocalizedTime";
import {
  getStatusGuidance,
  getStatusLabel,
  statusBadgeVariant,
} from "@/lib/deals/statusGuidance";
import { formatDealEventLabel } from "@/lib/deals/eventLabels";
import { isQrActive } from "@/lib/deals/paymentQr";
import { createClient } from "@/lib/supabase/client";
import { sectionEnter } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Deal, DealStatus, ParticipantRole } from "@/lib/types/database";

type DisputeRow = {
  opened_by_role: string;
  reason: string;
};

type DealEventRow = {
  id: string;
  event: string;
  created_at: string;
  actor_role: string | null;
};

type PaymentQr = {
  qr_image_url: string | null;
  expires_at: string | null;
};

function prependEvent(prev: DealEventRow[], row: DealEventRow): DealEventRow[] {
  if (prev.some((e) => e.id === row.id)) return prev;
  return [row, ...prev].slice(0, 8);
}

export function DealStatusSection({
  deal: initialDeal,
  participantRole,
  isMediator,
  dispute: initialDispute,
  paymentQr: initialPaymentQr,
  currentUserId,
  buyerBalanceCentavos,
  canCancelForNonDelivery = false,
  cancelWaitMinutes = 0,
}: {
  deal: Deal;
  participantRole: ParticipantRole | null;
  isMediator: boolean;
  dispute: DisputeRow | null;
  paymentQr: PaymentQr | null;
  currentUserId: string;
  buyerBalanceCentavos?: number | null;
  canCancelForNonDelivery?: boolean;
  cancelWaitMinutes?: number;
}) {
  const [deal, setDeal] = useState(initialDeal);
  const [dispute, setDispute] = useState(initialDispute);
  const [paymentQr, setPaymentQr] = useState(initialPaymentQr);
  const [events, setEvents] = useState<DealEventRow[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  useEffect(() => {
    setDeal(initialDeal);
    setDispute(initialDispute);
    setPaymentQr(initialPaymentQr);
  }, [initialDeal, initialDispute, initialPaymentQr]);

  const supabase = createClient();
  const dealId = deal.id;

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("deal_events")
        .select("id, event, created_at, actor_role")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })
        .limit(8);
      if (data) setEvents(data as DealEventRow[]);
      setEventsLoaded(true);
    }
    loadEvents();

    const channel = supabase
      .channel(`deal-status:${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deals",
          filter: `id=eq.${dealId}`,
        },
        (payload) => {
          setDeal(payload.new as Deal);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_events",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          setEvents((prev) =>
            prependEvent(prev, payload.new as DealEventRow)
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "disputes",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          const row = payload.new as {
            opened_by_role: string;
            reason: string;
          };
          setDispute({
            opened_by_role: row.opened_by_role,
            reason: row.reason,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase]);

  useEffect(() => {
    const status = deal.status as DealStatus;
    if (
      status !== "awaiting_payment" ||
      deal.buyer_id !== currentUserId ||
      paymentQr?.qr_image_url
    ) {
      return;
    }

    async function fetchQr() {
      const { data } = await supabase
        .from("paymongo_payments")
        .select("qr_image_url, expires_at")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.qr_image_url) {
        setPaymentQr({
          qr_image_url: data.qr_image_url,
          expires_at: data.expires_at,
        });
      }
    }
    fetchQr();
  }, [
    deal.status,
    deal.buyer_id,
    currentUserId,
    dealId,
    paymentQr?.qr_image_url,
    supabase,
  ]);

  async function refreshDealStatus() {
    const res = await fetch(`/api/deals/${dealId}/status`);
    const data = await res.json();
    if (data.status) {
      setDeal((prev) => ({ ...prev, status: data.status as DealStatus }));
    }
  }

  useEffect(() => {
    if (deal.status !== "awaiting_payment") return;
    const interval = setInterval(() => {
      void refreshDealStatus();
    }, 60_000);
    return () => clearInterval(interval);
  }, [deal.status, dealId]);

  const status = deal.status as DealStatus;
  const canPayWithBalance =
    deal.buyer_id === currentUserId &&
    (buyerBalanceCentavos ?? 0) >= deal.amount_centavos;
  const guidance = getStatusGuidance(status, participantRole, {
    canPayWithBalance,
    deal,
  });
  const hasActiveQr =
    status === "awaiting_payment" &&
    deal.buyer_id === currentUserId &&
    isQrActive(paymentQr);

  const showQr = hasActiveQr;

  return (
    <section>
      <Card className={cn(sectionEnter)}>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={statusBadgeVariant(status)} className="text-sm">
              {getStatusLabel(status)}
            </Badge>
            {guidance && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{guidance}</p>
            )}
          </div>

          {dispute && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/40">
              <p>
                <strong>Dispute</strong> opened by{" "}
                <Badge variant="warning">{dispute.opened_by_role}</Badge>
              </p>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                {dispute.reason}
              </p>
            </div>
          )}

          {showQr && paymentQr && (
            <div
              className={cn(
                "motion-safe:animate-fade-in motion-reduce:animate-none"
              )}
            >
              <QrPaymentClient
                dealId={deal.id}
                initialQrUrl={paymentQr.qr_image_url}
                initialExpiresAt={paymentQr.expires_at}
                embedded
                onFunded={refreshDealStatus}
              />
            </div>
          )}

          <DealActions
            deal={deal}
            participantRole={participantRole}
            isMediator={isMediator}
            buyerBalanceCentavos={buyerBalanceCentavos}
            hasActiveQr={hasActiveQr}
            canCancelForNonDelivery={canCancelForNonDelivery}
            cancelWaitMinutes={cancelWaitMinutes}
          />

          {eventsLoaded && events.length > 0 && (
            <div className="border-t border-zinc-200 pt-4">
              <h4 className="mb-2 text-sm font-medium text-zinc-900">
                Recent updates
              </h4>
              <ul className="space-y-2">
                {events.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                  >
                    <span className="text-zinc-700">
                      {formatDealEventLabel(row.event)}
                      {row.actor_role ? (
                        <span className="text-zinc-500">
                          {" "}
                          · {row.actor_role}
                        </span>
                      ) : null}
                    </span>
                    <LocalizedTime
                      dateTime={row.created_at}
                      className="shrink-0 text-xs text-zinc-500"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
