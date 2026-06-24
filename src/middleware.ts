import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  CLEAR_SESSION_LOGIN_REDIRECT,
  clearSupabaseAuthCookies,
  redirectToClearSession,
} from "@/lib/supabase/auth-cookies";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/deals",
  "/disputes",
  "/settings",
  "/withdraw",
  "/referrals",
  "/admin",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    const pathname = request.nextUrl.pathname;
    if (isProtectedPath(pathname)) {
      const response = redirectToClearSession(
        request,
        CLEAR_SESSION_LOGIN_REDIRECT
      );
      clearSupabaseAuthCookies(response, request);
      return response;
    }
    const response = NextResponse.next({ request });
    clearSupabaseAuthCookies(response, request);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
