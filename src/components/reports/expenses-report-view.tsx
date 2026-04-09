"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { ExpenseDonut } from "@/components/dashboard/expense-donut";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loadTransactions } from "@/lib/api/transactions.service";
import { queryKeys } from "@/lib/queries/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useMockDataOnly } from "@/lib/config";
import { ledgerCurrencyFromMockMode } from "@/lib/currency/ledger-currency";
import { buildFinancialSummaryFromLedgerRows } from "@/lib/transactions/build-financial-summary";
import { useLedgerDisplayFormat } from "@/hooks/use-ledger-display-format";

const emptyFilters = {} as const;

export function ExpensesReportView() {
  const mockOnly = useMockDataOnly();
  const ledgerCode = ledgerCurrencyFromMockMode(mockOnly);

  const q = useQuery({
    queryKey: queryKeys.transactions.list(emptyFilters),
    queryFn: () => loadTransactions({}),
  });

  const summary = useMemo(
    () => buildFinancialSummaryFromLedgerRows(q.data ?? [], ledgerCode),
    [q.data, ledgerCode],
  );

  const { format: formatMoney } = useLedgerDisplayFormat(summary.currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Category split from <strong>expense</strong> transaction
            
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
        <div className="max-w-xl">
          <p className="text-muted-foreground mb-3 text-xs">
            {summary.expenseByCategory.length} categor
            {summary.expenseByCategory.length === 1 ? "y" : "ies"} ·{" "}
            {formatMoney(summary.totalExpenses, {
              maximumFractionDigits: 0,
            })}{" "}
            total expenses
          </p>
          <ExpenseDonut data={summary} />
        </div>
      ) : null}
    </div>
  );
}
