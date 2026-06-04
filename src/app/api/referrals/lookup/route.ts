import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("display_name")
    .ilike("referral_code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ found: false }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    display_name: data.display_name,
  });
}
