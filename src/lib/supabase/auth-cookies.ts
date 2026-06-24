import { NextResponse, type NextRequest } from "next/server";

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
  for (const { name } of request.cookies.getAll()) {
    if (!isSupabaseAuthCookie(name)) continue;
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
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
