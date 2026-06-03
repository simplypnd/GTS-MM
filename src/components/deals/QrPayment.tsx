"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QrPayment({
  dealId,
  initialQrUrl,
  initialExpiresAt,
  onFunded,
}: {
  dealId: string;
  initialQrUrl?: string | null;
  initialExpiresAt?: string | null;
  onFunded?: () => void;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with QR Ph</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrUrl.startsWith("data:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrUrl}
            alt="QR Ph payment code"
            className="mx-auto w-full max-w-xs rounded-lg border"
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
      </CardContent>
    </Card>
  );
}
