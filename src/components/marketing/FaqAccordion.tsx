"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    q: "What is MidMan (MM)?",
    a: "MidMan is GTS MM’s neutral hold on deal funds. The buyer pays into the deal; money stays protected until the buyer confirms receipt or a mediator resolves a dispute.",
  },
  {
    q: "Who can be buyer or seller?",
    a: "You choose your role per deal when creating it. The same account can be a buyer on one deal and a seller on another.",
  },
  {
    q: "How do I pay for a deal?",
    a: "Pay with QR Ph through your bank or e-wallet app, or use your GTS MM balance if you have enough funds.",
  },
  {
    q: "What is my balance?",
    a: "When a deal completes, your share is credited to your in-app balance. Withdraw to your bank anytime from the Withdraw page.",
  },
  {
    q: "InstaPay vs PESONet for withdrawals?",
    a: "InstaPay costs ₱10 and usually reflects within minutes. PESONet is free but may take up to one business day.",
  },
  {
    q: "How do disputes work?",
    a: "Either party can open a dispute while a deal is funded or in progress. A mediator reviews the case and can release funds to the seller or refund the buyer.",
  },
  {
    q: "Do I need a payout account before creating a deal?",
    a: "No. Payout accounts are only required when you withdraw balance to your bank.",
  },
  {
    q: "Is GTS MM regulated?",
    a: "This is an MVP prototype. MidMan-style fund holding may require regulatory approval in the Philippines—seek legal review before production use.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {FAQ_ITEMS.map((item, i) => (
        <div key={item.q}>
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            {item.q}
            <span className="text-zinc-400">{openIndex === i ? "−" : "+"}</span>
          </button>
          <div
            className={cn(
              "overflow-hidden px-4 text-sm text-zinc-600 transition-all",
              openIndex === i ? "max-h-48 pb-4" : "max-h-0"
            )}
          >
            {item.a}
          </div>
        </div>
      ))}
    </div>
  );
}
