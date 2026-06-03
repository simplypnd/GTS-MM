"use client";

import { useRouter } from "next/navigation";
import { QrPayment } from "@/components/deals/QrPayment";

export function QrPaymentClient({ dealId }: { dealId: string }) {
  const router = useRouter();
  return <QrPayment dealId={dealId} onFunded={() => router.refresh()} />;
}
