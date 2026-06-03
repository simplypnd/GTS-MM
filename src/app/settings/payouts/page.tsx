"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { maskAccountNumber } from "@/lib/utils";
import { sectionEnter } from "@/lib/motion";
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
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);

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

    setInstitutionsLoading(true);
    setInstitutionsError(null);
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setInstitutionsError(data.error);
          setInstitutions([]);
        } else {
          setInstitutions(data.institutions ?? []);
        }
      })
      .catch(() => {
        setInstitutionsError("Could not load bank list.");
        setInstitutions([]);
      })
      .finally(() => setInstitutionsLoading(false));
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
    <Card className={sectionEnter}>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {existing && (
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
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
            {institutionsLoading ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Loading banks…
              </p>
            ) : institutions.length > 0 ? (
              <select
                className="mt-1 flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-500"
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
            ) : (
              <>
                {institutionsError && (
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    {institutionsError}
                  </p>
                )}
                <Input
                  className="mt-2"
                  placeholder="Bank BIC (e.g. BOPIPHMM)"
                  value={bankBic}
                  onChange={(e) => setBankBic(e.target.value)}
                  required
                />
                <Input
                  className="mt-2"
                  placeholder="Bank name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </>
            )}
          </div>
          {message && (
            <p
              className={`text-sm ${message.includes("Failed") ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
            >
              {message}
            </p>
          )}
          <Button type="submit" disabled={loading} aria-busy={loading}>
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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Payout accounts
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Add the bank account where you want to receive withdrawals from your GTS
        MM balance.
      </p>
      <PayoutForm
        partyRole="seller"
        label="Payout account as Seller"
      />
      <PayoutForm
        partyRole="buyer"
        label="Refund account as Buyer"
      />
    </div>
  );
}
