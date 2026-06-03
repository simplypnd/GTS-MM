import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, resolveCallbackNext } from "@/lib/config/site-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = resolveCallbackNext(searchParams.get("next"));
  const origin = getSiteUrl();

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
