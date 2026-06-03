import { STATUS_LABELS } from "@/lib/escrow/dealState";
import { dealFeeBreakdown } from "@/lib/escrow/fees";
import { formatPHP } from "@/lib/utils";
import type { Deal, DealStatus, ParticipantRole } from "@/lib/types/database";

export function getStatusLabel(status: DealStatus): string {
  return STATUS_LABELS[status];
}

export function getStatusGuidance(
  status: DealStatus,
  participantRole: ParticipantRole | null,
  options?: { canPayWithBalance?: boolean; deal?: Deal }
): string | null {
  const netHint =
    options?.deal &&
    ["funded", "in_progress", "disputed"].includes(status)
      ? ` ${formatPHP(dealFeeBreakdown(options.deal).net)} held in escrow after fees.`
      : "";
  if (!participantRole) return null;

  switch (status) {
    case "draft":
      if (participantRole === "buyer") {
        if (options?.canPayWithBalance) {
          return "Pay with your balance or use QR Ph for this deal.";
        }
        return "Start payment to generate a QR Ph code for the deal amount.";
      }
      return "Waiting for the buyer to start payment.";
    case "awaiting_payment":
      if (participantRole === "buyer") {
        if (options?.canPayWithBalance) {
          return "Complete payment within 20 minutes or this deal is cancelled automatically. Pay with balance or scan the QR below.";
        }
        return "Complete payment within 20 minutes or this deal is cancelled automatically. Scan the QR code below.";
      }
      return "Waiting for the buyer to complete payment within 20 minutes.";
    case "funded":
      if (participantRole === "seller") {
        return `Mark delivered once you have shipped or fulfilled the order.${netHint}`;
      }
      if (participantRole === "buyer") {
        return `Waiting for the seller to mark delivered within 20 minutes. After that, you may cancel for a refund.${netHint}`;
      }
      return null;
    case "in_progress":
      if (participantRole === "buyer") {
        return `Confirm receipt only when the item matches this deal. Releasing funds cannot be undone except through a dispute.${netHint}`;
      }
      if (participantRole === "seller") {
        return `Waiting for the buyer to confirm receipt.${netHint}`;
      }
      return null;
    case "completed":
      return "This deal is complete.";
    case "disputed":
      return `A dispute is open. A mediator will review this deal.${netHint}`;
    case "expired":
      if (participantRole === "buyer") {
        return "The payment window expired. Retry payment to get a new QR code.";
      }
      return "Payment expired. Waiting for the buyer to retry.";
    case "refunded":
      return "Funds were refunded to the buyer.";
    case "cancelled":
      return "This deal was cancelled (manually or after payment was not received in time).";
    default:
      return null;
  }
}

export function statusBadgeVariant(
  status: DealStatus
): "default" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "funded":
    case "in_progress":
      return "info";
    case "completed":
      return "success";
    case "disputed":
    case "expired":
      return "warning";
    case "refunded":
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
}
