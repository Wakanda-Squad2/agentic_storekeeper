import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  filterMockLedgerRows,
  mockLedgerTransactions,
} from "@/lib/mock-data";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type Props = {
  searchParams: Promise<{ category?: string; vendor?: string }>;
};

export default async function TransactionsPage(props: Props) {
  const sp = await props.searchParams;
  const category = sp.category ? decodeURIComponent(sp.category) : undefined;
  const vendor = sp.vendor ? decodeURIComponent(sp.vendor) : undefined;

  const rows = filterMockLedgerRows(mockLedgerTransactions, {
    category,
    vendor,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Mock ledger from{" "}
          <code className="rounded bg-muted px-1">lib/mock-data.ts</code> until{" "}
          <code className="rounded bg-muted px-1">GET /api/v1/transactions</code>{" "}
          is wired.
        </p>
      </div>

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
            <span className="text-muted-foreground">No filters — all mock rows</span>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {rows.length} row{rows.length === 1 ? "" : "s"}
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
                    {currency.format(r.amount)}
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
    </div>
  );
}
