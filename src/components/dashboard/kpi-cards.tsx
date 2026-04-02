import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format-money";
import type { FinancialSummary } from "@/schemas/financial";

export function KpiCards({ data }: { data: FinancialSummary }) {
  const fmt = (n: number) => formatMoney(n, data.currency);

  const pendingLabel =
    data.pendingInvoicesAmount != null
      ? `${data.pendingInvoicesCount} · ${fmt(data.pendingInvoicesAmount)}`
      : String(data.pendingInvoicesCount);

  const items = [
    {
      title: "Total revenue",
      value: fmt(data.totalRevenue),
      valueClass:
        "text-2xl font-semibold tabular-nums tracking-tight text-success",
    },
    {
      title: "Total expenses",
      value: fmt(data.totalExpenses),
      valueClass:
        "text-2xl font-semibold tabular-nums tracking-tight text-destructive",
    },
    {
      title: "Net profit",
      value: fmt(data.netProfit),
      valueClass:
        "text-3xl font-bold tabular-nums tracking-tight text-kpi-gold shadow-[0_0_24px_rgba(212,175,55,0.12)]",
    },
    {
      title: "Pending invoices",
      value: pendingLabel,
      valueClass:
        "text-2xl font-semibold tabular-nums tracking-tight text-foreground",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={item.valueClass}>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
