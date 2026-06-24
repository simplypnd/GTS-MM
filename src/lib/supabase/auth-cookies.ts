import { NextResponse, type NextRequest } from "next/server";

const COOKIE_HEADER_LIMIT = 6144;

/** Supabase SSR auth cookies: sb-<project-ref>-auth-token[.N] */
export function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith("sb-");
}

export function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => isSupabaseAuthCookie(c.name));
}

export function clearSupabaseAuthCookies(
  response: NextResponse,
  request: NextRequest
): void {
  const isProduction = process.env.NODE_ENV === "production";
  for (const { name } of request.cookies.getAll()) {
    if (!isSupabaseAuthCookie(name)) continue;
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    });
  }
}

export function copyCookies(
  source: NextResponse,
  target: NextResponse
): void {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie.name, cookie.value, cookie);
  }
}

export function redirectWithSessionCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
  searchParams?: Record<string, string>
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  const redirect = NextResponse.redirect(url);
  copyCookies(supabaseResponse, redirect);
  return redirect;
}

export function redirectToClearSession(
  request: NextRequest,
  redirectPath: string
): NextResponse {
  const url = new URL("/api/auth/clear-session", request.url);
  url.searchParams.set("redirect", redirectPath);
  return NextResponse.redirect(url);
}

export function shouldRedirectForOversizedCookies(
  request: NextRequest
): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader.length > COOKIE_HEADER_LIMIT && hasSupabaseAuthCookies(request);
}

export function safeRedirectTarget(target: string | null): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/";
  }
  return target;
}
