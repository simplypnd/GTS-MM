const EVENT_LABELS: Record<string, string> = {
  created: "Deal created",
  payment_window_started: "Payment window started",
  payment_started: "Payment QR generated",
  payment_paid: "Payment received",
  delivered: "Marked as delivered",
  shipped: "Marked as shipped",
  released: "Credited to seller balance",
  refunded: "Credited to buyer balance",
  disputed: "Dispute opened",
  resolved: "Dispute resolved",
  deal_cancelled: "Deal cancelled",
  deal_reviewed: "Review submitted",
};

export function formatDealEventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event.replace(/_/g, " ");
}
