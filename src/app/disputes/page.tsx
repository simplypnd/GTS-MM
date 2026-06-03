import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPHP } from "@/lib/utils";
import type { PublicProfileFields } from "@/lib/types/database";

type DealSummary = {
  id: string;
  title: string;
  amount_centavos: number;
  status: string;
  buyer_id: string;
  seller_id: string;
  buyer_name?: string;
  seller_name?: string;
};

type DisputeRow = {
  id: string;
  deal_id: string;
  opened_by_role: string;
  reason: string;
  deal: DealSummary | null;
};

function asDealSummary(raw: unknown): DealSummary | null {
  if (!raw) return null;
  const deal = Array.isArray(raw) ? raw[0] : raw;
  if (!deal || typeof deal !== "object") return null;
  const d = deal as Record<string, unknown>;
  if (typeof d.id !== "string" || typeof d.buyer_id !== "string") return null;
  return {
    id: d.id,
    title: String(d.title ?? "Deal"),
    amount_centavos: Number(d.amount_centavos ?? 0),
    status: String(d.status ?? ""),
    buyer_id: d.buyer_id,
    seller_id: String(d.seller_id ?? ""),
  };
}

export default async function DisputesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_mediator")
    .eq("id", user.id)
    .single();

  if (!profile?.is_mediator) {
    redirect("/dashboard");
  }

  const { data: disputes } = await supabase
    .from("disputes")
    .select(
      `
      id,
      deal_id,
      opened_by_role,
      reason,
      deal:deals (
        id, title, amount_centavos, status, buyer_id, seller_id
      )
    `
    )
    .is("resolved_at", null)
    .order("created_at", { ascending: false });

  const userIds = new Set<string>();
  for (const d of disputes ?? []) {
    const deal = asDealSummary(d.deal);
    if (deal?.buyer_id) userIds.add(deal.buyer_id);
    if (deal?.seller_id) userIds.add(deal.seller_id);
  }

  const { data: parties } =
    userIds.size > 0
      ? await supabase.rpc("get_profiles_public", {
          p_user_ids: Array.from(userIds),
        })
      : { data: [] as PublicProfileFields[] };

  const nameById = new Map<string, string>(
    (parties ?? []).map((p: PublicProfileFields) => [p.id, p.display_name])
  );

  const list: DisputeRow[] = (disputes ?? []).map((d) => {
    const deal = asDealSummary(d.deal);
    if (!deal) {
      return {
        id: d.id as string,
        deal_id: d.deal_id as string,
        opened_by_role: d.opened_by_role as string,
        reason: d.reason as string,
        deal: null,
      };
    }
    return {
      id: d.id as string,
      deal_id: d.deal_id as string,
      opened_by_role: d.opened_by_role as string,
      reason: d.reason as string,
      deal: {
        ...deal,
        buyer_name: nameById.get(deal.buyer_id) ?? undefined,
        seller_name: nameById.get(deal.seller_id) ?? undefined,
      },
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Open disputes
      </h1>
      {!list.length ? (
        <p className="text-zinc-500 dark:text-zinc-400">No open disputes.</p>
      ) : (
        <div className="space-y-4">
          {list.map((d) => {
            const deal = d.deal;
            const dealId = deal?.id ?? d.deal_id;
            return (
              <Link key={d.id} href={`/deals/${dealId}`}>
                <Card className="transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md motion-safe:transition-all motion-reduce:transform-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {deal?.title ?? "Deal"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {deal?.amount_centavos != null && (
                      <p>{formatPHP(deal.amount_centavos)}</p>
                    )}
                    {deal?.buyer_name && deal?.seller_name && (
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {deal.buyer_name} · {deal.seller_name}
                      </p>
                    )}
                    <p>
                      Opened by:{" "}
                      <Badge variant="warning">{d.opened_by_role ?? "—"}</Badge>
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">{d.reason}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
