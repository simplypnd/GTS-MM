"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecentWithdrawals } from "@/components/wallet/RecentWithdrawals";
import {
  getWithdrawalDebit,
  getWithdrawalFee,
  INSTAPAY_FEE_CENTAVOS,
  MIN_WITHDRAWAL_CENTAVOS,
  validateWithdrawalAmount,
  type WithdrawalProvider,
} from "@/lib/wallet/withdrawal";
import { LoadingSpinner } from "@/components/ui/spinner";
import { cn, formatPHP } from "@/lib/utils";
import { sectionEnter } from "@/lib/motion";
import type { PartyRole, WithdrawalTransfer } from "@/lib/types/database";

const radioCardClass =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50 dark:border-zinc-700 dark:has-[:checked]:border-zinc-300 dark:has-[:checked]:bg-zinc-800";

const selectClass =
  "mt-1 flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

export default function WithdrawPage() {
  const [balanceCentavos, setBalanceCentavos] = useState(0);
  const [amountPesos, setAmountPesos] = useState("");
  const [provider, setProvider] = useState<WithdrawalProvider>("instapay");
  const [partyRole, setPartyRole] = useState<PartyRole>("seller");
  const [hasSellerAccount, setHasSellerAccount] = useState(false);
  const [hasBuyerAccount, setHasBuyerAccount] = useState(false);
  const [recent, setRecent] = useState<WithdrawalTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await fetch("/api/wallet/withdraw/sync", { method: "POST" });
    } catch {
      /* sync is best-effort */
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance_centavos")
      .eq("id", user.id)
      .single();
    setBalanceCentavos(profile?.balance_centavos ?? 0);

    const { data: accounts } = await supabase
      .from("payout_accounts")
      .select("party_role")
      .eq("user_id", user.id)
      .eq("is_default", true);

    const roles = new Set(accounts?.map((a) => a.party_role) ?? []);
    setHasSellerAccount(roles.has("seller"));
    setHasBuyerAccount(roles.has("buyer"));
    if (roles.has("seller")) setPartyRole("seller");
    else if (roles.has("buyer")) setPartyRole("buyer");

    const { data: transfers } = await supabase
      .from("paymongo_transfers")
      .select(
        "id, amount_centavos, fee_centavos, provider, status, instruction_id, recipient_role, destination_snapshot, created_at, updated_at"
      )
      .eq("recipient_user_id", user.id)
      .eq("type", "withdrawal")
      .order("created_at", { ascending: false })
      .limit(10);

    setRecent((transfers as WithdrawalTransfer[]) ?? []);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") void loadData();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadData]);

  const amountCentavos = Math.round(parseFloat(amountPesos || "0") * 100);
  const feeCentavos = getWithdrawalFee(provider);
  const totalDebit =
    amountCentavos > 0 ? getWithdrawalDebit(amountCentavos, provider) : 0;
  const amountValidation = validateWithdrawalAmount(amountCentavos, provider);
  const canSubmit =
    amountValidation.ok &&
    totalDebit <= balanceCentavos &&
    ((partyRole === "seller" && hasSellerAccount) ||
      (partyRole === "buyer" && hasBuyerAccount));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_centavos: amountCentavos,
          provider,
          party_role: partyRole,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");
      setMessage("Withdrawal submitted successfully.");
      setAmountPesos("");
      await loadData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Withdraw
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Transfer your balance to your bank account.
        </p>
      </div>

      <Card className={sectionEnter}>
        <CardHeader>
          <CardTitle className="text-base">Available balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatPHP(balanceCentavos)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdraw funds</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount to receive (PHP)</Label>
              <Input
                id="amount"
                type="number"
                min={MIN_WITHDRAWAL_CENTAVOS / 100}
                step="0.01"
                value={amountPesos}
                onChange={(e) => setAmountPesos(e.target.value)}
                placeholder="50.00"
                required
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Minimum ₱50.00 to receive. InstaPay deducts ₱60.00 total (₱50 +
                ₱10 fee). PESONet deducts ₱50.00.
              </p>
            </div>

            <div>
              <Label>Transfer method</Label>
              <div className="mt-2 space-y-2">
                <label className={radioCardClass}>
                  <input
                    type="radio"
                    name="provider"
                    value="instapay"
                    checked={provider === "instapay"}
                    onChange={() => setProvider("instapay")}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      InstaPay
                    </span>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      ₱{(INSTAPAY_FEE_CENTAVOS / 100).toFixed(0)} fee · usually
                      reflects within minutes
                    </p>
                  </div>
                </label>
                <label className={radioCardClass}>
                  <input
                    type="radio"
                    name="provider"
                    value="pesonet"
                    checked={provider === "pesonet"}
                    onChange={() => setProvider("pesonet")}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      PESONet
                    </span>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      No fee · may take up to 1 business day
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {hasSellerAccount && hasBuyerAccount && (
              <div>
                <Label>Payout account</Label>
                <select
                  className={selectClass}
                  value={partyRole}
                  onChange={(e) => setPartyRole(e.target.value as PartyRole)}
                >
                  <option value="seller">Seller account</option>
                  <option value="buyer">Buyer account</option>
                </select>
              </div>
            )}

            {amountCentavos > 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You receive {formatPHP(amountCentavos)} · Total deducted:{" "}
                {formatPHP(totalDebit)}
                {feeCentavos > 0 && ` (includes ${formatPHP(feeCentavos)} fee)`}
              </p>
            )}
            {amountCentavos > 0 && !amountValidation.ok && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {amountValidation.error}
              </p>
            )}

            {!hasSellerAccount && !hasBuyerAccount && (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Add a payout account in{" "}
                <Link
                  href="/settings/payouts"
                  className="underline hover:text-amber-900 dark:hover:text-amber-100"
                >
                  Settings → Payouts
                </Link>{" "}
                before withdrawing.
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full"
              aria-busy={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner />
                  Processing…
                </span>
              ) : (
                "Withdraw"
              )}
            </Button>

            {message && (
              <p
                className={cn(
                  "text-sm",
                  message.includes("success")
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentWithdrawals withdrawals={recent} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
