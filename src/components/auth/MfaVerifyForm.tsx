"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MfaVerifyForm({
  onVerify,
  loading,
  error,
}: {
  onVerify: (code: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}) {
  const [code, setCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onVerify(code.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="mfa-code">Authenticator code</Label>
        <Input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          className="font-mono tracking-widest"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
        {loading ? "Verifying…" : "Verify"}
      </Button>
    </form>
  );
}
