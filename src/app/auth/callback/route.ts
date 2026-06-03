import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isRecoveryUser } from "@/lib/auth/recovery";
import { getSiteUrl, resolveCallbackNext } from "@/lib/config/site-url";

function errorRedirect(origin: string, type: string | null) {
  if (type === "recovery") {
    return `${origin}/forgot-password?error=${encodeURIComponent("This reset link is invalid or has expired. Request a new one.")}`;
  }
  return `${origin}/login?error=auth_callback_failed`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const origin = getSiteUrl();

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(errorRedirect(origin, type));
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const next =
      type === "recovery" || isRecoveryUser(user)
        ? "/reset-password"
        : resolveCallbackNext(searchParams.get("next"), type);
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (error) {
      return NextResponse.redirect(errorRedirect(origin, type));
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const next =
      type === "recovery" || isRecoveryUser(user)
        ? "/reset-password"
        : resolveCallbackNext(searchParams.get("next"), type);
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(errorRedirect(origin, type));
}
