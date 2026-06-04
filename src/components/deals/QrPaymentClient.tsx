"use client";

import { QrPayment } from "@/components/deals/QrPayment";
import type { DealStatus } from "@/lib/types/database";

export function QrPaymentClient({
  dealId,
  initialQrUrl,
  initialExpiresAt,
  embedded = false,
  onPaymentStatus,
}: {
  dealId: string;
  initialQrUrl?: string | null;
  initialExpiresAt?: string | null;
  embedded?: boolean;
  onPaymentStatus?: (status: DealStatus) => void;
}) {
  return (
    <QrPayment
      dealId={dealId}
      initialQrUrl={initialQrUrl}
      initialExpiresAt={initialExpiresAt}
      embedded={embedded}
      onPaymentStatus={onPaymentStatus}
    />
  );
}
