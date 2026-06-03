import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPHP } from "@/lib/utils";

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
    return (
      <p className="text-zinc-600">
        Mediator access required. Ask an admin to set{" "}
        <code className="text-sm">is_mediator = true</code> on your profile.
      </p>
    );
  }

  const { data: disputes } = await supabase
    .from("disputes")
    .select(
      `
      *,
      deal:deals (
        id, title, amount_centavos, status,
        buyer:profiles!deals_buyer_id_fkey (display_name),
        seller:profiles!deals_seller_id_fkey (display_name)
      )
    `
    )
    .is("resolved_at", null)
    .order("created_at", { ascending: false });

  // Fallback simpler query if join fails
  const { data: simpleDisputes } = await supabase
    .from("disputes")
    .select("*, deals(*)")
    .is("resolved_at", null);

  const list = disputes?.length ? disputes : simpleDisputes;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Open disputes</h1>
      {!list?.length ? (
        <p className="text-zinc-500">No open disputes.</p>
      ) : (
        <div className="space-y-4">
          {list.map((d: Record<string, unknown>) => {
            const deal = (d.deal ?? d.deals) as Record<string, unknown> | undefined;
            const dealId = (deal?.id as string) ?? (d.deal_id as string);
            return (
              <Link key={d.id as string} href={`/deals/${dealId}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {(deal?.title as string) ?? "Deal"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {deal?.amount_centavos != null && (
                      <p>{formatPHP(deal.amount_centavos as number)}</p>
                    )}
                    <p>
                      Opened by:{" "}
                      <Badge variant="warning">
                        {(d.opened_by_role as string) ?? "—"}
                      </Badge>
                    </p>
                    <p className="text-zinc-600">{d.reason as string}</p>
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
