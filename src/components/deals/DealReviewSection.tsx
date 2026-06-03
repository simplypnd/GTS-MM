"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRatingDisplay } from "@/components/profile/StarRatingDisplay";
import type { DealReview } from "@/lib/types/database";

export function DealReviewSection({
  dealId,
  participantRole,
  existingReview,
}: {
  dealId: string;
  participantRole: "buyer" | "seller" | "mediator" | null;
  existingReview: DealReview | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (participantRole === "seller" && existingReview) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <p className="font-medium">Buyer review</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <StarRatingDisplay rating={existingReview.rating} />
          {existingReview.comment ? (
            <span>— {existingReview.comment}</span>
          ) : null}
        </p>
      </div>
    );
  }

  if (participantRole !== "buyer") {
    return null;
  }

  if (existingReview) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <p className="font-medium">Your review</p>
        <p className="mt-1 flex items-center gap-2">
          You rated <StarRatingDisplay rating={existingReview.rating} />
        </p>
        {existingReview.comment && (
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {existingReview.comment}
          </p>
        )}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <p className="font-medium">Leave a review</p>
      <div>
        <Label htmlFor="rating">Rating (1–5 stars)</Label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "star" : "stars"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="comment">Comment (optional)</Label>
        <Input
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" disabled={loading}>
        Submit review
      </Button>
    </form>
  );
}
