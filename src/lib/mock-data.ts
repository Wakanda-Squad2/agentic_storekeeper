import {
  financialSummarySchema,
  type FinancialSummary,
  type FinancialSummaryApi,
} from "@/schemas/financial";
import type { RecentDocument } from "@/schemas/documents";

/** Raw shape matching FastAPI `GET .../financial/summary` (see `financialSummaryApiSchema`). */
export const mockFinancialSummaryApiInput: FinancialSummaryApi = {
  total_revenue: 2_500_000,
  total_expenses: 1_800_000,
  net_profit: 700_000,
  pending_invoices: 5,
  currency: "NGN",
  expenses_by_category: {
    rent: 500_000,
    fuel: 120_000,
    payroll: 800_000,
    office_supplies: 380_000,
  },
  vendor_breakdown: [
    { vendor: "Acme Supplies", amount: 12_400, tx_count: 18 },
    { vendor: "Metro Fuel Co.", amount: 4_100, tx_count: 42 },
    { vendor: "CloudHost SaaS", amount: 3_200, tx_count: 12 },
    { vendor: "City Properties Ltd", amount: 8_500, tx_count: 3 },
    { vendor: "Various", amount: 48_030.1, tx_count: 156 },
  ],
  monthly_trends: [
    { month: "Oct", revenue: 980_000, expenses: 710_000 },
    { month: "Nov", revenue: 1_052_000, expenses: 694_000 },
    { month: "Dec", revenue: 1_129_000, expenses: 748_000 },
    { month: "Jan", revenue: 1_184_000, expenses: 723_000 },
    { month: "Feb", revenue: 1_210_000, expenses: 751_000 },
    { month: "Mar", revenue: 1_284_000, expenses: 762_300 },
  ],
};

/** Demo summary for mock bridge + client fallback (normalized camelCase). */
export const mockFinancialSummary: FinancialSummary =
  financialSummarySchema.parse(mockFinancialSummaryApiInput);

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
    category: "fuel",
    amount: 412.05,
    direction: "expense",
  },
  {
    id: "tx_002",
    postedAt: "2026-03-27",
    description: "Office stationery order",
    vendor: "Acme Supplies",
    category: "office_supplies",
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
    category: "rent",
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
  {
    id: "tx_006",
    postedAt: "2026-02-18",
    description: "February client payment",
    vendor: "Northwind Retail",
    category: "Sales",
    amount: 6100,
    direction: "income",
  },
  {
    id: "tx_007",
    postedAt: "2026-02-10",
    description: "Utilities — February",
    vendor: "City Power Co.",
    category: "utilities",
    amount: 890,
    direction: "expense",
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
    mimeType: "application/pdf",
  },
  {
    id: "doc_002",
    name: "March payroll summary.pdf",
    type: "statement",
    status: "parsed",
    updatedAt: "2026-03-29T09:15:00Z",
    mimeType: "application/pdf",
  },
  {
    id: "doc_003",
    name: "Client remittance notice.png",
    type: "invoice",
    status: "uploaded",
    updatedAt: "2026-03-28T19:40:00Z",
    mimeType: "image/png",
  },
];
