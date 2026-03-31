import { financialSummarySchema, type FinancialSummary } from "@/schemas/financial";
import { fetchJsonValidated } from "@/lib/api/client";
import {
  allowMockFallback,
  useMockDataOnly,
} from "@/lib/config";
import { mockFinancialSummary } from "@/lib/mock-data";
import { ApiError } from "@/lib/api/errors";

export type FinancialQuery = {
  from?: string;
  to?: string;
  category?: string;
  vendor?: string;
};

function buildQuery(q: FinancialQuery): string {
  const p = new URLSearchParams();
  if (q.from) p.set("from", q.from);
  if (q.to) p.set("to", q.to);
  if (q.category) p.set("category", q.category);
  if (q.vendor) p.set("vendor", q.vendor);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/**
 * Loads financial summary for dashboards.
 * Validates with Zod before returning — never pass unvalidated data to charts.
 */
export async function loadFinancialSummary(
  query: FinancialQuery = {},
): Promise<FinancialSummary> {
  if (useMockDataOnly()) {
    return financialSummarySchema.parse(mockFinancialSummary);
  }

  try {
    return await fetchJsonValidated(
      `/api/bridge/financial-summary${buildQuery(query)}`,
      { schema: financialSummarySchema },
    );
  } catch (e) {
    if (allowMockFallback() && e instanceof ApiError) {
      return financialSummarySchema.parse(mockFinancialSummary);
    }
    throw e;
  }
}
