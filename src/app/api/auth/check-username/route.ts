import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  normalizeUsername,
  validateUsername,
} from "@/lib/auth/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username") ?? "";

  const formatError = validateUsername(username);
  if (formatError) {
    return NextResponse.json(
      { available: false, error: formatError },
      { status: 400 }
    );
  }

  const normalized = normalizeUsername(username);
  const service = await createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("id")
    .ilike("display_name", normalized)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ available: !data?.length });
}
