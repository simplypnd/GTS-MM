import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

export type BalanceLedgerKind =
  | "deal_payment"
  | "deal_release"
  | "deal_refund"
  | "withdrawal"
  | "withdrawal_reversal";

export async function applyBalanceDelta(
  supabase: Supabase,
  params: {
    userId: string;
    deltaCentavos: number;
    kind: BalanceLedgerKind;
    dealId?: string | null;
    referenceId?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<number> {
  const { data, error } = await supabase.rpc("apply_balance_delta", {
    p_user_id: params.userId,
    p_delta: params.deltaCentavos,
    p_kind: params.kind,
    p_deal_id: params.dealId ?? null,
    p_reference_id: params.referenceId ?? null,
    p_metadata: params.metadata ?? null,
  });

  if (error) throw error;
  return data as number;
}

export async function creditUserBalance(
  supabase: Supabase,
  params: {
    userId: string;
    amountCentavos: number;
    kind: BalanceLedgerKind;
    dealId?: string | null;
    referenceId?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  if (params.amountCentavos <= 0) {
    throw new Error("credit amount must be positive");
  }
  return applyBalanceDelta(supabase, {
    ...params,
    deltaCentavos: params.amountCentavos,
  });
}

export async function debitUserBalance(
  supabase: Supabase,
  params: {
    userId: string;
    amountCentavos: number;
    kind: BalanceLedgerKind;
    dealId?: string | null;
    referenceId?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  if (params.amountCentavos <= 0) {
    throw new Error("debit amount must be positive");
  }
  return applyBalanceDelta(supabase, {
    ...params,
    deltaCentavos: -params.amountCentavos,
  });
}
