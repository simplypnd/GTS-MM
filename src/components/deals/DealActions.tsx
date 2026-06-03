"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Deal, DealStatus, ParticipantRole } from "@/lib/types/database";

const actionBtn = "w-full sm:w-auto";

export function DealActions({
  deal,
  participantRole,
  isMediator,
}: {
  deal: Deal;
  participantRole: ParticipantRole | null;
  isMediator: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);

  async function action(path: string, method = "POST", body?: object) {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function startPaymentWithQr() {
    setLoading(true);
    try {
      const startRes = await fetch(`/api/deals/${deal.id}/start-payment`, {
        method: "POST",
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error ?? "Failed to start payment");
      }

      const payRes = await fetch(`/api/deals/${deal.id}/pay`, { method: "POST" });
      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error ?? "Failed to generate QR");
      }

      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function retryPaymentWithQr() {
    setLoading(true);
    try {
      const payRes = await fetch(`/api/deals/${deal.id}/pay`, { method: "POST" });
      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error ?? "Failed to generate QR");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  const status = deal.status as DealStatus;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {status === "draft" && participantRole === "buyer" && (
        <Button
          disabled={loading}
          className={actionBtn}
          onClick={() => void startPaymentWithQr()}
        >
          Start payment
        </Button>
      )}

      {status === "funded" && participantRole === "seller" && (
        <Button
          disabled={loading}
          className={actionBtn}
          onClick={() => action("/deliver")}
        >
          Delivered
        </Button>
      )}

      {status === "in_progress" && participantRole === "buyer" && (
        <Button
          disabled={loading}
          className={actionBtn}
          onClick={() => action("/receive")}
        >
          Received
        </Button>
      )}

      {(status === "funded" || status === "in_progress") &&
        (participantRole === "buyer" || participantRole === "seller") && (
          <>
            {!showDispute ? (
              <Button
                variant="outline"
                disabled={loading}
                className={actionBtn}
                onClick={() => setShowDispute(true)}
              >
                Open dispute
              </Button>
            ) : (
              <div className="w-full space-y-2 rounded-lg border p-3">
                <Label>Reason</Label>
                <Input
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="destructive"
                    disabled={loading || !disputeReason.trim()}
                    className={actionBtn}
                    onClick={() =>
                      action("/dispute", "POST", { reason: disputeReason })
                    }
                  >
                    Submit dispute
                  </Button>
                  <Button
                    variant="ghost"
                    className={actionBtn}
                    onClick={() => setShowDispute(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

      {status === "disputed" && isMediator && (
        <>
          <Button
            disabled={loading}
            className={actionBtn}
            onClick={() => action("/resolve", "POST", { resolution: "release" })}
          >
            Release to seller
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            className={actionBtn}
            onClick={() => action("/resolve", "POST", { resolution: "refund" })}
          >
            Refund to buyer
          </Button>
        </>
      )}

      {status === "expired" && participantRole === "buyer" && (
        <Button
          disabled={loading}
          className={actionBtn}
          onClick={() => void retryPaymentWithQr()}
        >
          Retry payment
        </Button>
      )}
    </div>
  );
}
