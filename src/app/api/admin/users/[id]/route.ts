import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, adminAuthResponse } from "@/lib/admin/auth";
import type { AccountStatus } from "@/lib/types/database";

const VALID_STATUS = new Set<AccountStatus>(["active", "suspended", "blocked"]);

function parseBps(value: unknown): number | null | "invalid" {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return "invalid";
  const bps = Math.round(value);
  if (bps < 0 || bps > 10000) return "invalid";
  return bps;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params;
  const supabase = await createClient();
  let adminUser;
  try {
    ({ user: adminUser } = await requireAdmin(supabase));
  } catch (e) {
    const res = adminAuthResponse(e);
    if (res) return res;
    throw e;
  }

  if (targetId === adminUser.id) {
    return NextResponse.json(
      { error: "Cannot modify your own moderation settings" },
      { status: 400 }
    );
  }

  const body = (await request.json()) as {
    account_status?: unknown;
    funds_frozen?: unknown;
    referral_reward_bps?: unknown;
  };

  const service = await createServiceClient();

  const { data: target } = await service
    .from("profiles")
    .select("is_admin")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.is_admin) {
    return NextResponse.json(
      { error: "Cannot modify another administrator" },
      { status: 400 }
    );
  }

  const patch: {
    account_status?: AccountStatus;
    funds_frozen?: boolean;
    referral_reward_bps?: number | null;
  } = {};

  if (body.account_status !== undefined) {
    if (
      typeof body.account_status !== "string" ||
      !VALID_STATUS.has(body.account_status as AccountStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid account_status" },
        { status: 400 }
      );
    }
    patch.account_status = body.account_status as AccountStatus;
  }

  if (body.funds_frozen !== undefined) {
    if (typeof body.funds_frozen !== "boolean") {
      return NextResponse.json(
        { error: "funds_frozen must be boolean" },
        { status: 400 }
      );
    }
    patch.funds_frozen = body.funds_frozen;
  }

  if (body.referral_reward_bps !== undefined) {
    const bps = parseBps(body.referral_reward_bps);
    if (bps === "invalid") {
      return NextResponse.json(
        { error: "referral_reward_bps must be 0–10000 or null" },
        { status: 400 }
      );
    }
    patch.referral_reward_bps = bps;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await service
    .from("profiles")
    .update(patch)
    .eq("id", targetId)
    .select(
      "id, display_name, balance_centavos, account_status, funds_frozen, referral_reward_bps, referral_code, is_admin, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
