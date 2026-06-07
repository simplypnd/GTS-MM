import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, adminAuthResponse } from "@/lib/admin/auth";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/lib/admin/platformSettings";

function parseBps(value: unknown, label: string): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const bps = Math.round(value);
  if (bps < 0 || bps > 10000) return null;
  return bps;
}

export async function GET() {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    const res = adminAuthResponse(e);
    if (res) return res;
    throw e;
  }

  try {
    const service = await createServiceClient();
    const settings = await getPlatformSettings(service);
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    const res = adminAuthResponse(e);
    if (res) return res;
    throw e;
  }

  const body = (await request.json()) as {
    platform_fee_bps?: unknown;
    referral_reward_bps?: unknown;
  };

  const patch: {
    platform_fee_bps?: number;
    referral_reward_bps?: number;
  } = {};

  if (body.platform_fee_bps !== undefined) {
    const bps = parseBps(body.platform_fee_bps, "platform_fee_bps");
    if (bps === null) {
      return NextResponse.json(
        { error: "platform_fee_bps must be 0–10000" },
        { status: 400 }
      );
    }
    patch.platform_fee_bps = bps;
  }

  if (body.referral_reward_bps !== undefined) {
    const bps = parseBps(body.referral_reward_bps, "referral_reward_bps");
    if (bps === null) {
      return NextResponse.json(
        { error: "referral_reward_bps must be 0–10000" },
        { status: 400 }
      );
    }
    patch.referral_reward_bps = bps;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  try {
    const service = await createServiceClient();
    const settings = await updatePlatformSettings(service, patch);
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
