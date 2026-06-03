import { DealActions } from "@/components/deals/DealActions";
import { DealStatusFeed } from "@/components/deals/DealStatusFeed";
import { QrPaymentClient } from "@/components/deals/QrPaymentClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getStatusGuidance,
  getStatusLabel,
  statusBadgeVariant,
} from "@/lib/deals/statusGuidance";
import { sectionEnter } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Deal, DealStatus, ParticipantRole } from "@/lib/types/database";

type DisputeRow = {
  opened_by_role: string;
  reason: string;
};

export function DealStatusSection({
  deal,
  participantRole,
  isMediator,
  dispute,
  paymentQr,
  currentUserId,
  buyerBalanceCentavos,
}: {
  deal: Deal;
  participantRole: ParticipantRole | null;
  isMediator: boolean;
  dispute: DisputeRow | null;
  paymentQr: {
    qr_image_url: string | null;
    expires_at: string | null;
  } | null;
  currentUserId: string;
  buyerBalanceCentavos?: number | null;
}) {
  const status = deal.status as DealStatus;
  const canPayWithBalance =
    deal.buyer_id === currentUserId &&
    (buyerBalanceCentavos ?? 0) >= deal.amount_centavos;
  const guidance = getStatusGuidance(status, participantRole, {
    canPayWithBalance,
  });
  const showQr =
    status === "awaiting_payment" &&
    deal.buyer_id === currentUserId &&
    !!paymentQr?.qr_image_url;

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
              <p className="text-sm text-zinc-600">{guidance}</p>
            )}
          </div>

          {dispute && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <p>
                <strong>Dispute</strong> opened by{" "}
                <Badge variant="warning">{dispute.opened_by_role}</Badge>
              </p>
              <p className="mt-1 text-zinc-700">{dispute.reason}</p>
            </div>
          )}

          {showQr && (
            <div className={cn("motion-safe:animate-fade-in motion-reduce:animate-none")}>
            <QrPaymentClient
              dealId={deal.id}
              initialQrUrl={paymentQr.qr_image_url}
              initialExpiresAt={paymentQr.expires_at}
              embedded
            />
            </div>
          )}

          <DealActions
            deal={deal}
            participantRole={participantRole}
            isMediator={isMediator}
            buyerBalanceCentavos={buyerBalanceCentavos}
          />

          <DealStatusFeed dealId={deal.id} />
        </CardContent>
      </Card>
    </section>
  );
}
