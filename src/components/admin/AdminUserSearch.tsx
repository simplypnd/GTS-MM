"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPHP } from "@/lib/utils";
import type { AccountStatus, AdminUserSummary } from "@/lib/types/database";

function statusVariant(status: AccountStatus) {
  if (status === "blocked") return "danger" as const;
  if (status === "suspended") return "warning" as const;
  return "default" as const;
}

function UserModerationPanel({
  user,
  onSaved,
}: {
  user: AdminUserSummary;
  onSaved: (u: AdminUserSummary) => void;
}) {
  const [accountStatus, setAccountStatus] = useState<AccountStatus>(
    user.account_status
  );
  const [fundsFrozen, setFundsFrozen] = useState(user.funds_frozen);
  const [referralPct, setReferralPct] = useState(
    user.referral_reward_bps != null
      ? String(user.referral_reward_bps / 100)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAccountStatus(user.account_status);
    setFundsFrozen(user.funds_frozen);
    setReferralPct(
      user.referral_reward_bps != null
        ? String(user.referral_reward_bps / 100)
        : ""
    );
  }, [user]);

  async function save() {
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {
      account_status: accountStatus,
      funds_frozen: fundsFrozen,
    };
    if (referralPct.trim() === "") {
      body.referral_reward_bps = null;
    } else {
      const bps = Math.round(parseFloat(referralPct) * 100);
      if (!Number.isFinite(bps) || bps < 0 || bps > 10000) {
        setError("Invalid referral %");
        setSaving(false);
        return;
      }
      body.referral_reward_bps = bps;
    }
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { user?: AdminUserSummary; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Save failed");
    } else if (data.user) {
      onSaved(data.user);
    }
    setSaving(false);
  }

  if (user.is_admin) {
    return (
      <p className="text-sm text-zinc-500">Administrator accounts cannot be edited here.</p>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <div>
        <Label htmlFor={`status-${user.id}`}>Account status</Label>
        <select
          id={`status-${user.id}`}
          className="mt-1 flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          value={accountStatus}
          onChange={(e) => setAccountStatus(e.target.value as AccountStatus)}
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={fundsFrozen}
          onChange={(e) => setFundsFrozen(e.target.checked)}
        />
        Freeze funds (block withdrawals and balance spending)
      </label>
      <div>
        <Label htmlFor={`ref-${user.id}`}>Referral reward override (%)</Label>
        <Input
          id={`ref-${user.id}`}
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="Global default"
          value={referralPct}
          onChange={(e) => setReferralPct(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

export function AdminUserSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const search = useCallback(async (q: string) => {
    if (!q) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
      const body = (await res.json()) as {
        users?: AdminUserSummary[];
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "Search failed");
        setUsers([]);
      } else {
        setUsers(body.users ?? []);
      }
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void search(debounced);
  }, [debounced, search]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="user-search">Search users</Label>
        <Input
          id="user-search"
          placeholder="Username, referral code, or user ID prefix"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 max-w-md"
        />
      </div>
      {loading && <p className="text-sm text-zinc-500">Searching…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id}>
            <Card>
              <CardHeader className="pb-2">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() =>
                    setExpandedId((id) => (id === u.id ? null : u.id))
                  }
                >
                  <div>
                    <CardTitle className="text-base">{u.display_name}</CardTitle>
                    <p className="text-xs text-zinc-500 font-mono">{u.id}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge variant={statusVariant(u.account_status)}>
                      {u.account_status}
                    </Badge>
                    {u.funds_frozen && (
                      <Badge variant="info">Frozen</Badge>
                    )}
                    {u.is_admin && <Badge variant="default">Admin</Badge>}
                  </div>
                </button>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Balance: {formatPHP(u.balance_centavos)}</p>
                <p className="text-zinc-500">Referral: {u.referral_code}</p>
                {expandedId === u.id && (
                  <UserModerationPanel
                    user={u}
                    onSaved={(updated) =>
                      setUsers((list) =>
                        list.map((row) => (row.id === updated.id ? updated : row))
                      )
                    }
                  />
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
