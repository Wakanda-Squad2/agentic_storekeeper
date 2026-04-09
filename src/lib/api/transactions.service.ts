import { z } from "zod";
import {
  allowMockFallback,
  useMockDataOnly,
} from "@/lib/config";
import {
  filterMockLedgerRows,
  mockLedgerTransactions,
} from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";
import { storekeeperJson, toSearchParams } from "@/lib/api/storekeeper/http";
import type { TransactionResponse } from "@/lib/api/storekeeper/types";
import { mapTransactionToLedgerRow } from "@/lib/api/map-transaction";
import { browserUpstreamHeaders } from "@/lib/api/browser-upstream";

const ledgerRowSchema = z.object({
  id: z.string(),
  postedAt: z.string(),
  description: z.string(),
  vendor: z.string(),
  category: z.string(),
  amount: z.number().finite(),
  direction: z.enum(["expense", "income"]),
  /** ISO 4217 from API (`currency` on TransactionResponse). */
  currency: z.string().min(1).default("NGN"),
});

const listResponseSchema = z.object({
  items: z.array(ledgerRowSchema),
});

export type LedgerTransactionRow = z.infer<typeof ledgerRowSchema>;

/** PATCH body aligned with FastAPI `TransactionUpdate` (OpenAPI). */
export type TransactionUpdatePayload = {
  date?: string | null;
  description?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  type?: "income" | "expense" | null;
  category?: string | null;
  vendor?: string | null;
  reference?: string | null;
  classification_reasoning?: string | null;
  confidence?: number | null;
};

export type TransactionsListFilters = {
  category?: string;
  vendor?: string;
};

const singleItemResponseSchema = z.object({ item: ledgerRowSchema });

export async function loadTransactions(
  filters: TransactionsListFilters = {},
): Promise<LedgerTransactionRow[]> {
  if (useMockDataOnly()) {
    return filterMockLedgerRows(mockLedgerTransactions, {
      category: filters.category,
      vendor: filters.vendor,
    });
  }

  const q = toSearchParams({
    page: 1,
    size: 100,
    category: filters.category?.trim() || undefined,
    vendor: filters.vendor?.trim() || undefined,
  });

  try {
    const raw = await storekeeperJson<TransactionResponse[]>(
      `/api/v1/transactions/${q}`,
      { method: "GET" },
      browserUpstreamHeaders(),
    );
    const items = raw.map(mapTransactionToLedgerRow);
    return listResponseSchema.parse({ items }).items;
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

export async function patchTransactionViaBridge(
  id: string,
  body: TransactionUpdatePayload,
): Promise<LedgerTransactionRow> {
  if (useMockDataOnly()) {
    throw new ApiError(
      "Editing transactions requires FastAPI (set NEXT_PUBLIC_USE_MOCK_DATA=false).",
      400,
      "mock_mode",
    );
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    throw new ApiError("Invalid transaction id", 400, "invalid_id");
  }

  const payload = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(payload).length === 0) {
    throw new ApiError("No fields to update", 400, "empty_patch");
  }

  const updated = await storekeeperJson<TransactionResponse>(
    `/api/v1/transactions/${numericId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    browserUpstreamHeaders(),
  );
  return singleItemResponseSchema.parse({ item: mapTransactionToLedgerRow(updated) }).item;
}

export async function deleteTransactionViaBridge(id: string): Promise<void> {
  if (useMockDataOnly()) {
    throw new ApiError(
      "Deleting transactions requires FastAPI (set NEXT_PUBLIC_USE_MOCK_DATA=false).",
      400,
      "mock_mode",
    );
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    throw new ApiError("Invalid transaction id", 400, "invalid_id");
  }

  await storekeeperJson<unknown>(
    `/api/v1/transactions/${numericId}`,
    { method: "DELETE" },
    browserUpstreamHeaders(),
  );
}
