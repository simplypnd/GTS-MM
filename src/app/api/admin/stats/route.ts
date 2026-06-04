import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchAdminPlatformStats } from "@/lib/admin/stats";
import type { AdminStatsGranularity } from "@/lib/types/database";

function parseGranularity(value: string | null): AdminStatsGranularity {
  if (value === "week" || value === "month") return value;
  return "day";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
