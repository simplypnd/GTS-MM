import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { clearSupabaseAuthCookies } from "@/lib/supabase/auth-cookies";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    const response = NextResponse.redirect(
      new URL("/login?session=expired", request.url)
    );
    clearSupabaseAuthCookies(response, request);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
