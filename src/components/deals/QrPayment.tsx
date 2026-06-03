"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function QrPaymentContent({
  qrUrl,
  expiresAt,
}: {
  qrUrl: string;
  expiresAt: string | null;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-medium text-zinc-900">Pay with QR Ph</p>
      {qrUrl.startsWith("data:") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrUrl}
          alt="QR Ph payment code"
          className="mx-auto w-full max-w-xs rounded-lg border bg-white"
        />
      ) : (
        <p className="text-sm text-zinc-600 break-all">{qrUrl}</p>
      )}
      {expiresAt && (
        <p className="text-xs text-zinc-500">
          Expires: {new Date(expiresAt).toLocaleString()}
        </p>
      )}
      <p className="text-sm text-zinc-600">
        Scan with your bank or e-wallet app. Status updates automatically.
      </p>
    </div>
  );
}

export function QrPayment({
  dealId,
  initialQrUrl,
  initialExpiresAt,
  onFunded,
  embedded = false,
}: {
  dealId: string;
  initialQrUrl?: string | null;
  initialExpiresAt?: string | null;
  onFunded?: () => void;
  embedded?: boolean;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(initialQrUrl ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(
    initialExpiresAt ?? null
  );

  useEffect(() => {
    if (initialQrUrl) {
      setQrUrl(initialQrUrl);
      setExpiresAt(initialExpiresAt ?? null);
    }
  }, [initialQrUrl, initialExpiresAt]);

  useEffect(() => {
    if (!qrUrl) return;
    const interval = setInterval(async () => {
      await fetch(`/api/deals/${dealId}/sync-payment`, { method: "POST" });
      const res = await fetch(`/api/deals/${dealId}/status`);
      const data = await res.json();
      if (data.status === "funded") {
        clearInterval(interval);
        onFunded?.();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [qrUrl, dealId, onFunded]);

  if (!qrUrl) {
    return null;
  }

  if (embedded) {
    return <QrPaymentContent qrUrl={qrUrl} expiresAt={expiresAt} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with QR Ph</CardTitle>
      </CardHeader>
      <CardContent>
        <QrPaymentContent qrUrl={qrUrl} expiresAt={expiresAt} />
      </CardContent>
    </Card>
  );
}
