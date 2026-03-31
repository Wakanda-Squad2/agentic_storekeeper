import type { FinancialSummary } from "@/schemas/financial";
import type { RecentDocument } from "@/schemas/documents";

/** Demo data until FastAPI aggregates are wired (or when USE_MOCK_ONLY). */
export const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 128_400.55,
  totalExpenses: 76_230.1,
  netProfit: 52_170.45,
  pendingInvoicesCount: 7,
  pendingInvoicesAmount: 14_250.0,
  expenseByCategory: [
    { category: "Payroll", amount: 32_000 },
    { category: "Rent", amount: 8_500 },
    { category: "Fuel", amount: 4_120.5 },
    { category: "Office supplies", amount: 1_890.6 },
    { category: "Software", amount: 6_200 },
    { category: "Other", amount: 23_519 },
  ],
  vendorBreakdown: [
    { vendor: "Acme Supplies", amount: 12_400, txCount: 18 },
    { vendor: "Metro Fuel Co.", amount: 4_100, txCount: 42 },
    { vendor: "CloudHost SaaS", amount: 3_200, txCount: 12 },
    { vendor: "City Properties Ltd", amount: 8_500, txCount: 3 },
    { vendor: "Various", amount: 48_030.1, txCount: 156 },
  ],
  monthlyTrend: [
    { month: "Oct", revenue: 98_000, expenses: 71_000 },
    { month: "Nov", revenue: 105_200, expenses: 69_400 },
    { month: "Dec", revenue: 112_900, expenses: 74_800 },
    { month: "Jan", revenue: 118_400, expenses: 72_300 },
    { month: "Feb", revenue: 121_000, expenses: 75_100 },
    { month: "Mar", revenue: 128_400, expenses: 76_230 },
  ],
};

/** Drill-down rows until `GET /api/v1/transactions` exists. */
export type MockLedgerRow = {
  id: string;
  postedAt: string;
  description: string;
  vendor: string;
  category: string;
  amount: number;
  direction: "expense" | "income";
};

export const mockLedgerTransactions: MockLedgerRow[] = [
  {
    id: "tx_001",
    postedAt: "2026-03-28",
    description: "Diesel — pump 4",
    vendor: "Metro Fuel Co.",
    category: "Fuel",
    amount: 412.05,
    direction: "expense",
  },
  {
    id: "tx_002",
    postedAt: "2026-03-27",
    description: "Office stationery order",
    vendor: "Acme Supplies",
    category: "Office supplies",
    amount: 189.2,
    direction: "expense",
  },
  {
    id: "tx_003",
    postedAt: "2026-03-26",
    description: "Cloud hosting — March",
    vendor: "CloudHost SaaS",
    category: "Software",
    amount: 3200,
    direction: "expense",
  },
  {
    id: "tx_004",
    postedAt: "2026-03-25",
    description: "Rent — HQ",
    vendor: "City Properties Ltd",
    category: "Rent",
    amount: 8500,
    direction: "expense",
  },
  {
    id: "tx_005",
    postedAt: "2026-03-24",
    description: "Client invoice paid",
    vendor: "Northwind Retail",
    category: "Sales",
    amount: 4200,
    direction: "income",
  },
];

export function filterMockLedgerRows(
  rows: MockLedgerRow[],
  filters: { category?: string | null; vendor?: string | null },
): MockLedgerRow[] {
  let out = rows;
  if (filters.category?.trim()) {
    const c = filters.category.trim().toLowerCase();
    out = out.filter((r) => r.category.toLowerCase() === c);
  }
  if (filters.vendor?.trim()) {
    const v = filters.vendor.trim().toLowerCase();
    out = out.filter((r) => r.vendor.toLowerCase() === v);
  }
  return out;
}

export const mockRecentDocuments: RecentDocument[] = [
  {
    id: "doc_001",
    name: "Fuel receipt — Metro Q1.pdf",
    type: "receipt",
    status: "reconciled",
    updatedAt: "2026-03-30T14:22:00Z",
  },
  {
    id: "doc_002",
    name: "Inv-8842 — Acme Supplies.pdf",
    type: "supplier_invoice",
    status: "categorized",
    updatedAt: "2026-03-30T11:05:00Z",
  },
  {
    id: "doc_003",
    name: "Bank statement Mar 2026.pdf",
    type: "bank_statement",
    status: "parsed",
    updatedAt: "2026-03-29T09:40:00Z",
  },
];
