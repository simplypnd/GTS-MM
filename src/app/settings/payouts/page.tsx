"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { maskAccountNumber } from "@/lib/utils";
import type { PayoutAccount, PartyRole } from "@/lib/types/database";

function PayoutForm({ partyRole, label }: { partyRole: PartyRole; label: string }) {
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankBic, setBankBic] = useState("");
  const [bankName, setBankName] = useState("");
  const [existing, setExisting] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<
    Array<{ provider_code: string; name: string }>
  >([]);

  useEffect(() => {
    fetch("/api/payouts")
      .then((r) => r.json())
      .then((data) => {
        const acc = (data.accounts as PayoutAccount[])?.find(
          (a) => a.party_role === partyRole
        );
        if (acc) {
          setExisting(acc);
          setAccountName(acc.account_name);
          setAccountNumber(acc.account_number);
          setBankBic(acc.bank_bic);
          setBankName(acc.bank_name ?? "");
        }
      });
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((data) => setInstitutions(data.institutions ?? []));
  }, [partyRole]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        party_role: partyRole,
        account_name: accountName,
        account_number: accountNumber,
        bank_bic: bankBic,
        bank_name: bankName,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to save");
    } else {
      setExisting(data.account);
      setMessage("Saved successfully");
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {existing && (
          <p className="mb-4 text-sm text-zinc-600">
            Current: {existing.account_name}{" "}
            {maskAccountNumber(existing.account_number)}
          </p>
        )}
        <form onSubmit={save} className="space-y-3">
          <div>
            <Label>Account name</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Account number</Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Bank</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              value={bankBic}
              onChange={(e) => {
                setBankBic(e.target.value);
                const inst = institutions.find(
                  (i) => i.provider_code === e.target.value
                );
                setBankName(inst?.name ?? "");
              }}
              required
            >
              <option value="">Select bank…</option>
              {institutions.map((i) => (
                <option key={i.provider_code} value={i.provider_code}>
                  {i.name}
                </option>
              ))}
            </select>
            {!institutions.length && (
              <Input
                className="mt-2"
                placeholder="Bank BIC (manual)"
                value={bankBic}
                onChange={(e) => setBankBic(e.target.value)}
              />
            )}
          </div>
          {message && (
            <p
              className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}
            >
              {message}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            Save {partyRole} account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PayoutsSettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Payout accounts</h1>
      <p className="text-sm text-zinc-600">
        Stored securely in our database and sent to PayMongo only when a
        release or refund is executed.
      </p>
      <PayoutForm
        partyRole="seller"
        label="Payout account as Seller (releases)"
      />
      <PayoutForm
        partyRole="buyer"
        label="Refund account as Buyer (dispute refunds)"
      />
    </div>
  );
}
