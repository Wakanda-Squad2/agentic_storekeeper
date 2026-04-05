"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { humanizeCategoryLabel } from "@/lib/format-category";
import { formatMoney } from "@/lib/format-money";
import type { FinancialSummary } from "@/schemas/financial";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#94a3b8",
];

export function ExpenseDonut({ data }: { data: FinancialSummary }) {
  const chartData = data.expenseByCategory.map((row) => ({
    name: humanizeCategoryLabel(row.category),
    categoryKey: row.category,
    value: row.amount,
  }));

  return (
    <Card className="min-h-[320px]">
      <CardHeader>
        <CardTitle className="text-base">Expense by category</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] min-h-[200px] min-w-0">
        {chartData.length === 0 ? (
          <div className="text-muted-foreground flex h-full min-h-[200px] items-center justify-center text-center text-sm">
            No expense lines in this dataset — category breakdown appears when expense
            transactions exist.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) =>
                typeof value === "number"
                  ? formatMoney(value, data.currency, {
                      maximumFractionDigits: 2,
                    })
                  : String(value ?? "")
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        )}
      </CardContent>
      {chartData.length > 0 ? (
      <CardFooter className="flex flex-col items-stretch gap-1 border-t pt-3">
        <p className="text-xs text-muted-foreground">Drill down by category</p>
        <div className="flex max-h-24 flex-wrap gap-x-3 gap-y-1 overflow-y-auto text-xs">
          {chartData.map((row) => (
            <Link
              key={row.categoryKey}
              href={`/dashboard/transactions?category=${encodeURIComponent(row.categoryKey)}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {row.name}
            </Link>
          ))}
        </div>
      </CardFooter>
      ) : null}
    </Card>
  );
}
