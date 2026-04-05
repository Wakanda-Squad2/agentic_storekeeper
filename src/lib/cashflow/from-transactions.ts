import type { LedgerTransactionRow } from "@/lib/api/transactions.service";

export type CashflowPeriodRow = {
  periodKey: string;
  label: string;
  inflows: number;
  outflows: number;
  net: number;
  runningBalance: number;
};

export type CashflowSummary = {
  currency: string;
  periods: CashflowPeriodRow[];
  totals: {
    inflows: number;
    outflows: number;
    net: number;
  };
  transactionCount: number;
};

function monthKeyFromPostedAt(postedAt: string): string | null {
  const t = postedAt.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 7);
  if (/^\d{4}-\d{2}$/.test(t)) return t;
  return null;
}

function formatPeriodLabel(periodKey: string): string {
  const [y, m] = periodKey.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return periodKey;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/**
 * Aggregates ledger rows by calendar month (from `postedAt` YYYY-MM-DD or YYYY-MM).
 */
export function buildCashflowFromTransactions(
  rows: LedgerTransactionRow[],
  currency = "USD",
): CashflowSummary {
  const bucket = new Map<string, { inflows: number; outflows: number }>();

  for (const r of rows) {
    const key = monthKeyFromPostedAt(r.postedAt);
    if (!key) continue;
    const cur = bucket.get(key) ?? { inflows: 0, outflows: 0 };
    if (r.direction === "income") {
      cur.inflows += r.amount;
    } else {
      cur.outflows += r.amount;
    }
    bucket.set(key, cur);
  }

  const periodKeys = [...bucket.keys()].sort();
  let running = 0;
  const periods: CashflowPeriodRow[] = periodKeys.map((periodKey) => {
    const { inflows, outflows } = bucket.get(periodKey)!;
    const net = inflows - outflows;
    running += net;
    return {
      periodKey,
      label: formatPeriodLabel(periodKey),
      inflows,
      outflows,
      net,
      runningBalance: running,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      if (r.direction === "income") acc.inflows += r.amount;
      else acc.outflows += r.amount;
      return acc;
    },
    { inflows: 0, outflows: 0, net: 0 },
  );
  totals.net = totals.inflows - totals.outflows;

  return {
    currency,
    periods,
    totals,
    transactionCount: rows.length,
  };
}
