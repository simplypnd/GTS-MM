import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardDealsGrid } from "@/components/deals/DashboardDealsGrid";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
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
        ? ("buyer" as const)
        : d.seller_id === user.id
          ? ("seller" as const)
          : undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome, {profile?.display_name ?? user.email}
          </p>
        </div>
        <Link href="/deals/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">New deal</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/referrals"
          className="flex-1 min-w-[12rem] rounded-lg border border-emerald-200 bg-emerald-50 p-4 motion-safe:transition-shadow motion-safe:hover:shadow-md dark:border-emerald-900/50 dark:bg-emerald-950/40"
        >
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            Invite friends
          </p>
          <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
            Earn 0.5% on completed deals →
          </p>
        </Link>
        <Link
          href="/withdraw"
          className="flex-1 min-w-[12rem] rounded-lg border border-zinc-200 bg-white p-4 motion-safe:transition-shadow motion-safe:hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Available balance
          </p>
          <p className="text-xl font-semibold">
            {formatPHP(profile?.balance_centavos ?? 0)}
          </p>
        </Link>
        {profile?.is_mediator && (
          <Link
            href="/disputes"
            className="flex-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <p className="font-medium">Open disputes</p>
            <p className="mt-1">Review and resolve →</p>
          </Link>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Your deals
        </h2>
        {dealsWithRole.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No deals yet. Create one to get started.
          </p>
        ) : (
          <DashboardDealsGrid deals={dealsWithRole} />
        )}
      </section>
    </div>
  );
}
