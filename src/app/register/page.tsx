"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthCallbackUrl } from "@/lib/config/site-url";
import {
  fetchEmailAvailability,
  fetchUsernameAvailability,
  type AvailabilityStatus,
} from "@/lib/auth/availability";
import {
  isRateLimitError,
  normalizeEmail,
  normalizeUsername,
  RATE_LIMIT_MESSAGE,
  validateEmail,
  validateUsername,
} from "@/lib/auth/validation";

function statusMessage(
  status: AvailabilityStatus,
  takenLabel: string
): string | null {
  switch (status) {
    case "checking":
      return "Checking…";
    case "available":
      return "Available";
    case "taken":
      return takenLabel;
    case "invalid":
      return null;
    default:
      return null;
  }
}

function statusClass(status: AvailabilityStatus): string {
  if (status === "available") return "text-emerald-700";
  if (status === "taken" || status === "invalid") return "text-red-600";
  if (status === "checking") return "text-zinc-500";
  return "";
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmailBanner, setCheckEmailBanner] = useState(false);
  const [usernameStatus, setUsernameStatus] =
    useState<AvailabilityStatus>("idle");
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>("idle");

  const runUsernameCheck = useCallback(async (value: string) => {
    const formatError = validateUsername(value);
    if (formatError) {
      setUsernameStatus(value.trim() ? "invalid" : "idle");
      return false;
    }
    setUsernameStatus("checking");
    const { available, error: apiError } = await fetchUsernameAvailability(
      normalizeUsername(value)
    );
    if (apiError) {
      setUsernameStatus("invalid");
      return false;
    }
    setUsernameStatus(available ? "available" : "taken");
    return available;
  }, []);

  const runEmailCheck = useCallback(async (value: string) => {
    const formatError = validateEmail(value);
    if (formatError) {
      setEmailStatus(value.trim() ? "invalid" : "idle");
      return false;
    }
    setEmailStatus("checking");
    const { available, error: apiError } = await fetchEmailAvailability(
      normalizeEmail(value)
    );
    if (apiError) {
      setEmailStatus("invalid");
      return false;
    }
    setEmailStatus(available ? "available" : "taken");
    return available;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (username.trim()) runUsernameCheck(username);
      else setUsernameStatus("idle");
    }, 500);
    return () => clearTimeout(t);
  }, [username, runUsernameCheck]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (email.trim()) runEmailCheck(email);
      else setEmailStatus("idle");
    }, 500);
    return () => clearTimeout(t);
  }, [email, runEmailCheck]);

  const checksPending =
    usernameStatus === "checking" || emailStatus === "checking";
  const canSubmit =
    !checksPending &&
    usernameStatus === "available" &&
    emailStatus === "available";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCheckEmailBanner(false);

    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = normalizeEmail(email);

    const usernameFormat = validateUsername(normalizedUsername);
    const emailFormat = validateEmail(normalizedEmail);
    if (usernameFormat || emailFormat) {
      setError(usernameFormat ?? emailFormat);
      setLoading(false);
      return;
    }

    const [usernameOk, emailOk] = await Promise.all([
      runUsernameCheck(normalizedUsername),
      runEmailCheck(normalizedEmail),
    ]);

    if (!usernameOk || !emailOk) {
      setError(
        !usernameOk
          ? "Username is already taken"
          : "An account with this email already exists"
      );
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { display_name: normalizedUsername },
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });

    if (authError) {
      const msg = authError.message;
      if (isRateLimitError(msg)) {
        setError(RATE_LIMIT_MESSAGE);
      } else if (/already registered|already exists/i.test(msg)) {
        setError("An account with this email already exists");
      } else if (/duplicate|unique|23505/i.test(msg)) {
        setError("Username is already taken");
      } else {
        setError(msg);
      }
      setLoading(false);
      return;
    }

    if (!data.session) {
      setCheckEmailBanner(true);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => username.trim() && runUsernameCheck(username)}
              required
              autoComplete="username"
            />
            {usernameStatus !== "idle" && (
              <p
                className={`mt-1 text-sm ${statusClass(usernameStatus)}`}
              >
                {validateUsername(username) ??
                  statusMessage(usernameStatus, "Username is taken")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => email.trim() && runEmailCheck(email)}
              required
              autoComplete="email"
            />
            {emailStatus !== "idle" && (
              <p className={`mt-1 text-sm ${statusClass(emailStatus)}`}>
                {validateEmail(email) ??
                  statusMessage(emailStatus, "Email is already registered")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
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
          <p className="text-sm text-zinc-600">
            You&apos;ll choose buyer or seller when creating a deal.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {checkEmailBanner && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              Check your email to confirm your account. After confirming, you
              will be redirected to the dashboard.
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !canSubmit}
          >
            {loading ? "Creating…" : "Register"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
