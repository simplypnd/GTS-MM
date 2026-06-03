"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPasswordResetRedirectUrl } from "@/lib/config/site-url";
import {
  isRateLimitError,
  normalizeEmail,
  RATE_LIMIT_MESSAGE,
  validateEmail,
} from "@/lib/auth/validation";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSent(false);

    const normalized = normalizeEmail(email);
    const formatError = validateEmail(normalized);
    if (formatError) {
      setError(formatError);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      normalized,
      { redirectTo: getPasswordResetRedirectUrl() }
    );

    if (resetError) {
      setError(
        isRateLimitError(resetError.message)
          ? RATE_LIMIT_MESSAGE
          : resetError.message
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {linkError && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {linkError}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {sent && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              If an account exists for this email, we sent a reset link. Check
              your inbox and spam folder.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600">
          <Link href="/login" className="font-medium text-zinc-900">
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
