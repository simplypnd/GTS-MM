import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReferralLinkCopy } from "@/components/referrals/ReferralLinkCopy";
import { REFERRAL_REWARD_BPS } from "@/lib/referrals/rewards";
import { formatPHP } from "@/lib/utils";

type ReferralDashboardProps = {
  referralUrl: string;
  referralCode: string;
  totalEarnedCentavos: number;
  payoutCount: number;
  embedded?: boolean;
};

export function ReferralDashboard({
  referralUrl,
  referralCode,
  totalEarnedCentavos,
  payoutCount,
  embedded = false,
}: ReferralDashboardProps) {
  const rewardPercent = REFERRAL_REWARD_BPS / 100;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Referrals
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Earn {rewardPercent}% when buyers you referred complete deals on GTS MM.
          </p>
        </div>
      )}
      {embedded && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Earn {rewardPercent}% when buyers you referred complete deals on GTS MM.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your invite link</CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Code: <span className="font-mono font-medium">{referralCode}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReferralLinkCopy referralUrl={referralUrl} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total earned
              </p>
              <p className="text-xl font-semibold">
                {formatPHP(totalEarnedCentavos)}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Completed referral payouts
              </p>
              <p className="text-xl font-semibold">{payoutCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/referrals/about"
          className="font-medium text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          Want to know more about referral?
        </Link>
      </p>
    </div>
  );
}
