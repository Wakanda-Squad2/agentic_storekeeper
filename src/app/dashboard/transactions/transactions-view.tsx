"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  deleteTransactionViaBridge,
  loadTransactions,
  type LedgerTransactionRow,
} from "@/lib/api/transactions.service";
import { queryKeys } from "@/lib/queries/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useMockDataOnly } from "@/lib/config";
import { ledgerCurrencyFromMockMode } from "@/lib/currency/ledger-currency";
import { useLedgerDisplayFormat } from "@/hooks/use-ledger-display-format";
import { TransactionEditModal } from "@/components/transactions/transaction-edit-modal";
import { useToastStore } from "@/stores/toast-store";

export function TransactionsView() {
  const mockData = useMockDataOnly();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<LedgerTransactionRow | null>(null);
  const pushErrorToast = useToastStore((s) => s.pushError);
  const searchParams = useSearchParams();
  const category = searchParams.get("category")
    ? decodeURIComponent(searchParams.get("category")!)
    : undefined;
  const vendor = searchParams.get("vendor")
    ? decodeURIComponent(searchParams.get("vendor")!)
    : undefined;

  const filters = useMemo(
    () => ({ category: category || undefined, vendor: vendor || undefined }),
    [category, vendor],
  );

  const currencyCode = ledgerCurrencyFromMockMode(mockData);
  const { format: formatDisplayMoney } = useLedgerDisplayFormat(currencyCode);

  const q = useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: () => loadTransactions(filters),
  });

  const rows = q.data ?? [];

  const delMut = useMutation({
    mutationFn: deleteTransactionViaBridge,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.list(filters) });
    },
    onError: (e) => {
      const msg = isApiError(e)
        ? e.message
        : e instanceof Error
          ? e.message
          : "Delete failed";
      pushErrorToast("Could not delete transaction", msg);
    },
  });

  function onDeleteClick(id: string, label: string) {
    if (
      !window.confirm(
        `Delete this transaction?\n\n${label.slice(0, 120)}${label.length > 120 ? "…" : ""}`,
      )
    ) {
      return;
    }
    delMut.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          {mockData
            ? "Demo ledger from mock data. Set NEXT_PUBLIC_USE_MOCK_DATA=false to load from FastAPI."
            : "Loaded via the Next.js bridge from GET /api/v1/transactions/."}
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          {category ? (
            <span className="rounded-md border px-2 py-1">
              Category: <strong>{category}</strong>
            </span>
          ) : null}
          {vendor ? (
            <span className="rounded-md border px-2 py-1">
              Vendor: <strong>{vendor}</strong>
            </span>
          ) : null}
          {!category && !vendor ? (
            <span className="text-muted-foreground">No filters — all rows</span>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {q.isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </span>
            ) : (
              <>
                {rows.length} row{rows.length === 1 ? "" : "s"}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 sm:px-6">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="py-2 pr-4 font-medium">Vendor</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 text-right font-medium">Amount</th>
                <th className="w-[100px] py-2 pl-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/80">
                  <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                    {r.postedAt}
                  </td>
                  <td className="max-w-[200px] truncate py-2 pr-4 font-medium">
                    {r.description}
                  </td>
                  <td className="py-2 pr-4">{r.vendor}</td>
                  <td className="py-2 pr-4">{r.category}</td>
                  <td
                    className={
                      r.direction === "income"
                        ? "py-2 text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                        : "py-2 text-right tabular-nums"
                    }
                  >
                    {r.direction === "income" ? "+" : "−"}
                    {formatDisplayMoney(r.amount, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-8"
                        title={
                          mockData
                            ? "Connect FastAPI to edit transactions"
                            : "Edit transaction"
                        }
                        disabled={mockData || delMut.isPending}
                        onClick={() => setEditing(r)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive size-8"
                        title={
                          mockData
                            ? "Connect FastAPI to delete transactions"
                            : "Delete transaction"
                        }
                        disabled={mockData || delMut.isPending}
                        onClick={() => onDeleteClick(r.id, r.description)}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Link
        href="/dashboard"
        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
      >
        Back to overview
      </Link>

      <TransactionEditModal
        row={editing}
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        currencyCode={currencyCode}
        onSaved={() => {
          void qc.invalidateQueries({ queryKey: queryKeys.transactions.list(filters) });
          setEditing(null);
        }}
      />
    </div>
  );
}
