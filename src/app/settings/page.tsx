"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SettingsPageTabs, type SettingsTab } from "@/components/settings/SettingsPageTabs";
import { SettingsReferralsSection } from "@/components/settings/SettingsReferralsSection";
import { SettingsSecuritySection } from "@/components/settings/SettingsSecuritySection";

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<SettingsTab>(
    tabParam === "referrals" ? "referrals" : "security"
  );

  useEffect(() => {
    if (tabParam === "referrals") setTab("referrals");
    else if (tabParam === "security" || tabParam === null) setTab("security");
  }, [tabParam]);

  function switchTab(next: SettingsTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Security and referral preferences for your account.
        </p>
      </div>

      <SettingsPageTabs active={tab} onChange={switchTab} />

      {tab === "security" ? (
        <SettingsSecuritySection />
      ) : (
        <SettingsReferralsSection />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <SettingsPageContent />
    </Suspense>
  );
}
