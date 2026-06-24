import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRecoveryUser } from "@/lib/auth/recovery";
import { getMfaState, userHasVerifiedTotpFactor } from "@/lib/auth/mfa";
import {
  CLEAR_SESSION_LOGIN_REDIRECT,
  clearSupabaseAuthCookies,
  copyCookies,
  hasSessionClearedFlag,
  hasSupabaseAuthCookies,
  appendSessionClearedFlag,
  redirectToClearSession,
  redirectWithSessionCookies,
  safeRedirectTarget,
  shouldRedirectForOversizedCookies,
} from "@/lib/supabase/auth-cookies";

const MFA_ALLOWLIST_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/account-blocked",
  "/settings",
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

const AUTH_INLINE_CLEAR_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/api/auth/signout",
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

function isAuthInlineClearPath(pathname: string): boolean {
  return pathMatches(pathname, AUTH_INLINE_CLEAR_PREFIXES);
}

function shouldClearInline(
  request: NextRequest,
  pathname: string
): boolean {
  return (
    hasSessionClearedFlag(request) ||
    isAuthInlineClearPath(pathname) ||
    !isProtectedPath(pathname)
  );
}

function inlineClearAndContinue(
  request: NextRequest,
  supabaseResponse: NextResponse
): NextResponse {
  const response = NextResponse.next({ request });
  copyCookies(supabaseResponse, response);
  clearSupabaseAuthCookies(response, request);
  return response;
}

function redirectToProtectedClearSession(
  request: NextRequest,
  supabaseResponse?: NextResponse
): NextResponse {
  const url = new URL("/api/auth/clear-session", request.url);
  url.searchParams.set("redirect", CLEAR_SESSION_LOGIN_REDIRECT);
  const redirect = NextResponse.redirect(url);
  if (supabaseResponse) {
    copyCookies(supabaseResponse, redirect);
  }
  clearSupabaseAuthCookies(redirect, request);
  return redirect;
}

function handleInvalidSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string
): NextResponse {
  if (shouldClearInline(request, pathname)) {
    return inlineClearAndContinue(request, supabaseResponse);
  }
  return redirectToProtectedClearSession(request, supabaseResponse);
}

async function handleClearSessionRequest(
  request: NextRequest
): Promise<NextResponse> {
  const target = appendSessionClearedFlag(
    safeRedirectTarget(request.nextUrl.searchParams.get("redirect"))
  );
  let response = NextResponse.redirect(new URL(target, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    await supabase.auth.signOut();
  } catch {
    clearSupabaseAuthCookies(response, request);
  }

  return response;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  try {
    if (pathname === "/api/auth/clear-session") {
      return handleClearSessionRequest(request);
    }

    if (shouldRedirectForOversizedCookies(request)) {
      return redirectToClearSession(request, CLEAR_SESSION_LOGIN_REDIRECT);
    }

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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return handleInvalidSession(request, supabaseResponse, pathname);
    }

    if (!user && hasSupabaseAuthCookies(request)) {
      if (shouldClearInline(request, pathname)) {
        clearSupabaseAuthCookies(supabaseResponse, request);
      } else {
        return redirectToProtectedClearSession(request, supabaseResponse);
      }
    }

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
        const redirect = NextResponse.redirect(url);
        copyCookies(supabaseResponse, redirect);
        return redirect;
      }
      return supabaseResponse;
    }

    if (!user && isProtectedPath(pathname)) {
      return redirectWithSessionCookies(request, supabaseResponse, "/login");
    }

    if (user && isAuth && !pathname.startsWith("/login/mfa")) {
      return redirectWithSessionCookies(request, supabaseResponse, "/dashboard");
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
        return redirectWithSessionCookies(
          request,
          supabaseResponse,
          "/account-blocked"
        );
      }

      if (pathname.startsWith("/disputes") && !profile?.is_mediator) {
        return redirectWithSessionCookies(request, supabaseResponse, "/dashboard");
      }

      const mfaState = await getMfaState(supabase);
      const isAdmin = !!profile?.is_admin;

      if (pathname.startsWith("/admin")) {
        if (!isAdmin) {
          return redirectWithSessionCookies(
            request,
            supabaseResponse,
            "/dashboard"
          );
        }

        const hasTotp = await userHasVerifiedTotpFactor(supabase);
        if (!hasTotp) {
          return redirectWithSessionCookies(
            request,
            supabaseResponse,
            "/settings",
            { tab: "security", admin_required: "1" }
          );
        }

        if (mfaState.currentLevel !== "aal2") {
          const url = request.nextUrl.clone();
          url.pathname = "/login/mfa";
          url.searchParams.set("next", pathname);
          const redirect = NextResponse.redirect(url);
          copyCookies(supabaseResponse, redirect);
          return redirect;
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
        const redirect = NextResponse.redirect(url);
        copyCookies(supabaseResponse, redirect);
        return redirect;
      }
    }

    return supabaseResponse;
  } catch {
    if (shouldClearInline(request, pathname)) {
      const response = NextResponse.next({ request });
      clearSupabaseAuthCookies(response, request);
      return response;
    }
    return redirectToProtectedClearSession(request);
  }
}
