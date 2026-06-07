"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TotpEnrollCard,
  unenrollTotpFactor,
  useTotpFactors,
} from "@/components/auth/TotpEnrollCard";

function SecuritySettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminRequired = searchParams.get("admin_required") === "1";
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const { factors, loading, reload } = useTotpFactors();

  const loadAdmin = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    setIsAdmin(!!data?.is_admin);
  }, []);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  async function handleUnenroll(factorId: string) {
    if (isAdmin) return;
    await unenrollTotpFactor(factorId);
    await reload();
  }

  function onEnrolled() {
    setShowEnroll(false);
    void reload();
    if (adminRequired) {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Security
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Optional two-factor authentication with Google Authenticator or any TOTP
          app.
          {isAdmin && " Required for admin access."}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : factors.length > 0 && !showEnroll ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Authenticator app</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-green-700 dark:text-green-400">
              Two-factor authentication is enabled.
            </p>
            {factors.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{f.friendly_name ?? "Authenticator"}</span>
                {!isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleUnenroll(f.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {isAdmin && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Admins cannot remove 2FA while they have admin access.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <TotpEnrollCard adminRequired={adminRequired || isAdmin} onEnrolled={onEnrolled} />
      )}

      {factors.length > 0 && !showEnroll && !isAdmin && (
        <Button type="button" variant="outline" onClick={() => setShowEnroll(true)}>
          Add another device
        </Button>
      )}
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <SecuritySettingsContent />
    </Suspense>
  );
}
