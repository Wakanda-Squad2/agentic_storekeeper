"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format-money";
import type { FinancialSummary } from "@/schemas/financial";

export function MonthlyTrend({ data }: { data: FinancialSummary }) {
  const money = (v: number) => formatMoney(v, data.currency);
  const series = data.monthlyTrend;
  return (
    <Card className="min-h-[320px]">
      <CardHeader>
        <CardTitle className="text-base">Monthly trends</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] min-h-[200px] min-w-0">
        {series.length === 0 ? (
          <div className="text-muted-foreground flex h-full min-h-[200px] items-center justify-center text-center text-sm">
            No dated transactions across multiple months yet — revenue vs expenses lines need
            posted dates on your ledger rows.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <LineChart data={series} margin={{ left: 8, right: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(156,163,175,0.15)"
            />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                typeof v === "number"
                  ? Math.abs(v) >= 1000
                    ? `${Math.round(v / 1000)}k`
                    : String(Math.round(v))
                  : String(v)
              }
            />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? money(value) : String(value ?? "")
              }
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="var(--chart-4)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
