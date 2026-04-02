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
  return (
    <Card className="min-h-[320px]">
      <CardHeader>
        <CardTitle className="text-base">Monthly trends</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px] min-h-[200px] min-w-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <LineChart data={data.monthlyTrend} margin={{ left: 8, right: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(156,163,175,0.15)"
            />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
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
      </CardContent>
    </Card>
  );
}
