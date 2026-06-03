import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 font-medium", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      <span aria-hidden>{rating}</span>
      <Star
        className="h-4 w-4 fill-amber-400 text-amber-400"
        aria-hidden
      />
    </span>
  );
}
