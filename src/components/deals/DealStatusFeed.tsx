import { createClient } from "@/lib/supabase/server";
import { formatDealEventLabel } from "@/lib/deals/eventLabels";

export async function DealStatusFeed({ dealId }: { dealId: string }) {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("deal_events")
    .select("event, created_at, actor_role")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!events?.length) {
    return null;
  }

  return (
    <div className="border-t border-zinc-200 pt-4">
      <h4 className="mb-2 text-sm font-medium text-zinc-900">Recent updates</h4>
      <ul className="space-y-2">
        {events.map((row) => (
          <li
            key={`${row.event}-${row.created_at}`}
            className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
          >
            <span className="text-zinc-700">
              {formatDealEventLabel(row.event)}
              {row.actor_role ? (
                <span className="text-zinc-500"> · {row.actor_role}</span>
              ) : null}
            </span>
            <time
              className="shrink-0 text-xs text-zinc-500"
              dateTime={row.created_at}
            >
              {new Date(row.created_at).toLocaleString()}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
