import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveCounterpartyUserId } from "@/lib/users/resolveCounterparty";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier")?.trim() ?? "";

  if (!identifier) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  const service = await createServiceClient();
  const result = await resolveCounterpartyUserId(service, identifier);

  if ("error" in result) {
    return NextResponse.json({ found: false, error: result.error });
  }

  return NextResponse.json({
    found: true,
    display_name: result.displayName,
  });
}
