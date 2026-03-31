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
import type { FinancialSummary } from "@/schemas/financial";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function VendorTable({ data }: { data: FinancialSummary }) {
  const sorted = [...data.vendorBreakdown].sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vendor breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
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
                  {currency.format(row.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
