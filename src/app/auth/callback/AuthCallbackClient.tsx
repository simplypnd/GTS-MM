"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isRecoveryUser } from "@/lib/auth/recovery";
import { resolveCallbackNext } from "@/lib/config/site-url";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const nextParam = searchParams.get("next");

    async function finish() {
      const supabase = createClient();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          const dest =
            type === "recovery"
              ? `/forgot-password?error=${encodeURIComponent(error.message)}`
              : `/login?error=${encodeURIComponent(error.message)}`;
          router.replace(dest);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const path =
          type === "recovery" || isRecoveryUser(user)
            ? "/reset-password"
            : resolveCallbackNext(nextParam, type);

        router.replace(path);
        router.refresh();
        return;
      }

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as EmailOtpType,
        });
        if (error) {
          const dest =
            type === "recovery"
              ? `/forgot-password?error=${encodeURIComponent(error.message)}`
              : `/login?error=${encodeURIComponent(error.message)}`;
          router.replace(dest);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const path =
          type === "recovery" || isRecoveryUser(user)
            ? "/reset-password"
            : resolveCallbackNext(nextParam, type);

        router.replace(path);
        router.refresh();
        return;
      }

      router.replace("/login?error=auth_callback_failed");
    }

    void finish();
  }, [router, searchParams]);

  return (
    <p className="text-center text-sm text-zinc-600" role="status">
      Completing sign in…
    </p>
  );
}
