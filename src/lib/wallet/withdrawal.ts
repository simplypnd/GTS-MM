export type WithdrawalProvider = "instapay" | "pesonet";

export const INSTAPAY_FEE_CENTAVOS = 1000;
export const MIN_WITHDRAWAL_CENTAVOS = 5000;

export function getWithdrawalFee(provider: WithdrawalProvider): number {
  return provider === "instapay" ? INSTAPAY_FEE_CENTAVOS : 0;
}

export function getWithdrawalDebit(
  amountCentavos: number,
  provider: WithdrawalProvider
): number {
  return amountCentavos + getWithdrawalFee(provider);
}

export function validateWithdrawalAmount(
  amountCentavos: number,
  _provider?: WithdrawalProvider
): { ok: true } | { ok: false; error: string } {
  if (!Number.isFinite(amountCentavos) || amountCentavos <= 0) {
    return { ok: false, error: "Enter a valid withdrawal amount." };
  }
  if (amountCentavos < MIN_WITHDRAWAL_CENTAVOS) {
    return {
      ok: false,
      error: "Minimum withdrawal is ₱50.00 to your bank.",
    };
  }
  return { ok: true };
}

/** Last 6 characters of InstaPay instruction ID for bank receipt matching. */
export function formatInstructionReference(instructionId: string): string {
  const t = instructionId.trim();
  return t.length <= 6 ? t : t.slice(-6);
}

export function maskAccountNumber(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `••••${digits.slice(-4)}`;
}
