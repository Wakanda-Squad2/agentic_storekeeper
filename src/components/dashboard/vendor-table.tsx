"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLedgerDisplayFormat } from "@/hooks/use-ledger-display-format";
import type { FinancialSummary } from "@/schemas/financial";

export function VendorTable({ data }: { data: FinancialSummary }) {
  const { format: formatMoney } = useLedgerDisplayFormat(data.currency);
  const sorted = [...data.vendorBreakdown].sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vendor breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {sorted.length === 0 ? (
          <p className="px-6 text-sm text-muted-foreground">
            No vendor breakdown in this summary.
          </p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Transactions</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.vendor}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/transactions?vendor=${encodeURIComponent(row.vendor)}`}
                    className="hover:underline"
                  >
                    {row.vendor}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.txCount}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(row.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
