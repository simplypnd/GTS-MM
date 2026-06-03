import {
  computeNetAfterFee,
  computePlatformFee,
} from "@/lib/escrow/dealState";

export function dealFeeBreakdown(deal: {
  amount_centavos: number;
  platform_fee_bps: number;
}) {
  const fee = computePlatformFee(
    deal.amount_centavos,
    deal.platform_fee_bps
  );
  const net = computeNetAfterFee(
    deal.amount_centavos,
    deal.platform_fee_bps
  );
  return {
    gross: deal.amount_centavos,
    fee,
    net,
    bps: deal.platform_fee_bps,
    feePercent: deal.platform_fee_bps / 100,
  };
}

export function formatFeeMessage(deal: {
  amount_centavos: number;
  platform_fee_bps: number;
}): string {
  const { gross, fee, net, feePercent } = dealFeeBreakdown(deal);
  return `Payment received: ₱${(gross / 100).toFixed(2)}. MidMan fee (${feePercent}%): ₱${(fee / 100).toFixed(2)}. ₱${(net / 100).toFixed(2)} held in escrow for release or refund.`;
}
