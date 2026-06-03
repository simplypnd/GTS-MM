export type WithdrawalProvider = "instapay" | "pesonet";

export const INSTAPAY_FEE_CENTAVOS = 1000;

export function getWithdrawalFee(provider: WithdrawalProvider): number {
  return provider === "instapay" ? INSTAPAY_FEE_CENTAVOS : 0;
}

export function getWithdrawalDebit(
  amountCentavos: number,
  provider: WithdrawalProvider
): number {
  return amountCentavos + getWithdrawalFee(provider);
}
