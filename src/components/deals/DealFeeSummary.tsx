import { dealFeeBreakdown } from "@/lib/escrow/fees";
import { formatPHP } from "@/lib/utils";
import type { Deal } from "@/lib/types/database";

export function DealFeeSummary({ deal }: { deal: Deal }) {
  const { gross, fee, net, feePercent } = dealFeeBreakdown(deal);

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <dl className="grid gap-2 sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Deal amount</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatPHP(gross)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">
            MidMan fee ({feePercent}%)
          </dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatPHP(fee)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Net in escrow</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
            {formatPHP(net)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Fee is deducted when payment is received. Release and refund credit the
        net amount to balances.
      </p>
    </div>
  );
}
