import Link from "next/link";
import { ReputationSummary } from "@/components/profile/ReputationSummary";
import { Badge } from "@/components/ui/badge";
import { LocalizedTime } from "@/components/ui/LocalizedTime";
import { profilePath } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types/database";

export function PublicProfileView({
  profile,
  viewerId,
}: {
  profile: PublicProfile;
  viewerId?: string | null;
}) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{profile.display_name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Member since{" "}
          <LocalizedTime
            dateTime={profile.member_since}
            dateStyle="long"
            timeStyle="short"
            className="inline"
          />
        </p>
      </header>

      <ReputationSummary
        positivePercent={profile.positive_percent}
        reviewCount={profile.review_count}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent completed deals</h2>
        {profile.recent_deals.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No completed deals yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {profile.recent_deals.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <Badge variant="default" className="align-middle">
                      {d.role === "buyer" ? "Buyer" : "Seller"}
                    </Badge>
                  </p>
                </div>
                <LocalizedTime
                  dateTime={d.completed_at}
                  dateStyle="medium"
                  className="text-xs text-zinc-500"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewerId && (
        <p className="text-xs text-zinc-500">
          Profile URL:{" "}
          <Link
            href={profilePath(profile.display_name)}
            className="underline hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {profilePath(profile.display_name)}
          </Link>
        </p>
      )}
    </div>
  );
}
