"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadTransactions } from "@/lib/api/transactions.service";
import { queryKeys } from "@/lib/queries/query-keys";
import { isApiError } from "@/lib/api/errors";
import { useMockDataOnly } from "@/lib/config";
import { ledgerCurrencyFromMockMode } from "@/lib/currency/ledger-currency";
import { buildCashflowFromTransactions } from "@/lib/cashflow/from-transactions";
import { useLedgerDisplayFormat } from "@/hooks/use-ledger-display-format";

const emptyFilters = {} as const;

export function CashflowSummaryView() {
  const mockOnly = useMockDataOnly();
  const ledgerCode = ledgerCurrencyFromMockMode(mockOnly);

  const q = useQuery({
    queryKey: queryKeys.transactions.list(emptyFilters),
    queryFn: () => loadTransactions({}),
  });

  const summary = useMemo(
    () => buildCashflowFromTransactions(q.data ?? [], ledgerCode),
    [q.data, ledgerCode],
  );

  const { format: fmt, convert } = useLedgerDisplayFormat(summary.currency);

  const chartData = useMemo(
    () =>
      summary.periods.map((p) => ({
        label: p.label,
        inflows: convert(p.inflows),
        outflows: convert(p.outflows),
        net: convert(p.net),
      })),
    [summary.periods, convert],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cash flow</h1>
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

      {!q.isLoading && q.data && summary.transactionCount === 0 ? (
        <Alert>
          <AlertTitle>No transactions</AlertTitle>
          <AlertDescription>
            Add ledger rows or connect FastAPI — there is nothing to summarize yet.
          </AlertDescription>
        </Alert>
      ) : null}

      {q.data && summary.transactionCount > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Cash in (all periods)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-success text-2xl font-semibold tabular-nums tracking-tight">
                  {fmt(summary.totals.inflows)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Cash out (all periods)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive text-2xl font-semibold tabular-nums tracking-tight">
                  {fmt(summary.totals.outflows)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Net movement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={
                    summary.totals.net >= 0
                      ? "text-success text-2xl font-semibold tabular-nums tracking-tight"
                      : "text-destructive text-2xl font-semibold tabular-nums tracking-tight"
                  }
                >
                  {fmt(summary.totals.net)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Lines / months
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {summary.transactionCount}{" "}
                  <span className="text-muted-foreground text-base font-normal">
                    tx · {summary.periods.length} mo
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[360px]">
            <CardHeader>
              <CardTitle className="text-base">Inflows vs outflows by month</CardTitle>
              <p className="text-muted-foreground text-sm">
                Bars use absolute amounts; net = in − out each month.
              </p>
            </CardHeader>
            <CardContent className="h-[300px] min-h-[240px] min-w-0">
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">No monthly buckets to chart.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(156,163,175,0.15)"
                    />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) =>
                        typeof v === "number" && Math.abs(v) >= 1000
                          ? `${Math.round(v / 1000)}k`
                          : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number" ? fmt(value) : String(value ?? "")
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="inflows"
                      name="Cash in"
                      fill="var(--chart-1)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="outflows"
                      name="Cash out"
                      fill="var(--chart-4)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly cashflow table</CardTitle>
              <p className="text-muted-foreground text-sm">
                Running balance is cumulative net from the earliest month in view.
              </p>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Cash in</TableHead>
                    <TableHead className="text-right">Cash out</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Running balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.periods.map((p) => (
                    <TableRow key={p.periodKey}>
                      <TableCell className="font-medium">{p.label}</TableCell>
                      <TableCell className="text-success text-right tabular-nums">
                        {fmt(p.inflows)}
                      </TableCell>
                      <TableCell className="text-destructive text-right tabular-nums">
                        {fmt(p.outflows)}
                      </TableCell>
                      <TableCell
                        className={
                          p.net >= 0
                            ? "text-success text-right tabular-nums"
                            : "text-destructive text-right tabular-nums"
                        }
                      >
                        {fmt(p.net)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmt(p.runningBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
