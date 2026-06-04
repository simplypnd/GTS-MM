"use client";

import { useMemo, useState } from "react";
import { DealCard } from "@/components/deals/DealCard";
import { Button } from "@/components/ui/button";
import { DASHBOARD_DEALS_PAGE_SIZE } from "@/lib/deals/pagination";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types/database";

export type DashboardDeal = Deal & { myRole?: "buyer" | "seller" };

export function DashboardDealsGrid({ deals }: { deals: DashboardDeal[] }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(deals.length / DASHBOARD_DEALS_PAGE_SIZE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const pageDeals = useMemo(() => {
    const start = (safePage - 1) * DASHBOARD_DEALS_PAGE_SIZE;
    return deals.slice(start, start + DASHBOARD_DEALS_PAGE_SIZE);
  }, [deals, safePage]);

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {pageDeals.map((deal, i) => (
          <div
            key={deal.id}
            className="motion-safe:animate-fade-in-up motion-reduce:animate-none"
            style={{
              animationDelay: `${Math.min(i * 80, 400)}ms`,
            }}
          >
            <DealCard deal={deal} myRole={deal.myRole} />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <nav
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="Your deals pagination"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => goToPage(safePage - 1)}
          >
            Previous
          </Button>
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                type="button"
                size="sm"
                variant={page === safePage ? "default" : "ghost"}
                className={cn(
                  "min-w-9",
                  page === safePage && "shadow-sm"
                )}
                aria-current={page === safePage ? "page" : undefined}
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => goToPage(safePage + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
