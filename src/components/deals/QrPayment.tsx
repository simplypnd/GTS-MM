"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QrPayment({
  dealId,
  onFunded,
}: {
  dealId: string;
  onFunded?: () => void;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      setQrUrl(data.qrImageUrl);
      setExpiresAt(data.expiresAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!qrUrl) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/deals/${dealId}/status`);
      const data = await res.json();
      if (data.status === "funded") {
        clearInterval(interval);
        onFunded?.();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [qrUrl, dealId, onFunded]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with QR Ph</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrUrl ? (
          <Button onClick={startPayment} disabled={loading}>
            {loading ? "Generating QR…" : "Generate QR code"}
          </Button>
        ) : (
          <>
            {qrUrl.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QR Ph payment code"
                className="mx-auto max-w-xs rounded-lg border"
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
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
