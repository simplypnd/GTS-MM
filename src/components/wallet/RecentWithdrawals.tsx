"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocalizedTime } from "@/components/ui/LocalizedTime";
import { cn, formatPHP } from "@/lib/utils";
import type { WithdrawalTransfer } from "@/lib/types/database";
import { maskAccountNumber } from "@/lib/wallet/withdrawal";
import {
  withdrawalStatusBadgeVariant,
  withdrawalStatusLabel,
} from "@/lib/wallet/withdrawalStatus";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-x-2 gap-y-0.5">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

export function RecentWithdrawals({
  withdrawals,
}: {
  withdrawals: WithdrawalTransfer[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggle(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function onKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
    }
  }

  return (
    <ul className="space-y-3 text-sm">
      {withdrawals.map((t) => {
        const expanded = expandedId === t.id;
        const destination = t.destination_snapshot;
        const showUpdated = t.updated_at !== t.created_at;

        return (
          <li
            key={t.id}
            className="border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800"
          >
            <button
              type="button"
              className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 rounded-md text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              aria-expanded={expanded}
              onClick={() => toggle(t.id)}
              onKeyDown={(e) => onKeyDown(e, t.id)}
            >
              <span className="text-zinc-900 dark:text-zinc-100">
                {formatPHP(t.amount_centavos)}
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="default">
                  {(t.provider ?? "—").toUpperCase()}
                </Badge>
                <Badge variant={withdrawalStatusBadgeVariant(t.status)}>
                  {withdrawalStatusLabel(t.status)}
                </Badge>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-400 motion-safe:transition-transform",
                    expanded && "rotate-180"
                  )}
                  aria-hidden
                />
              </span>
              <LocalizedTime
                dateTime={t.created_at}
                className="w-full text-xs text-zinc-500 dark:text-zinc-400"
              />
            </button>

            {expanded && (
              <div className="mt-2 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
                <dl className="space-y-2">
                  <DetailRow label="Reference">
                    <span className="break-all font-mono select-all">
                      {t.reference_number}
                    </span>
                  </DetailRow>
                  <DetailRow label="Received">
                    {formatPHP(t.amount_centavos)}
                  </DetailRow>
                  <DetailRow label="Fee">{formatPHP(t.fee_centavos)}</DetailRow>
                  <DetailRow label="Total deducted">
                    {formatPHP(t.amount_centavos + t.fee_centavos)}
                  </DetailRow>
                  <DetailRow label="Method">
                    {(t.provider ?? "—").toUpperCase()}
                  </DetailRow>
                  <DetailRow label="Status">
                    {withdrawalStatusLabel(t.status)}
                  </DetailRow>
                  <DetailRow label="Submitted">
                    <LocalizedTime
                      dateTime={t.created_at}
                      dateStyle="medium"
                      timeStyle="short"
                    />
                  </DetailRow>
                  {showUpdated && (
                    <DetailRow label="Last updated">
                      <LocalizedTime
                        dateTime={t.updated_at}
                        dateStyle="medium"
                        timeStyle="short"
                      />
                    </DetailRow>
                  )}
                  {destination?.name && (
                    <DetailRow label="Destination">
                      {destination.name}
                      {destination.number
                        ? ` · ${maskAccountNumber(destination.number)}`
                        : null}
                    </DetailRow>
                  )}
                  {t.transfer_id && (
                    <DetailRow label="Transfer ID">
                      <span className="break-all font-mono">{t.transfer_id}</span>
                    </DetailRow>
                  )}
                </dl>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
