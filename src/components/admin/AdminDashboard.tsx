"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
import type { AdminPlatformStats, AdminStatsGranularity } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const GRANULARITIES: { id: AdminStatsGranularity; label: string }[] = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
];

function formatPeriod(iso: string, granularity: AdminStatsGranularity): string {
  const d = new Date(iso);
  if (granularity === "month") {
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short" });
  }
  if (granularity === "week") {
    return `Week of ${d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`;
  }
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminDashboard() {
  const [granularity, setGranularity] = useState<AdminStatsGranularity>("day");
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (g: AdminStatsGranularity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?granularity=${g}`);
      const body = (await res.json()) as AdminPlatformStats & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Failed to load stats");
        setStats(null);
        return;
      }
      setStats(body);
    } catch {
      setError("Failed to load stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(granularity);
  }, [granularity, load]);

  const totals = stats?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Admin dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Platform revenue from completed deals and referral payouts.
          </p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
          {GRANULARITIES.map((g) => (
            <Button
              key={g.id}
              type="button"
              size="sm"
              variant={granularity === g.id ? "default" : "ghost"}
              className={cn(
                "rounded-md",
                granularity === g.id && "shadow-sm"
              )}
              onClick={() => setGranularity(g.id)}
            >
              {g.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Completed deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {loading ? "…" : (totals?.completed_deals ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Gross platform fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {loading ? "…" : formatPHP(totals?.gross_fees_centavos ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Referral rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {loading
                ? "…"
                : formatPHP(totals?.referral_rewards_centavos ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Net platform revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {loading ? "…" : formatPHP(totals?.net_revenue_centavos ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By period</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : !stats?.buckets.length ? (
            <p className="text-sm text-zinc-500">No data in this range.</p>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="pb-2 pr-4 font-medium">Period</th>
                  <th className="pb-2 pr-4 text-right font-medium">Deals</th>
                  <th className="pb-2 pr-4 text-right font-medium">Gross fees</th>
                  <th className="pb-2 pr-4 text-right font-medium">Referrals</th>
                  <th className="pb-2 text-right font-medium">Net revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {stats.buckets.map((row) => (
                  <tr key={row.period_start}>
                    <td className="py-2 pr-4">
                      {formatPeriod(row.period_start, granularity)}
                    </td>
                    <td className="py-2 pr-4 text-right">{row.completed_deals}</td>
                    <td className="py-2 pr-4 text-right">
                      {formatPHP(row.gross_fees_centavos)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {formatPHP(row.referral_rewards_centavos)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatPHP(row.net_revenue_centavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
