"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialSummary } from "@/schemas/financial";

export type DashboardFilterValues = {
  fromMonth: string;
  toMonth: string;
  category: string;
  vendor: string;
};

function readFilters(sp: URLSearchParams): DashboardFilterValues {
  return {
    fromMonth: sp.get("fromMonth") ?? "",
    toMonth: sp.get("toMonth") ?? "",
    category: sp.get("category") ?? "",
    vendor: sp.get("vendor") ?? "",
  };
}

export function DashboardFiltersBar({
  summary,
}: {
  summary: FinancialSummary | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const f = readFilters(sp);

  const commit = useCallback(
    (next: Partial<DashboardFilterValues>) => {
      const p = new URLSearchParams(sp.toString());
      const merged = { ...f, ...next };
      for (const [k, v] of Object.entries(merged)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      router.push(`${pathname}?${p.toString()}`);
    },
    [f, pathname, router, sp],
  );

  const categories =
    summary?.expenseByCategory.map((c) => c.category) ?? [];
  const vendors = summary?.vendorBreakdown.map((v) => v.vendor) ?? [];

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row md:flex-wrap md:items-end">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground md:w-full lg:w-auto">
        <Filter className="size-4" />
        Filters
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap">
        <div className="space-y-1.5">
          <Label htmlFor="fromMonth">From month label</Label>
          <Input
            id="fromMonth"
            placeholder="e.g. Jan"
            value={f.fromMonth}
            onChange={(e) => commit({ fromMonth: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="toMonth">To month label</Label>
          <Input
            id="toMonth"
            placeholder="e.g. Mar"
            value={f.toMonth}
            onChange={(e) => commit({ toMonth: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-between font-normal lg:min-w-[160px]",
              )}
            >
              {f.category || "All categories"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={() => commit({ category: "" })}>
                All categories
              </DropdownMenuItem>
              {categories.map((c) => (
                <DropdownMenuItem key={c} onClick={() => commit({ category: c })}>
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-1.5">
          <Label>Vendor</Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-between font-normal lg:min-w-[180px]",
              )}
            >
              {f.vendor || "All vendors"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={() => commit({ vendor: "" })}>
                All vendors
              </DropdownMenuItem>
              {vendors.map((v) => (
                <DropdownMenuItem key={v} onClick={() => commit({ vendor: v })}>
                  {v}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="shrink-0"
        onClick={() => router.push(pathname)}
      >
        Reset
      </Button>
    </div>
  );
}

export function filtersFromSearchParams(sp: URLSearchParams) {
  return readFilters(sp);
}
