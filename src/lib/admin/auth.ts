import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { assertAal2 } from "@/lib/auth/mfa";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<{ user: User; isAdmin: true }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AdminAuthError("Unauthorized", 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new AdminAuthError("Forbidden", 403);
  }

  await assertAal2(supabase);

  return { user, isAdmin: true };
}

export function adminAuthResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.message === "MFA required") {
    return NextResponse.json({ error: "MFA required" }, { status: 403 });
  }
  return null;
}
