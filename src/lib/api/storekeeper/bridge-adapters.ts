import { financialSummaryNormalizedSchema, type FinancialSummary } from "@/schemas/financial";
import {
  documentStatusSchema,
  type RecentDocument,
  type DocumentStatus,
} from "@/schemas/documents";
import { storekeeperJson, toSearchParams } from "@/lib/api/storekeeper/http";
import type {
  DocumentList,
  DocumentResponse,
  TransactionResponse,
  TransactionSummary,
} from "@/lib/api/storekeeper/types";

export function mapDocumentStatus(raw: string): DocumentStatus {
  const n = raw.toLowerCase().replace(/\s+/g, "_");
  const hit = documentStatusSchema.safeParse(n);
  if (hit.success) return hit.data;
  const aliases: Record<string, DocumentStatus> = {
    processing: "ocr",
    completed: "reconciled",
    complete: "reconciled",
    done: "reconciled",
    success: "validated",
    pending: "uploaded",
    active: "uploaded",
    ready: "parsed",
  };
  return aliases[n] ?? "uploaded";
}

export function mapDocumentResponseToRecent(d: DocumentResponse): RecentDocument {
  const type =
    d.document_type?.trim() ||
    (d.file_type?.includes("/") ? (d.file_type.split("/").pop() ?? "document") : d.file_type) ||
    "document";
  return {
    id: String(d.id),
    name: d.filename,
    type: type.toLowerCase().replace(/\s+/g, "_"),
    status: mapDocumentStatus(d.status),
    updatedAt: d.updated_at ?? d.created_at,
    mimeType: d.file_type?.trim() || undefined,
    filePath: d.file_path?.trim() || undefined,
  };
}

export function mapDocumentListToRecent(list: DocumentList): RecentDocument[] {
  return list.items.map(mapDocumentResponseToRecent);
}

function num(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function coerceIsoDate(v: string | null | undefined): string | undefined {
  if (!v?.trim()) return undefined;
  const t = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return undefined;
}

export type FinancialBridgeQuery = {
  from?: string | null;
  to?: string | null;
  category?: string | null;
  vendor?: string | null;
};

function parseCategoryBreakdown(raw: unknown): { category: string; amount: number }[] {
  if (Array.isArray(raw)) {
    const out: { category: string; amount: number }[] = [];
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const category = String(o.category ?? o.name ?? o.label ?? "").trim();
      const amount = num(o.amount as string | number) || num(o.total as string | number);
      if (category && amount !== 0) out.push({ category, amount });
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.categories)) return parseCategoryBreakdown(o.categories);
    if (Array.isArray(o.items)) return parseCategoryBreakdown(o.items);
    const breakdown = o.breakdown ?? o.by_category;
    if (breakdown && typeof breakdown === "object" && !Array.isArray(breakdown)) {
      return Object.entries(breakdown as Record<string, unknown>).map(([category, v]) => ({
        category,
        amount: num(v as string | number),
      }));
    }
  }
  return [];
}

function parseTrendData(raw: unknown): { month: string; revenue: number; expenses: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { month: string; revenue: number; expenses: number }[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const month = String(o.month ?? o.period ?? o.label ?? "").trim();
    if (!month) continue;
    const revenue = num(o.revenue as string | number) || num(o.income as string | number);
    const expenses = num(o.expenses as string | number) || num(o.expense as string | number);
    out.push({ month, revenue, expenses });
  }
  return out;
}

