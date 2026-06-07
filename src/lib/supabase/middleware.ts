import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRecoveryUser } from "@/lib/auth/recovery";
import { getMfaState, userHasVerifiedTotpFactor } from "@/lib/auth/mfa";

const MFA_ALLOWLIST_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/account-blocked",
  "/settings/security",
  "/api/auth/signout",
];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/deals",
  "/disputes",
  "/settings",
  "/withdraw",
  "/referrals",
  "/admin",
];

function pathMatches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isMfaAllowlisted(pathname: string): boolean {
  if (pathMatches(pathname, MFA_ALLOWLIST_PREFIXES)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  return false;
}

function isProtectedPath(pathname: string): boolean {
  return pathMatches(pathname, PROTECTED_PREFIXES);
}

export async function updateSession(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  if (code || token_hash) {
    const url = request.nextUrl.clone();
    if (request.nextUrl.pathname.startsWith("/reset-password")) {
      return NextResponse.next({ request });
    }
    if (!request.nextUrl.pathname.startsWith("/auth/callback")) {
      url.pathname = "/auth/callback";
      return NextResponse.redirect(url);
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuth =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  if (user && isRecoveryUser(user)) {
    if (!pathname.startsWith("/reset-password")) {
      const url = request.nextUrl.clone();
      url.pathname = "/reset-password";
      url.search = "";
      url.hash = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuth && !pathname.startsWith("/login/mfa")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_mediator, is_admin, account_status")
      .eq("id", user.id)
      .single();

    if (
      profile?.account_status === "blocked" &&
      !pathname.startsWith("/account-blocked") &&
      !pathname.startsWith("/api/auth/signout")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/account-blocked";
      return NextResponse.redirect(url);
    }

    if (user && pathname.startsWith("/disputes") && !profile?.is_mediator) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    const mfaState = await getMfaState(supabase);
    const isAdmin = !!profile?.is_admin;

    if (pathname.startsWith("/admin")) {
      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      const hasTotp = await userHasVerifiedTotpFactor(supabase);
      if (!hasTotp) {
        const url = request.nextUrl.clone();
        url.pathname = "/settings/security";
        url.searchParams.set("admin_required", "1");
        return NextResponse.redirect(url);
      }

      if (mfaState.currentLevel !== "aal2") {
        const url = request.nextUrl.clone();
        url.pathname = "/login/mfa";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }

    if (
      isProtectedPath(pathname) &&
      !isMfaAllowlisted(pathname) &&
      mfaState.needsVerification
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/mfa";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
