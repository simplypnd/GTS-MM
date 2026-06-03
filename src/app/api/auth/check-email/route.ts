import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { findAuthUserByEmail } from "@/lib/auth/admin";
import { normalizeEmail, validateEmail } from "@/lib/auth/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "";

  const formatError = validateEmail(email);
  if (formatError) {
    return NextResponse.json(
      { available: false, error: formatError },
      { status: 400 }
    );
  }

  const normalized = normalizeEmail(email);
  const service = await createServiceClient();

  try {
    const user = await findAuthUserByEmail(service, normalized);
    return NextResponse.json({ available: !user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
