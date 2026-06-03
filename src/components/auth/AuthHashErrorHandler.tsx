"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  authHashErrorMessage,
  clearAuthHashFromUrl,
  parseAuthHashErrors,
} from "@/lib/auth/hash-errors";

/**
 * Supabase puts OTP failures in the URL hash; the server never sees them.
 * Sign out and send the user to request a fresh link.
 */
export function AuthHashErrorHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const parsed = parseAuthHashErrors();
    if (!parsed) return;

    const message = authHashErrorMessage(parsed);
    const supabase = createClient();

    void (async () => {
      await supabase.auth.signOut();
      clearAuthHashFromUrl();

      const target =
        parsed.errorCode === "otp_expired" ||
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/auth/callback")
          ? `/forgot-password?error=${encodeURIComponent(message)}`
          : `/login?error=${encodeURIComponent(message)}`;

      router.replace(target);
    })();
  }, [pathname, router]);

  return null;
}
