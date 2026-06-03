"use client";

import { useRouter } from "next/navigation";
import { QrPayment } from "@/components/deals/QrPayment";

export function QrPaymentClient({
  dealId,
  initialQrUrl,
  initialExpiresAt,
}: {
  dealId: string;
  initialQrUrl?: string | null;
  initialExpiresAt?: string | null;
}) {
  const router = useRouter();
  return (
    <QrPayment
      dealId={dealId}
      initialQrUrl={initialQrUrl}
      initialExpiresAt={initialExpiresAt}
      onFunded={() => router.refresh()}
    />
  );
}
