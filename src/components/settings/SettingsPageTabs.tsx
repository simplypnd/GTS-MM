"use client";

import { cn } from "@/lib/utils";

export type SettingsTab = "security" | "referrals";

export function SettingsPageTabs({
  active,
  onChange,
}: {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "security", label: "Security" },
    { id: "referrals", label: "Referrals" },
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
