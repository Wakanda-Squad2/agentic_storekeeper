import type { LedgerTransactionRow } from "@/lib/api/transactions.service";
import {
  financialSummaryNormalizedSchema,
  type FinancialSummary,
} from "@/schemas/financial";

function monthKeyFromPostedAt(postedAt: string): string | null {
  const t = postedAt.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(t)) return t;
  return null;
}

function formatMonthLabel(periodKey: string): string {
  const [y, m] = periodKey.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return periodKey;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/**
 * Builds the dashboard `FinancialSummary` from normalized ledger rows (bridge / mock).
 * Matches aggregates used on the overview when data comes from transactions.
 */
export function buildFinancialSummaryFromLedgerRows(
  rows: LedgerTransactionRow[],
  currency: string,
): FinancialSummary {
  let totalRevenue = 0;
  let totalExpenses = 0;
  const catMap = new Map<string, number>();
  const venMap = new Map<string, { amount: number; count: number }>();
  const monthMap = new Map<string, { revenue: number; expenses: number }>();

  for (const r of rows) {
    if (r.direction === "income") {
      totalRevenue += r.amount;
    } else {
      totalExpenses += r.amount;
      const c = (r.category?.trim() || "uncategorized").toLowerCase();
      catMap.set(c, (catMap.get(c) ?? 0) + r.amount);
      const v = r.vendor?.trim() || "Unknown";
      const cur = venMap.get(v) ?? { amount: 0, count: 0 };
      venMap.set(v, { amount: cur.amount + r.amount, count: cur.count + 1 });
    }

    const mk = monthKeyFromPostedAt(r.postedAt);
    if (mk) {
      const bucket = monthMap.get(mk) ?? { revenue: 0, expenses: 0 };
      if (r.direction === "income") {
        bucket.revenue += r.amount;
      } else {
        bucket.expenses += r.amount;
      }
      monthMap.set(mk, bucket);
    }
  }

  const expenseByCategory = [...catMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const vendorBreakdown = [...venMap.entries()]
    .map(([vendor, { amount, count }]) => ({
      vendor,
      amount,
      txCount: count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthKeys = [...monthMap.keys()].sort();
  const monthlyTrend = monthKeys.map((key) => {
    const m = monthMap.get(key)!;
    return {
      month: formatMonthLabel(key),
      revenue: m.revenue,
      expenses: m.expenses,
    };
  });

  return financialSummaryNormalizedSchema.parse({
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    pendingInvoicesCount: 0,
    currency,
    expenseByCategory,
    vendorBreakdown,
    monthlyTrend,
  });
}
