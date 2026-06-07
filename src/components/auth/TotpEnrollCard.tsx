"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearUnverifiedTotpFactors } from "@/lib/auth/mfa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MfaVerifyForm } from "@/components/auth/MfaVerifyForm";

export function TotpEnrollCard({
  adminRequired,
  onEnrolled,
}: {
  adminRequired?: boolean;
  onEnrolled?: () => void;
}) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const startEnroll = useCallback(async () => {
    setEnrolling(true);
    setError(null);
    setFactorId(null);
    setQrCode(null);
    setSecret(null);

    const supabase = createClient();
    await clearUnverifiedTotpFactors(supabase);

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    });
    if (enrollError || !data) {
      setError(enrollError?.message ?? "Failed to start enrollment");
      setEnrolling(false);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(false);
  }, []);

  useEffect(() => {
    void startEnroll();
  }, [startEnroll]);

  async function verifyEnrollment(code: string) {
    if (!factorId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
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
    setLoading(false);
    onEnrolled?.();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {adminRequired ? "Set up 2FA (required for admin)" : "Enable authenticator app"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {adminRequired && (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Administrators must use Google Authenticator (or any TOTP app) before
            accessing the admin panel.
          </p>
        )}
        {enrolling && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Preparing QR code…</p>
        )}
        {qrCode && (
          <div
            className="mx-auto w-fit rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
        )}
        {secret && (
          <p className="break-all text-xs font-mono text-zinc-500 dark:text-zinc-400">
            Manual key: {secret}
          </p>
        )}
        {factorId && (
          <MfaVerifyForm
            onVerify={verifyEnrollment}
            loading={loading}
            error={error}
          />
        )}
        {!factorId && !enrolling && error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {!factorId && !enrolling && (
          <Button
            type="button"
            disabled={enrolling}
            onClick={() => void startEnroll()}
          >
            Retry setup
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export async function listVerifiedTotpFactors() {
  const supabase = createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp?.filter((f) => f.status === "verified") ?? [];
}

export function useTotpFactors() {
  const [factors, setFactors] = useState<
    Array<{ id: string; friendly_name?: string; status: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp?.filter((f) => f.status === "verified") ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { factors, loading, reload };
}

export async function unenrollTotpFactor(factorId: string) {
  const supabase = createClient();
  return supabase.auth.mfa.unenroll({ factorId });
}