function aggregateFromTransactions(
  txs: TransactionResponse[],
): {
  expenseByCategory: { category: string; amount: number }[];
  vendorBreakdown: { vendor: string; amount: number; txCount: number }[];
  monthlyTrend: { month: string; revenue: number; expenses: number }[];
} {
  const catMap = new Map<string, number>();
  const venMap = new Map<string, { amount: number; count: number }>();
  const monthMap = new Map<string, { revenue: number; expenses: number }>();

  for (const t of txs) {
    const amt = Math.abs(num(t.amount));
    const type = t.type?.toLowerCase() ?? "expense";

    if (type === "expense" && t.category?.trim()) {
      const c = t.category.trim();
      catMap.set(c, (catMap.get(c) ?? 0) + amt);
    }

    if (type === "expense") {
      const v = t.vendor?.trim() || "Unknown";
      const cur = venMap.get(v) ?? { amount: 0, count: 0 };
      venMap.set(v, { amount: cur.amount + amt, count: cur.count + 1 });
    }

    const monthKey = t.date?.slice(0, 7) ?? "";
    if (monthKey) {
      const cur = monthMap.get(monthKey) ?? { revenue: 0, expenses: 0 };
      if (type === "income") cur.revenue += amt;
      else cur.expenses += amt;
      monthMap.set(monthKey, cur);
    }
  }

  const expenseByCategory = [...catMap.entries()].map(([category, amount]) => ({
    category,
    amount,
  }));
  const vendorBreakdown = [...venMap.entries()]
    .map(([vendor, { amount, count }]) => ({
      vendor,
      amount,
      txCount: count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthLabels = [...monthMap.keys()].sort();
  const monthlyTrend = monthLabels.map((key) => {
    const m = monthMap.get(key)!;
    return {
      month: key,
      revenue: m.revenue,
      expenses: m.expenses,
    };
  });

  return { expenseByCategory, vendorBreakdown, monthlyTrend };
}

/**
 * Builds the dashboard `FinancialSummary` from Storekeeper FastAPI endpoints
 * (`/transactions/summary/dashboard`, dashboard breakdown/trend, and transaction list).
 */
export async function buildFinancialSummaryFromStorekeeper(
  forwardHeaders: Headers,
  query: FinancialBridgeQuery = {},
): Promise<FinancialSummary> {
  const start_date = coerceIsoDate(query.from ?? undefined);
  const end_date = coerceIsoDate(query.to ?? undefined);
  const listQ = toSearchParams({
    page: 1,
    size: 100,
    start_date,
    end_date,
    category: query.category?.trim() || undefined,
    vendor: query.vendor?.trim() || undefined,
  });

  const summaryQ = toSearchParams({ start_date, end_date });

  const [summaryRes, breakdownRes, trendRes, txsRes] = await Promise.allSettled([
    storekeeperJson<TransactionSummary>(
      `/api/v1/transactions/summary/dashboard${summaryQ}`,
      { method: "GET" },
      forwardHeaders,
    ),
    storekeeperJson<unknown>(
      `/api/v1/dashboard/category-breakdown${toSearchParams({
        transaction_type: "expense",
        start_date,
        end_date,
      })}`,
      { method: "GET" },
      forwardHeaders,
    ),
    storekeeperJson<unknown>(
      `/api/v1/dashboard/trend-data${summaryQ}`,
      { method: "GET" },
      forwardHeaders,
    ),
    storekeeperJson<TransactionResponse[]>(`/api/v1/transactions/${listQ}`, {
      method: "GET",
    }, forwardHeaders),
  ]);

  const summary: TransactionSummary =
    summaryRes.status === "fulfilled"
      ? summaryRes.value
      : {
          total_income: "0",
          total_expense: "0",
          net_flow: "0",
          count: 0,
        };

  let expenseByCategory = parseCategoryBreakdown(
    breakdownRes.status === "fulfilled" ? breakdownRes.value : null,
  );
  let monthlyTrend = parseTrendData(trendRes.status === "fulfilled" ? trendRes.value : null);
  const txs = txsRes.status === "fulfilled" ? txsRes.value : [];

  const aggregated = aggregateFromTransactions(txs);
  if (!expenseByCategory.length) expenseByCategory = aggregated.expenseByCategory;
  if (!monthlyTrend.length) monthlyTrend = aggregated.monthlyTrend;

  const currency = txs[0]?.currency ?? "NGN";

  return financialSummaryNormalizedSchema.parse({
    totalRevenue: num(summary.total_income),
    totalExpenses: num(summary.total_expense),
    netProfit: num(summary.net_flow),
    pendingInvoicesCount: 0,
    currency,
    expenseByCategory,
    vendorBreakdown: aggregated.vendorBreakdown,
    monthlyTrend,
  });
}
