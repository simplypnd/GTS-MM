import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, adminAuthResponse } from "@/lib/admin/auth";
import type { AdminUserSummary } from "@/lib/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    const res = adminAuthResponse(e);
    if (res) return res;
    throw e;
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ users: [] });
  }

  try {
    const service = await createServiceClient();
    const { data, error } = await service.rpc("admin_search_users", {
      p_query: q,
      p_limit: 20,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (Array.isArray(data) ? data : []) as AdminUserSummary[];
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
