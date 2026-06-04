import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProfileView } from "@/components/profile/PublicProfileView";
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

  let latestReview: {
    rating: number;
    comment: string | null;
    deal_title: string;
  } | null = null;

  if (profile.id) {
    const { data: reviews } = await service
      .from("deal_reviews")
      .select("rating, comment, created_at, deal_id")
      .eq("reviewee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (reviews?.length) {
      const review = reviews[0];
      const { data: deals } = await service
        .from("deals")
        .select("id, title")
        .eq("id", review.deal_id)
        .maybeSingle();

      latestReview = {
        rating: review.rating,
        comment: review.comment,
        deal_title: deals?.title ?? "Deal",
      };
    }
  }

  return (
    <PublicProfileView
      profile={profile}
      viewerId={user?.id}
      latestReview={latestReview}
    />
  );
}
