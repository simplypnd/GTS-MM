"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PLATFORM_FEE_BPS,
  computeNetAfterFee,
  computePlatformFee,
} from "@/lib/escrow/dealState";
import { formatPHP } from "@/lib/utils";

export default function NewDealPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [counterpartyEmail, setCounterpartyEmail] = useState("");
  const [mySide, setMySide] = useState<"buyer" | "seller">("buyer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pesoPreview = parseFloat(amount);
  const centavosPreview =
    !isNaN(pesoPreview) && pesoPreview > 0
      ? Math.round(pesoPreview * 100)
      : null;
  const feePreview =
    centavosPreview != null
      ? computePlatformFee(centavosPreview, PLATFORM_FEE_BPS)
      : null;
  const netPreview =
    centavosPreview != null
      ? computeNetAfterFee(centavosPreview, PLATFORM_FEE_BPS)
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const peso = parseFloat(amount);
    if (isNaN(peso) || peso <= 0) {
      setError("Enter a valid amount");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        amount_centavos: Math.round(peso * 100),
        counterparty_email: counterpartyEmail,
        my_side: mySide,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create deal");
      setLoading(false);
      return;
    }

    router.push(`/deals/${data.deal.id}`);
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Create deal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>I am the</Label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  checked={mySide === "buyer"}
                  onChange={() => setMySide("buyer")}
                />
                Buyer
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  checked={mySide === "seller"}
                  onChange={() => setMySide("seller")}
                />
                Seller
              </label>
            </div>
          </div>
          <div>
            <Label htmlFor="counterparty">Counterparty email</Label>
            <Input
              id="counterparty"
              type="email"
              value={counterpartyEmail}
              onChange={(e) => setCounterpartyEmail(e.target.value)}
              placeholder="seller@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (PHP)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {centavosPreview != null && feePreview != null && netPreview != null && (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Buyer pays {formatPHP(centavosPreview)}. MidMan fee (5%):{" "}
                {formatPHP(feePreview)}. Seller receives {formatPHP(netPreview)}{" "}
                on successful completion.
              </p>
            )}
          </div>
          <p className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
            Review: You will be the <strong>{mySide}</strong>. Counterparty must
            already be registered.
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create deal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
