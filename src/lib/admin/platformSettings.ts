import { PLATFORM_FEE_BPS } from "@/lib/escrow/dealState";
import type { PlatformSettings } from "@/lib/types/database";
import type { createServiceClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createServiceClient>>;

const DEFAULT_REFERRAL_REWARD_BPS = 50;

const DEFAULT_SETTINGS: PlatformSettings = {
  id: 1,
  platform_fee_bps: PLATFORM_FEE_BPS,
  referral_reward_bps: DEFAULT_REFERRAL_REWARD_BPS,
  updated_at: new Date().toISOString(),
};

export async function getPlatformSettings(
  supabase: Supabase
): Promise<PlatformSettings> {
  const { data, error } = await supabase.rpc("get_platform_settings");
  if (error || !data || typeof data !== "object") {
    return DEFAULT_SETTINGS;
  }
  const row = data as Record<string, unknown>;
  return {
    id: 1,
    platform_fee_bps:
      typeof row.platform_fee_bps === "number"
        ? row.platform_fee_bps
        : DEFAULT_SETTINGS.platform_fee_bps,
    referral_reward_bps:
      typeof row.referral_reward_bps === "number"
        ? row.referral_reward_bps
        : DEFAULT_SETTINGS.referral_reward_bps,
    updated_at:
      typeof row.updated_at === "string"
        ? row.updated_at
        : DEFAULT_SETTINGS.updated_at,
  };
}

export async function updatePlatformSettings(
  supabase: Supabase,
  patch: {
    platform_fee_bps?: number;
    referral_reward_bps?: number;
  }
): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from("platform_settings")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select("id, platform_fee_bps, referral_reward_bps, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update platform settings");
  }

  return data as PlatformSettings;
}
