"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReferralLinkCopy({ referralUrl }: { referralUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: select input */
    }
  }

  async function shareLink() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join GTS MM",
          text: "Sign up with my referral link and complete secure deals on GTS MM.",
          url: referralUrl,
        });
        return;
      } catch {
        /* user cancelled or unsupported */
      }
    }
    await copyLink();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input readOnly value={referralUrl} className="font-mono text-sm" />
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="secondary" onClick={() => void copyLink()}>
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void shareLink()}>
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
