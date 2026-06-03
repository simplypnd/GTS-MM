import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interactiveCard } from "@/lib/motion";
import { cn, formatPHP } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/escrow/dealState";
import type { Deal, DealStatus } from "@/lib/types/database";

function statusVariant(status: DealStatus) {
  if (status === "completed") return "success";
  if (status === "disputed" || status === "refunded") return "warning";
  if (status === "expired" || status === "cancelled") return "danger";
  if (status === "funded" || status === "in_progress") return "info";
  return "default";
}

export function DealCard({ deal, myRole }: { deal: Deal; myRole?: string }) {
  return (
    <Link href={`/deals/${deal.id}`}>
      <Card className={cn(interactiveCard)}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1">{deal.title}</CardTitle>
            <Badge variant={statusVariant(deal.status)}>
              {STATUS_LABELS[deal.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-zinc-900">
            {formatPHP(deal.amount_centavos)}
          </p>
          {myRole && (
            <p className="mt-1 text-xs text-zinc-500">Your role: {myRole}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
