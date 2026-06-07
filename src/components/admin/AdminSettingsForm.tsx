"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformSettings } from "@/lib/types/database";

export function AdminSettingsForm() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [platformPct, setPlatformPct] = useState("");
  const [referralPct, setReferralPct] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const body = (await res.json()) as PlatformSettings & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Failed to load");
        return;
      }
      setSettings(body);
      setPlatformPct(String(body.platform_fee_bps / 100));
      setReferralPct(String(body.referral_reward_bps / 100));
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const platformBps = Math.round(parseFloat(platformPct) * 100);
    const referralBps = Math.round(parseFloat(referralPct) * 100);
    if (
      !Number.isFinite(platformBps) ||
      !Number.isFinite(referralBps) ||
      platformBps < 0 ||
      platformBps > 10000 ||
      referralBps < 0 ||
      referralBps > 10000
    ) {
      setError("Enter valid percentages (0–100).");
      setSaving(false);
      return;
    }
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform_fee_bps: platformBps,
        referral_reward_bps: referralBps,
      }),
    });
    const body = (await res.json()) as PlatformSettings & { error?: string };
    if (!res.ok) {
      setError(body.error ?? "Save failed");
    } else {
      setSettings(body);
      setMessage("Settings saved.");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading settings…</p>;
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Platform fees</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="platform-fee">Platform fee (%)</Label>
            <Input
              id="platform-fee"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={platformPct}
              onChange={(e) => setPlatformPct(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              Applied to new deals. Current: {settings?.platform_fee_bps ?? "—"} bps
            </p>
          </div>
          <div>
            <Label htmlFor="referral-reward">Default referral reward (%)</Label>
            <Input
              id="referral-reward"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={referralPct}
              onChange={(e) => setReferralPct(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">
              Override per user on Users tab. Current:{" "}
              {settings?.referral_reward_bps ?? "—"} bps
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {message && (
            <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
