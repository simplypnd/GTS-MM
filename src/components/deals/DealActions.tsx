"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dealFeeBreakdown } from "@/lib/escrow/fees";
import { formatPHP } from "@/lib/utils";
import type { Deal, DealStatus, ParticipantRole } from "@/lib/types/database";

const actionBtn = "w-full sm:w-auto";

type PendingConfirm =
  | { type: "receive" }
  | { type: "cancel" }
  | { type: "release" }
  | { type: "refund" };

export function DealActions({
  deal,
  participantRole,
  isMediator,
  buyerBalanceCentavos,
  hasActiveQr = false,
  canCancelForNonDelivery = false,
  cancelWaitMinutes = 0,
}: {
  deal: Deal;
  participantRole: ParticipantRole | null;
  isMediator: boolean;
  buyerBalanceCentavos?: number | null;
  hasActiveQr?: boolean;
  canCancelForNonDelivery?: boolean;
  cancelWaitMinutes?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const status = deal.status as DealStatus;
  const { net, feePercent } = dealFeeBreakdown(deal);

  const canPayWithBalance =
    participantRole === "buyer" &&
    (buyerBalanceCentavos ?? 0) >= deal.amount_centavos;

  const dialogOpen = pendingConfirm !== null;
  const controlsDisabled = loading || dialogOpen;

  function showError(message: string) {
    setErrorMessage(message);
  }

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
      setPendingConfirm(null);
      router.refresh();
    } catch (e) {
      setPendingConfirm(null);
      showError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function payWithBalance() {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/pay-balance`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      router.refresh();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function startPaymentWithQr() {
    setLoading(true);
    try {
      if (deal.status === "draft") {
        const startRes = await fetch(`/api/deals/${deal.id}/start-payment`, {
          method: "POST",
        });
        const startData = await startRes.json();
        if (!startRes.ok) {
          throw new Error(startData.error ?? "Failed to start payment");
        }
      }

      if (!hasActiveQr) {
        const payRes = await fetch(`/api/deals/${deal.id}/pay`, { method: "POST" });
        const payData = await payRes.json();
        if (!payRes.ok) {
          throw new Error(payData.error ?? "Failed to generate QR");
        }
      }

      router.refresh();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Payment failed");
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
      showError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!pendingConfirm) return;
    switch (pendingConfirm.type) {
      case "receive":
        void action("/receive");
        break;
      case "cancel":
        void action("/cancel");
        break;
      case "release":
        void action("/resolve", "POST", { resolution: "release" });
        break;
      case "refund":
        void action("/resolve", "POST", { resolution: "refund" });
        break;
    }
  }

  function confirmDialogContent(): {
    title: string;
    description: ReactNode;
    confirmLabel: string;
    variant: "default" | "destructive";
  } | null {
    if (!pendingConfirm) return null;
    switch (pendingConfirm.type) {
      case "receive":
        return {
          title: "Confirm receipt",
          description: (
            <>
              <p>
                Confirm you received the correct item as described in this deal.
              </p>
              <p className="mt-2">
                Funds ({formatPHP(net)} after fees) will be released to the
                seller. This cannot be undone except through a dispute.
              </p>
            </>
          ),
          confirmLabel: "Confirm receipt",
          variant: "default",
        };
      case "cancel":
        return {
          title: status === "funded" ? "Cancel for refund" : "Cancel deal",
          description:
            status === "funded"
              ? "Cancel this deal and refund your payment to your wallet balance?"
              : "Cancel this deal? No funds have been transferred.",
          confirmLabel: status === "funded" ? "Cancel for refund" : "Cancel deal",
          variant: "destructive",
        };
      case "release":
        return {
          title: "Release to seller",
          description: (
            <>
              <p>
                Release {formatPHP(net)} (after {feePercent}% fee) to the
                seller&apos;s wallet balance?
              </p>
              <p className="mt-2">This resolution is final for this deal.</p>
            </>
          ),
          confirmLabel: "Release to seller",
          variant: "default",
        };
      case "refund":
        return {
          title: "Refund to buyer",
          description: (
            <>
              <p>
                Refund {formatPHP(net)} (after {feePercent}% fee) to the
                buyer&apos;s wallet balance?
              </p>
              <p className="mt-2">This resolution is final for this deal.</p>
            </>
          ),
          confirmLabel: "Refund to buyer",
          variant: "destructive",
        };
    }
  }

  const confirmContent = confirmDialogContent();

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {(status === "draft" || status === "awaiting_payment") &&
          participantRole === "buyer" && (
            <>
              <p className="w-full text-xs text-zinc-500 dark:text-zinc-400">
                You pay {formatPHP(deal.amount_centavos)}. Seller receives{" "}
                {formatPHP(net)} after {feePercent}% fee.
              </p>
              {canPayWithBalance && (
                <Button
                  disabled={controlsDisabled}
                  className={actionBtn}
                  onClick={() => void payWithBalance()}
                >
                  Pay with balance ({formatPHP(deal.amount_centavos)})
                </Button>
              )}
              {status === "draft" && (
                <Button
                  disabled={controlsDisabled}
                  variant={canPayWithBalance ? "outline" : "default"}
                  className={actionBtn}
                  onClick={() => void startPaymentWithQr()}
                >
                  {canPayWithBalance ? "Pay with QR Ph" : "Start payment"}
                </Button>
              )}
              {status === "awaiting_payment" && !hasActiveQr && (
                <Button
                  disabled={controlsDisabled}
                  variant={canPayWithBalance ? "outline" : "default"}
                  className={actionBtn}
                  onClick={() => void retryPaymentWithQr()}
                >
                  Generate QR Ph
                </Button>
              )}
            </>
          )}

        {(status === "draft" || status === "awaiting_payment") &&
          (participantRole === "buyer" || participantRole === "seller") && (
            <Button
              variant="outline"
              disabled={controlsDisabled}
              className={actionBtn}
              onClick={() => setPendingConfirm({ type: "cancel" })}
            >
              Cancel deal
            </Button>
          )}

        {status === "funded" && participantRole === "buyer" && (
          <>
            {canCancelForNonDelivery ? (
              <Button
                variant="destructive"
                disabled={controlsDisabled}
                className={actionBtn}
                onClick={() => setPendingConfirm({ type: "cancel" })}
              >
                Cancel for refund
              </Button>
            ) : cancelWaitMinutes > 0 ? (
              <p className="w-full text-xs text-zinc-500 dark:text-zinc-400">
                Refund cancel available in {cancelWaitMinutes} minute
                {cancelWaitMinutes === 1 ? "" : "s"} if seller has not delivered.
              </p>
            ) : null}
          </>
        )}

        {status === "funded" && participantRole === "seller" && (
          <Button
            disabled={controlsDisabled}
            className={actionBtn}
            onClick={() => action("/deliver")}
          >
            Delivered
          </Button>
        )}

        {status === "in_progress" && participantRole === "buyer" && (
          <Button
            disabled={controlsDisabled}
            className={actionBtn}
            onClick={() => setPendingConfirm({ type: "receive" })}
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
                  disabled={controlsDisabled}
                  className={actionBtn}
                  onClick={() => setShowDispute(true)}
                >
                  Open dispute
                </Button>
              ) : (
                <div className="w-full space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                  <Label>Reason</Label>
                  <Input
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="destructive"
                      disabled={controlsDisabled || !disputeReason.trim()}
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
            <p className="w-full text-xs text-zinc-500 dark:text-zinc-400">
              Release credits seller {formatPHP(net)}. Refund credits buyer{" "}
              {formatPHP(net)} (after {feePercent}% fee).
            </p>
            <Button
              disabled={controlsDisabled}
              className={actionBtn}
              onClick={() => setPendingConfirm({ type: "release" })}
            >
              Release to seller
            </Button>
            <Button
              variant="destructive"
              disabled={controlsDisabled}
              className={actionBtn}
              onClick={() => setPendingConfirm({ type: "refund" })}
            >
              Refund to buyer
            </Button>
          </>
        )}

        {status === "expired" && participantRole === "buyer" && (
          <>
            {canPayWithBalance && (
              <Button
                disabled={controlsDisabled}
                className={actionBtn}
                onClick={() => void payWithBalance()}
              >
                Pay with balance ({formatPHP(deal.amount_centavos)})
              </Button>
            )}
            {!hasActiveQr && (
              <Button
                disabled={controlsDisabled}
                variant={canPayWithBalance ? "outline" : "default"}
                className={actionBtn}
                onClick={() => void retryPaymentWithQr()}
              >
                Regenerate QR Ph
              </Button>
            )}
          </>
        )}
      </div>

      {confirmContent && (
        <ConfirmDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open && !loading) setPendingConfirm(null);
          }}
          title={confirmContent.title}
          description={confirmContent.description}
          confirmLabel={confirmContent.confirmLabel}
          variant={confirmContent.variant}
          onConfirm={handleConfirm}
          loading={loading}
        />
      )}

      <AlertDialog
        open={errorMessage !== null}
        onOpenChange={(open) => {
          if (!open) setErrorMessage(null);
        }}
        description={errorMessage ?? ""}
      />
    </>
  );
}
