import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { debitUserBalance } from "@/lib/wallet/balance";
import { executePaymongoWithdrawal } from "@/lib/paymongo/payout";
import {
  getWithdrawalDebit,
  getWithdrawalFee,
  validateWithdrawalAmount,
  type WithdrawalProvider,
} from "@/lib/wallet/withdrawal";
import type { PartyRole } from "@/lib/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    amount_centavos: number;
    provider: WithdrawalProvider;
    party_role: PartyRole;
    idempotency_key?: string;
  };

  const { amount_centavos, provider, party_role, idempotency_key } = body;

  if (provider !== "instapay" && provider !== "pesonet") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  if (party_role !== "buyer" && party_role !== "seller") {
    return NextResponse.json({ error: "Invalid party role" }, { status: 400 });
  }

  const amountValidation = validateWithdrawalAmount(amount_centavos, provider);
  if (!amountValidation.ok) {
    return NextResponse.json({ error: amountValidation.error }, { status: 400 });
  }

  const service = await createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("balance_centavos")
    .eq("id", user.id)
    .single();

  const balance = profile?.balance_centavos ?? 0;
  const feeCentavos = getWithdrawalFee(provider);
  const totalDebit = getWithdrawalDebit(amount_centavos, provider);

  if (totalDebit > balance) {
    return NextResponse.json(
      {
        error: `Insufficient balance. Need ₱${(totalDebit / 100).toFixed(2)} (including ₱${(feeCentavos / 100).toFixed(2)} fee) but you have ₱${(balance / 100).toFixed(2)}.`,
      },
      { status: 400 }
    );
  }

  try {
    const { transferRow } = await executePaymongoWithdrawal(service, {
      userId: user.id,
      partyRole: party_role,
      amountCentavos: amount_centavos,
      feeCentavos,
      provider,
      idempotencyKey: idempotency_key,
    });

    await debitUserBalance(service, {
      userId: user.id,
      amountCentavos: totalDebit,
      kind: "withdrawal",
      referenceId: transferRow.id,
      metadata: {
        provider,
        fee_centavos: feeCentavos,
        net_amount_centavos: amount_centavos,
      },
    });

    return NextResponse.json({
      ok: true,
      transfer_id: transferRow.id,
      total_debit_centavos: totalDebit,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Withdrawal failed" },
      { status: 500 }
    );
  }
}
