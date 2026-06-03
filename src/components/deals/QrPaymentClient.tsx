"use client";

import { useRouter } from "next/navigation";
import { QrPayment } from "@/components/deals/QrPayment";

export function QrPaymentClient({
  dealId,
  initialQrUrl,
  initialExpiresAt,
  embedded = false,
}: {
  dealId: string;
  initialQrUrl?: string | null;
  initialExpiresAt?: string | null;
  embedded?: boolean;
}) {
  const router = useRouter();
  return (
    <QrPayment
      dealId={dealId}
      initialQrUrl={initialQrUrl}
      initialExpiresAt={initialExpiresAt}
      embedded={embedded}
      onFunded={() => router.refresh()}
    />
  );
}
