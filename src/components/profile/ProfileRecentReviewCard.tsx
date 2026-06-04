import { StarRatingDisplay } from "@/components/profile/StarRatingDisplay";
import { cn } from "@/lib/utils";

export type ProfileLatestReview = {
  rating: number;
  comment: string | null;
  deal_title: string;
};

const cardClass =
  "rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50";

export function ProfileRecentReviewCard({
  latestReview,
  className,
}: {
  latestReview: ProfileLatestReview | null;
  className?: string;
}) {
  return (
    <div className={cn(cardClass, "min-w-0", className)}>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Recent reviews
      </h2>
      {latestReview ? (
        <div className="mt-3">
          <StarRatingDisplay rating={latestReview.rating} />
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {latestReview.deal_title}
          </p>
          {latestReview.comment && (
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {latestReview.comment}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-base font-medium text-zinc-700 dark:text-zinc-300">
          No reviews yet
        </p>
      )}
    </div>
  );
}
