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

  const status = deal.status as DealStatus;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {status === "draft" && deal.created_by && (
        <Button
          disabled={loading}
          className={actionBtn}
          onClick={() => action("/start-payment")}
        >
          Start payment
        </Button>
      )}

      {status === "awaiting_payment" && participantRole === "buyer" && (
        <p className="text-sm text-zinc-600 w-full">
          Use the QR section below to pay as the designated buyer.
        </p>
      )}

      {status === "funded" && participantRole === "seller" && (
        <Button disabled={loading} className={actionBtn} onClick={() => action("/ship")}>
          Mark shipped
        </Button>
      )}

      {(status === "funded" || status === "in_progress") &&
        participantRole === "buyer" && (
          <Button disabled={loading} className={actionBtn} onClick={() => action("/confirm")}>
            Confirm receipt
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
        <Button disabled={loading} className={actionBtn} onClick={() => action("/start-payment")}>
          Retry payment
        </Button>
      )}
    </div>
  );
}
