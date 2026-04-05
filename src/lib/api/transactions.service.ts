import { z } from "zod";
import { fetchJsonValidated } from "@/lib/api/client";
import {
  allowMockFallback,
  useMockDataOnly,
} from "@/lib/config";
import {
  filterMockLedgerRows,
  mockLedgerTransactions,
} from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";

const ledgerRowSchema = z.object({
  id: z.string(),
  postedAt: z.string(),
  description: z.string(),
  vendor: z.string(),
  category: z.string(),
  amount: z.number().finite(),
  direction: z.enum(["expense", "income"]),
});

const listResponseSchema = z.object({
  items: z.array(ledgerRowSchema),
});

export type LedgerTransactionRow = z.infer<typeof ledgerRowSchema>;

export type TransactionsListFilters = {
  category?: string;
  vendor?: string;
};

export async function loadTransactions(
  filters: TransactionsListFilters = {},
): Promise<LedgerTransactionRow[]> {
  if (useMockDataOnly()) {
    return filterMockLedgerRows(mockLedgerTransactions, {
      category: filters.category,
      vendor: filters.vendor,
    });
  }

  const p = new URLSearchParams();
  if (filters.category?.trim()) p.set("category", filters.category.trim());
  if (filters.vendor?.trim()) p.set("vendor", filters.vendor.trim());
  const qs = p.toString();

  try {
    const data = await fetchJsonValidated(`/api/bridge/transactions${qs ? `?${qs}` : ""}`, {
      schema: listResponseSchema,
    });
    return data.items;
  } catch (e) {
    if (allowMockFallback() && e instanceof ApiError) {
      return filterMockLedgerRows(mockLedgerTransactions, {
        category: filters.category,
        vendor: filters.vendor,
      });
    }
    throw e;
  }
}
