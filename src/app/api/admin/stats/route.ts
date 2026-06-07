import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, adminAuthResponse } from "@/lib/admin/auth";
import { fetchAdminPlatformStats } from "@/lib/admin/stats";
import type { AdminStatsGranularity } from "@/lib/types/database";

function parseGranularity(value: string | null): AdminStatsGranularity {
  if (value === "week" || value === "month") return value;
  return "day";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    const res = adminAuthResponse(e);
    if (res) return res;
    throw e;
  }

  const granularity = parseGranularity(
    new URL(request.url).searchParams.get("granularity")
  );

  try {
    const service = await createServiceClient();
    const stats = await fetchAdminPlatformStats(service, granularity);
    return NextResponse.json({ granularity, ...stats });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}
