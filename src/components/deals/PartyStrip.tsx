import type { Profile } from "@/lib/types/database";

export function PartyStrip({
  buyer,
  seller,
}: {
  buyer?: Profile | null;
  seller?: Profile | null;
}) {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
      <div>
        <span className="font-medium text-zinc-500">Buyer</span>
        <p className="font-semibold text-zinc-900">
          {buyer?.display_name ?? "—"}
        </p>
      </div>
      <div>
        <span className="font-medium text-zinc-500">Seller</span>
        <p className="font-semibold text-zinc-900">
          {seller?.display_name ?? "—"}
        </p>
      </div>
    </div>
  );
}
