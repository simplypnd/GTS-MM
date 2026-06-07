"use client";

import { cn } from "@/lib/utils";

export type WalletTab = "withdraw" | "payouts";

export function WalletPageTabs({
  active,
  onChange,
}: {
  active: WalletTab;
  onChange: (tab: WalletTab) => void;
}) {
  const tabs: { id: WalletTab; label: string }[] = [
    { id: "withdraw", label: "Withdraw" },
    { id: "payouts", label: "Payout accounts" },
  ];

  return (
    <div className="flex gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
