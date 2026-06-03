const EVENT_LABELS: Record<string, string> = {
  created: "Deal created",
  payment_started: "Payment QR generated",
  payment_paid: "Payment received",
  delivered: "Marked as delivered",
  shipped: "Marked as shipped",
  released: "Funds released to seller",
  refunded: "Funds refunded",
  disputed: "Dispute opened",
  resolved: "Dispute resolved",
};

export function formatDealEventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event.replace(/_/g, " ");
}
