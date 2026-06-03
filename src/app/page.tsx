import { createClient } from "@/lib/supabase/server";
import {
  HomeCta,
  HomeFaq,
  HomeFeatures,
  HomeFooter,
  HomeHero,
  HomeHowItWorks,
} from "@/components/marketing/HomeSections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-6xl space-y-16 pb-12">
      <HomeHero isLoggedIn={!!user} />
      <HomeHowItWorks />
      <HomeFeatures />
      <HomeFaq />
      <HomeCta isLoggedIn={!!user} />
      <HomeFooter isLoggedIn={!!user} />
    </div>
  );
}
