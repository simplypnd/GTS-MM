"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReferralFaqAccordion } from "@/components/referrals/ReferralFaqAccordion";
import {
  REFERRAL_REWARD_BPS,
  computeReferralReward,
} from "@/lib/referrals/rewards";
import { formatPHP } from "@/lib/utils";

const EXAMPLE_DEALS_CENTAVOS = [100_000, 1_000_000, 10_000_000];

const STEPS = [
  "Share your personal referral link with friends.",
  "They register on GTS MM using that link.",
  "You earn 0.5% of each completed deal they pay for as the buyer.",
];

type ReferralHookPageProps = {
  isLoggedIn: boolean;
};

export function ReferralHookPage({ isLoggedIn }: ReferralHookPageProps) {
  const rewardPercent = REFERRAL_REWARD_BPS / 100;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-10">
        <p className="text-sm font-medium text-zinc-500">Referral program</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Earn when friends complete deals
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Invite buyers to GTS MM with your link. When they finish a secure deal,
          you receive <strong>{rewardPercent}%</strong> of the deal value in your
          wallet—paid on completion, not at signup.
        </p>
        {isLoggedIn ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/referrals"
              className="font-medium text-zinc-900 underline dark:text-zinc-100"
            >
              Go to Referrals dashboard
            </Link>{" "}
            to copy your invite link.
          </p>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg">Create account</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Log in
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          How it works
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-zinc-600 dark:text-zinc-400">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Example earnings
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Deal value
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  Your reward ({rewardPercent}%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
              {EXAMPLE_DEALS_CENTAVOS.map((cents) => (
                <tr key={cents}>
                  <td className="px-4 py-3">{formatPHP(cents)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPHP(computeReferralReward(cents))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Program FAQ
        </h2>
        <ReferralFaqAccordion />
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          See also our{" "}
          <Link
            href="/refund-and-return-policy#referral-program"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            referral program terms
          </Link>{" "}
          in the refund policy.
        </p>
      </section>

      {!isLoggedIn && (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          After you register, your personal referral link is on the{" "}
          <Link
            href="/referrals"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Referrals
          </Link>{" "}
          page.
        </p>
      )}
    </div>
  );
}
