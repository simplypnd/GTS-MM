"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getWithdrawalDebit,
  getWithdrawalFee,
  INSTAPAY_FEE_CENTAVOS,
  MIN_WITHDRAWAL_CENTAVOS,
  validateWithdrawalAmount,
  type WithdrawalProvider,
} from "@/lib/wallet/withdrawal";
import { sectionEnter } from "@/lib/motion";
import { LoadingSpinner } from "@/components/ui/spinner";
import { LocalizedTime } from "@/components/ui/LocalizedTime";
import { formatPHP } from "@/lib/utils";
import type { PartyRole } from "@/lib/types/database";

type TransferRow = {
  id: string;
  amount_centavos: number;
  fee_centavos: number;
  provider: string | null;
  status: string;
  created_at: string;
};

export default function WithdrawPage() {
  const [balanceCentavos, setBalanceCentavos] = useState(0);
  const [amountPesos, setAmountPesos] = useState("");
  const [provider, setProvider] = useState<WithdrawalProvider>("instapay");
  const [partyRole, setPartyRole] = useState<PartyRole>("seller");
  const [hasSellerAccount, setHasSellerAccount] = useState(false);
  const [hasBuyerAccount, setHasBuyerAccount] = useState(false);
  const [recent, setRecent] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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
        .select("id, amount_centavos, fee_centavos, provider, status, created_at")
        .eq("recipient_user_id", user.id)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false })
        .limit(10);

      setRecent((transfers as TransferRow[]) ?? []);
    })();
  }, []);

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
      setBalanceCentavos((b) => b - (data.total_debit_centavos as number));
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdraw</h1>
        <p className="mt-1 text-sm text-zinc-600">
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
              <p className="mt-1 text-xs text-zinc-500">
                Minimum ₱50.00 to receive. InstaPay deducts ₱60.00 total (₱50 +
                ₱10 fee). PESONet deducts ₱50.00.
              </p>
            </div>

            <div>
              <Label>Transfer method</Label>
              <div className="mt-2 space-y-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
                  <input
                    type="radio"
                    name="provider"
                    value="instapay"
                    checked={provider === "instapay"}
                    onChange={() => setProvider("instapay")}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium">InstaPay</span>
                    <p className="text-sm text-zinc-600">
                      ₱{(INSTAPAY_FEE_CENTAVOS / 100).toFixed(0)} fee · usually
                      reflects within minutes
                    </p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
                  <input
                    type="radio"
                    name="provider"
                    value="pesonet"
                    checked={provider === "pesonet"}
                    onChange={() => setProvider("pesonet")}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium">PESONet</span>
                    <p className="text-sm text-zinc-600">
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
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={partyRole}
                  onChange={(e) => setPartyRole(e.target.value as PartyRole)}
                >
                  <option value="seller">Seller account</option>
                  <option value="buyer">Buyer account</option>
                </select>
              </div>
            )}

            {amountCentavos > 0 && (
              <p className="text-sm text-zinc-600">
                You receive {formatPHP(amountCentavos)} · Total deducted:{" "}
                {formatPHP(totalDebit)}
                {feeCentavos > 0 && ` (includes ${formatPHP(feeCentavos)} fee)`}
              </p>
            )}
            {amountCentavos > 0 && !amountValidation.ok && (
              <p className="text-sm text-red-600">{amountValidation.error}</p>
            )}

            {!hasSellerAccount && !hasBuyerAccount && (
              <p className="text-sm text-amber-800">
                Add a payout account in{" "}
                <Link href="/settings/payouts" className="underline">
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
                className={`text-sm ${message.includes("success") ? "text-emerald-700" : "text-red-600"}`}
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
            <ul className="space-y-3 text-sm">
              {recent.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2 last:border-0"
                >
                  <span>{formatPHP(t.amount_centavos)}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="default">
                      {(t.provider ?? "—").toUpperCase()}
                    </Badge>
                    <Badge
                      variant={
                        t.status === "succeeded" ? "success" : "default"
                      }
                    >
                      {t.status}
                    </Badge>
                  </span>
                  <LocalizedTime
                    dateTime={t.created_at}
                    className="w-full text-xs text-zinc-500"
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
