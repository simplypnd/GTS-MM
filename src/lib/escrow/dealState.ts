import type { DealStatus } from "@/lib/types/database";

const TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  draft: ["awaiting_payment", "cancelled"],
  awaiting_payment: ["funded", "expired", "cancelled"],
  funded: ["in_progress", "completed", "disputed"],
  in_progress: ["completed", "disputed"],
  disputed: ["completed", "refunded"],
  completed: [],
  refunded: [],
  expired: [],
  cancelled: [],
};

export function canTransition(from: DealStatus, to: DealStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: DealStatus, to: DealStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid deal transition: ${from} -> ${to}`);
  }
}

export function computeSellerPayout(
  amountCentavos: number,
  platformFeeBps: number
): number {
  const fee = Math.floor((amountCentavos * platformFeeBps) / 10000);
  return amountCentavos - fee;
}

export const STATUS_LABELS: Record<DealStatus, string> = {
  draft: "Draft",
  awaiting_payment: "Awaiting payment",
  funded: "Funded",
  in_progress: "In progress",
  completed: "Completed",
  refunded: "Refunded",
  disputed: "Disputed",
  expired: "Payment expired",
  cancelled: "Cancelled",
};
