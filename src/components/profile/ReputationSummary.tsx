import { formatReviewCount } from "@/lib/utils";

export function ReputationSummary({
  positivePercent,
  reviewCount,
}: {
  positivePercent: number | null;
  reviewCount: number;
}) {
  if (reviewCount < 1) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          No reviews yet
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
        {positivePercent?.toFixed(1)}%
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {formatReviewCount(reviewCount)}
      </p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        Positive score counts 4- and 5-star buyer reviews.
      </p>
    </div>
  );
}
