import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  clearSupabaseAuthCookies,
  redirectToClearSession,
} from "@/lib/supabase/auth-cookies";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    const pathname = request.nextUrl.pathname;
    const redirectPath =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/deals") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/withdraw")
        ? "/login?session=expired"
        : pathname || "/";
    const response = redirectToClearSession(request, redirectPath);
    clearSupabaseAuthCookies(response, request);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
