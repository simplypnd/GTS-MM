import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
import { StarRatingDisplay } from "@/components/profile/StarRatingDisplay";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { profilePath } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types/database";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const siteUrl = getSiteUrl();
  const title = `${decoded} | GTS MM`;
  const description = `View ${decoded}'s seller reputation and completed deals on GTS MM.`;
  const url = `${siteUrl}${profilePath(decoded)}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "GTS MM", locale: "en_PH" },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  const service = await createServiceClient();
  const { data, error } = await service.rpc("get_public_profile", {
    p_username: decoded,
  });

  if (error || !data) {
    notFound();
  }

  const profile = data as PublicProfile;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let reviewsList: {
    rating: number;
    comment: string | null;
    created_at: string;
    deal_title: string;
  }[] = [];

  if (profile.id) {
    const { data: reviews } = await service
      .from("deal_reviews")
      .select("rating, comment, created_at, deal_id")
      .eq("reviewee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (reviews?.length) {
      const dealIds = reviews.map((r) => r.deal_id);
      const { data: deals } = await service
        .from("deals")
        .select("id, title")
        .in("id", dealIds);
      const titleById = new Map(deals?.map((d) => [d.id, d.title]) ?? []);

      reviewsList = reviews.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        deal_title: titleById.get(r.deal_id) ?? "Deal",
      }));
    }
  }

  return (
    <div className="space-y-8">
      <PublicProfileView profile={profile} viewerId={user?.id} />

      {reviewsList.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent reviews</h2>
          <ul className="space-y-3">
            {reviewsList.map((r, i) => (
              <li
                key={`${r.created_at}-${i}`}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <StarRatingDisplay rating={r.rating} />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {r.deal_title}
                </p>
                {r.comment && (
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {r.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
