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

  const res = await fetch(`/api/bridge/transactions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError("Response was not valid JSON", res.status, "invalid_json", text);
  }

  if (!res.ok) {
    const detail =
      typeof (json as { detail?: string })?.detail === "string"
        ? (json as { detail: string }).detail
        : `Request failed (${res.status})`;
    throw new ApiError(detail, res.status, undefined, json);
  }

  const parsed = singleItemResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(
      "Unexpected PATCH response shape",
      res.status,
      "schema_validation",
      json,
    );
  }
  return parsed.data.item;
}

export async function deleteTransactionViaBridge(id: string): Promise<void> {
  if (useMockDataOnly()) {
    throw new ApiError(
      "Deleting transactions requires FastAPI (set NEXT_PUBLIC_USE_MOCK_DATA=false).",
      400,
      "mock_mode",
    );
  }

  const res = await fetch(`/api/bridge/transactions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (res.status === 204 || res.status === 200) {
    return;
  }

  const text = await res.text();
  let detail = `Request failed (${res.status})`;
  try {
    const j = JSON.parse(text) as { detail?: string };
    if (typeof j.detail === "string") detail = j.detail;
  } catch {
    /* ignore */
  }
  throw new ApiError(detail, res.status, undefined, text);
}
