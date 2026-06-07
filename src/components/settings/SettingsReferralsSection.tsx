"use client";

import { useCallback, useEffect, useState } from "react";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";

type ReferralMeResponse = {
  referral_code: string;
  referral_url: string;
  total_earned_centavos: number;
  payout_count: number;
};

export function SettingsReferralsSection() {
  const [data, setData] = useState<ReferralMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals/me");
      if (!res.ok) {
        setData(null);
        setError(
          res.status === 404
            ? "Your referral link is not available yet."
            : "Failed to load referral data."
        );
        return;
      }
      const json = (await res.json()) as ReferralMeResponse;
      setData(json);
    } catch {
      setError("Failed to load referral data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {error ?? "Your referral link is not available yet."}
      </p>
    );
  }

  return (
    <ReferralDashboard
      embedded
      referralUrl={data.referral_url}
      referralCode={data.referral_code}
      totalEarnedCentavos={data.total_earned_centavos}
      payoutCount={data.payout_count}
    />
  );
}
