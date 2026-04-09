"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadTransactions } from "@/lib/api/transactions.service";
import { queryKeys } from "@/lib/queries/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useMockDataOnly } from "@/lib/config";
import { buildFinancialSummaryFromLedgerRows } from "@/lib/transactions/build-financial-summary";
import { formatMoney } from "@/lib/format-money";

const emptyFilters = {} as const;

export function TrendsReportView() {
  const mockOnly = useMockDataOnly();
  const currency = mockOnly ? "USD" : "NGN";

  const q = useQuery({
    queryKey: queryKeys.transactions.list(emptyFilters),
    queryFn: () => loadTransactions({}),
  });

  const summary = useMemo(
    () => buildFinancialSummaryFromLedgerRows(q.data ?? [], currency),
    [q.data, currency],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trends</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revenue vs expenses by month from <strong>income</strong> and <strong>expense</strong>{" "}
            lines in <code className="rounded bg-muted px-1">/api/bridge/transactions</code>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={q.isFetching}
          onClick={() => void q.refetch()}
        >
          {q.isFetching ? (
            <Loader2 className="me-1 size-4 animate-spin" />
          ) : (
            <RefreshCw className="me-1 size-4" />
          )}
          Refresh
        </Button>
      </div>

      {q.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load transactions</AlertTitle>
          <AlertDescription>
            {isApiError(q.error)
              ? q.error.message
              : q.error instanceof Error
                ? q.error.message
                : "Unexpected error"}
          </AlertDescription>
        </Alert>
      ) : null}

      {q.isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          Loading transactions…
        </div>
      ) : null}

      {q.data && !q.isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Revenue (all loaded tx)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-success text-xl font-semibold tabular-nums">
                  {formatMoney(summary.totalRevenue, summary.currency, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Expenses (all loaded tx)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive text-xl font-semibold tabular-nums">
                  {formatMoney(summary.totalExpenses, summary.currency, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Net
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={
                    summary.netProfit >= 0
                      ? "text-success text-xl font-semibold tabular-nums"
                      : "text-destructive text-xl font-semibold tabular-nums"
                  }
                >
                  {formatMoney(summary.netProfit, summary.currency, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
          <MonthlyTrend data={summary} />
        </>
      ) : null}
    </div>
  );
}
