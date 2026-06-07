"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MfaVerifyForm } from "@/components/auth/MfaVerifyForm";
import { getVerifiedTotpFactorId } from "@/lib/auth/mfa";

function MfaLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(code: string) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factorId = getVerifiedTotpFactorId(factors);
    if (!factorId) {
      setError("No authenticator enrolled.");
      setLoading(false);
      return;
    }
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Challenge failed");
      setLoading(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }
    router.push(next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the 6-digit code from your authenticator app.
        </p>
        <MfaVerifyForm onVerify={handleVerify} loading={loading} error={error} />
      </CardContent>
    </Card>
  );
}

export default function MfaLoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-zinc-500">Loading…</p>}>
      <MfaLoginContent />
    </Suspense>
  );
}
