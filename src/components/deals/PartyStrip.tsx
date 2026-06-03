import Link from "next/link";
import type { PublicProfileFields } from "@/lib/types/database";
import { profilePath } from "@/lib/utils";

export function PartyStrip({
  buyer,
  seller,
}: {
  buyer?: PublicProfileFields | null;
  seller?: PublicProfileFields | null;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex-row sm:flex-wrap">
      <div>
        <span className="font-medium text-zinc-500">Buyer</span>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
          {buyer?.display_name ? (
            <Link
              href={profilePath(buyer.display_name)}
              className="hover:underline"
            >
              {buyer.display_name}
            </Link>
          ) : (
            "—"
          )}
        </p>
      </div>
      <div>
        <span className="font-medium text-zinc-500">Seller</span>
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
          {seller?.display_name ? (
            <Link
              href={profilePath(seller.display_name)}
              className="hover:underline"
            >
              {seller.display_name}
            </Link>
          ) : (
            "—"
          )}
        </p>
      </div>
    </div>
  );
}
