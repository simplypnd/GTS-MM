import type { Metadata } from "next";
import { getServerUser } from "@/lib/supabase/server";
import { HomeJsonLd } from "@/components/marketing/HomeJsonLd";
import {
  HomeCta,
  HomeFaq,
  HomeFeatures,
  HomeHero,
  HomeHowItWorks,
} from "@/components/marketing/HomeSections";

export const dynamic = "force-dynamic";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://app.gtseller.shop";

const title = "GTS MM | Secure Online Deals with MidMan & QR Ph";
const description =
  "GTS MM protects buyer and seller deals in the Philippines with MidMan, QR Ph payments, wallet balance, and InstaPay or PESONet bank withdrawals.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "GTS MM",
    "MidMan",
    "QR Ph payment Philippines",
    "secure online deals",
    "buyer seller protection",
    "wallet withdrawal InstaPay",
    "PESONet",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: `${siteUrl}/` },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/`,
    siteName: "GTS MM",
    locale: "en_PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function HomePage() {
  const { user } = await getServerUser();

  return (
    <>
      <HomeJsonLd />
      <article className="mx-auto max-w-6xl space-y-16 pb-12">
        <HomeHero isLoggedIn={!!user} />
        <HomeHowItWorks />
        <HomeFeatures />
        <HomeFaq />
        <HomeCta isLoggedIn={!!user} />
      </article>
    </>
  );
}
