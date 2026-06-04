"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalizedTime } from "@/components/ui/LocalizedTime";
import { LoadingSpinner } from "@/components/ui/spinner";
import type { DealStatus } from "@/lib/types/database";

function QrPaymentContent({
  qrUrl,
  expiresAt,
  checking,
  checkError,
  onCheckPayment,
}: {
  qrUrl: string;
  expiresAt: string | null;
  checking: boolean;
  checkError: string | null;
  onCheckPayment: () => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Pay with QR Ph
      </p>
      {qrUrl.startsWith("data:") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrUrl}
          alt="QR Ph payment code"
          className="mx-auto w-full max-w-xs rounded-lg border bg-white"
        />
      ) : (
        <p className="break-all text-sm text-zinc-600 dark:text-zinc-400">
          {qrUrl}
        </p>
      )}
      {expiresAt && (
        <p className="text-xs text-zinc-500">
          Expires:{" "}
          <LocalizedTime
            dateTime={expiresAt}
            className="inline text-xs text-zinc-500"
          />
        </p>
      )}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Scan with your bank or e-wallet app. This page updates automatically
        when payment is received.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={checking}
        onClick={onCheckPayment}
      >
        {checking ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner />
            Checking…
          </span>
        ) : (
          "Check payment status"
        )}
      </Button>
      {checkError && (
        <p className="text-sm text-red-600 dark:text-red-400">{checkError}</p>
      )}
    </div>
  );
}

export function QrPayment({
  dealId,
  initialQrUrl,
  initialExpiresAt,
  onPaymentStatus,
  embedded = false,
}: {
  dealId: string;
  initialQrUrl?: string | null;
  initialExpiresAt?: string | null;
  onPaymentStatus?: (status: DealStatus) => void;
  embedded?: boolean;
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(initialQrUrl ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(
    initialExpiresAt ?? null
  );
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQrUrl) {
      setQrUrl(initialQrUrl);
      setExpiresAt(initialExpiresAt ?? null);
    }
  }, [initialQrUrl, initialExpiresAt]);

  async function checkPayment() {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/sync-payment`, {
        method: "POST",
      });
      const data = (await res.json()) as { status?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not check payment status");
      }
      if (data.status) {
        onPaymentStatus?.(data.status as DealStatus);
      }
    } catch (err) {
      setCheckError(
        err instanceof Error ? err.message : "Could not check payment status"
      );
    } finally {
      setChecking(false);
    }
  }

  if (!qrUrl) {
    return null;
  }

  const content = (
    <QrPaymentContent
      qrUrl={qrUrl}
      expiresAt={expiresAt}
      checking={checking}
      checkError={checkError}
      onCheckPayment={() => void checkPayment()}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with QR Ph</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
