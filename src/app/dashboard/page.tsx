import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DealCard } from "@/components/deals/DealCard";
import { Button } from "@/components/ui/button";
import type { Deal } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const dealsWithRole = (deals ?? []).map((d) => ({
    ...(d as Deal),
    myRole:
      d.buyer_id === user.id
        ? "buyer"
        : d.seller_id === user.id
          ? "seller"
          : undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-600">
            Welcome, {profile?.display_name ?? user.email}
          </p>
        </div>
        <Link href="/deals/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">New deal</Button>
        </Link>
      </div>

      {profile?.is_mediator && (
        <Link
          href="/disputes"
          className="block rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          View open disputes →
        </Link>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Your deals</h2>
        {dealsWithRole.length === 0 ? (
          <p className="text-zinc-500">No deals yet. Create one to get started.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {dealsWithRole.map((deal) => (
              <DealCard key={deal.id} deal={deal} myRole={deal.myRole} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
