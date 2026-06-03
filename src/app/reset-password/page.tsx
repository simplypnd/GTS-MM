"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  authHashErrorMessage,
  clearAuthHashFromUrl,
  parseAuthHashErrors,
} from "@/lib/auth/hash-errors";
import { isRecoveryUser } from "@/lib/auth/recovery";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const hashErr = parseAuthHashErrors();
      if (hashErr) {
        await supabase.auth.signOut();
        setError(authHashErrorMessage(hashErr));
        setHasRecoverySession(false);
        clearAuthHashFromUrl();
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/reset-password");
        if (exchangeError) {
          setError(exchangeError.message);
          setHasRecoverySession(false);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && isRecoveryUser(user)) {
        setHasRecoverySession(true);
        return;
      }

      if (user && !isRecoveryUser(user)) {
        await supabase.auth.signOut();
      }
      setHasRecoverySession(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(true);
        return;
      }
      if (event === "SIGNED_OUT") {
        setHasRecoverySession(false);
        return;
      }
      if (session?.user && isRecoveryUser(session.user)) {
        setHasRecoverySession(true);
      }
    });

    void init();

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (hasRecoverySession === null) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="text-sm text-zinc-600">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasRecoverySession) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-sm text-zinc-600">
            This link is invalid or has expired. Request a new reset email.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block font-medium text-zinc-900"
          >
            Forgot password
          </Link>
          <p className="text-sm text-zinc-600">
            <Link href="/login" className="font-medium text-zinc-900">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-zinc-600">
            Set a new password to finish resetting your account.
          </p>
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
