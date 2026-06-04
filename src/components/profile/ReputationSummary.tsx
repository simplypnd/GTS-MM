import { cn, formatReviewCount } from "@/lib/utils";

const cardClass =
  "rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50";

export function ReputationSummary({
  positivePercent,
  reviewCount,
  className,
}: {
  positivePercent: number | null;
  reviewCount: number;
  className?: string;
}) {
  if (reviewCount < 1) {
    return (
      <div className={cn(cardClass, className)}>
        <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          No reviews yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn(cardClass, className)}>
      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
        {positivePercent?.toFixed(1)}%
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {formatReviewCount(reviewCount)}
      </p>
    </div>
  );
}
