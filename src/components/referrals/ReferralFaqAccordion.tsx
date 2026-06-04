"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { REFERRAL_FAQ_ITEMS } from "@/components/referrals/referral-faq-data";

export function ReferralFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div
      id="terms"
      className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {REFERRAL_FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              id={`referral-faq-question-${i}`}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-zinc-900 motion-safe:transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`referral-faq-answer-${i}`}
            >
              <span>{item.q}</span>
              <span
                className={cn(
                  "shrink-0 text-zinc-400 motion-safe:transition-transform motion-safe:duration-200",
                  isOpen && "rotate-45"
                )}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              id={`referral-faq-answer-${i}`}
              role="region"
              aria-labelledby={`referral-faq-question-${i}`}
              className={cn(
                "overflow-hidden px-4 text-sm text-zinc-600 dark:text-zinc-400 motion-safe:transition-all motion-safe:duration-250",
                isOpen ? "max-h-96 pb-4 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
