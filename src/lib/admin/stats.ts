import type { createServiceClient } from "@/lib/supabase/server";
import type { AdminPlatformStats, AdminStatsGranularity } from "@/lib/types/database";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

const BUCKET_COUNTS: Record<AdminStatsGranularity, number> = {
  day: 30,
  week: 12,
  month: 12,
};

function normalizeRpcResult(raw: unknown): AdminPlatformStats {
  const data = raw as {
    totals?: Record<string, number>;
    buckets?: Array<Record<string, unknown>>;
  };
  const totals = data?.totals ?? {};
  const buckets = (data?.buckets ?? []).map((b) => ({
    period_start: String(b.period_start ?? ""),
    completed_deals: Number(b.completed_deals ?? 0),
    gross_fees_centavos: Number(b.gross_fees_centavos ?? 0),
    referral_rewards_centavos: Number(b.referral_rewards_centavos ?? 0),
    net_revenue_centavos: Number(b.net_revenue_centavos ?? 0),
  }));
  return {
    totals: {
      completed_deals: Number(totals.completed_deals ?? 0),
      gross_fees_centavos: Number(totals.gross_fees_centavos ?? 0),
      referral_rewards_centavos: Number(totals.referral_rewards_centavos ?? 0),
      net_revenue_centavos: Number(totals.net_revenue_centavos ?? 0),
    },
    buckets,
  };
}

export async function fetchAdminPlatformStats(
  supabase: Supabase,
  granularity: AdminStatsGranularity
): Promise<AdminPlatformStats> {
  const { data, error } = await supabase.rpc("get_admin_platform_stats", {
    p_granularity: granularity,
    p_bucket_count: BUCKET_COUNTS[granularity],
  });

  if (error) throw error;
  return normalizeRpcResult(data);
}
