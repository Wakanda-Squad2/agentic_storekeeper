"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { VendorTable } from "@/components/dashboard/vendor-table";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { LazyExpenseDonut, LazyMonthlyTrend } from "@/components/dashboard/lazy-charts";
import {
  DashboardFiltersBar,
  filtersFromSearchParams,
} from "@/components/dashboard/dashboard-filters";
import { loadFinancialSummary } from "@/lib/api/financial.service";
import { loadDocumentsList } from "@/lib/api/documents.service";
import { applyDashboardFilters } from "@/lib/dashboard/filter-summary";
import { queryKeys } from "@/lib/queries/query-keys";
import { isApiError } from "@/lib/api/errors";

export function DashboardOverview() {
  const searchParams = useSearchParams();
  const urlFilters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams],
  );

  const apiFilters = useMemo(
    () => ({
      from: urlFilters.fromMonth || undefined,
      to: urlFilters.toMonth || undefined,
      category: urlFilters.category || undefined,
      vendor: urlFilters.vendor || undefined,
    }),
    [urlFilters],
  );

  const summaryQuery = useQuery({
    queryKey: queryKeys.financial.summary(
      Object.fromEntries(
        Object.entries(apiFilters).filter(([, v]) => v != null && v !== ""),
      ),
    ),
    queryFn: () => loadFinancialSummary(apiFilters),
  });

  const documentsQuery = useQuery({
    queryKey: queryKeys.documents.list,
    queryFn: loadDocumentsList,
  });

  const refined = summaryQuery.data
    ? applyDashboardFilters(summaryQuery.data, {
        category: urlFilters.category || undefined,
        vendor: urlFilters.vendor || undefined,
        fromMonth: urlFilters.fromMonth || undefined,
        toMonth: urlFilters.toMonth || undefined,
      })
    : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Data is validated with Zod before charts render. Use filters to
            narrow views until backend query params match.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={summaryQuery.isFetching}
          onClick={() => void summaryQuery.refetch()}
        >
          {summaryQuery.isFetching ? (
            <Loader2 className="me-1 size-4 animate-spin" />
          ) : (
            <RefreshCw className="me-1 size-4" />
          )}
          Refresh
        </Button>
      </div>

      <DashboardFiltersBar summary={summaryQuery.data} />

      {summaryQuery.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading validated summary…
        </div>
      ) : null}

      {summaryQuery.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load financial summary</AlertTitle>
          <AlertDescription>
            {isApiError(summaryQuery.error)
              ? `${summaryQuery.error.message} (HTTP ${summaryQuery.error.status})`
              : summaryQuery.error instanceof Error
                ? summaryQuery.error.message
                : "Unexpected error"}
            . Check FastAPI routes and{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_USE_MOCK_DATA</code>{" "}
            / fallback settings.
          </AlertDescription>
        </Alert>
      ) : null}

      {refined ? (
        <>
          <KpiCards data={refined} />

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              <LazyMonthlyTrend data={refined} />
              <VendorTable data={refined} />
            </div>
            <div className="space-y-6">
              <LazyExpenseDonut data={refined} />
              {documentsQuery.data ? (
                <RecentDocuments items={documentsQuery.data} />
              ) : documentsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading documents…</p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
