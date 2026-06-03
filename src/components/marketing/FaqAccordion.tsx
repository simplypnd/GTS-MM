"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FAQ_ITEMS } from "@/components/marketing/faq-data";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              id={`faq-question-${i}`}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-zinc-900 motion-safe:transition-colors hover:bg-zinc-50"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
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
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              className={cn(
                "overflow-hidden px-4 text-sm text-zinc-600 motion-safe:transition-all motion-safe:duration-250",
                isOpen ? "max-h-64 pb-4 opacity-100" : "max-h-0 opacity-0 motion-reduce:opacity-100"
              )}
            >
              <p className="pt-0">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
