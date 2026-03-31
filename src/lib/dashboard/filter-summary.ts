import type { FinancialSummary } from "@/schemas/financial";

export type DashboardFilters = {
  category?: string;
  vendor?: string;
  fromMonth?: string;
  toMonth?: string;
};

/**
 * Client-side refinement when backend does not yet honor filter query params.
 * Totals are not recomputed (would need a transaction API); charts/tables subset only.
 */
export function applyDashboardFilters(
  summary: FinancialSummary,
  f: DashboardFilters,
): FinancialSummary {
  let expenseByCategory = summary.expenseByCategory;
  let vendorBreakdown = summary.vendorBreakdown;
  let monthlyTrend = summary.monthlyTrend;

  if (f.category) {
    expenseByCategory = expenseByCategory.filter(
      (c) => c.category.toLowerCase() === f.category!.toLowerCase(),
    );
  }
  if (f.vendor) {
    vendorBreakdown = vendorBreakdown.filter(
      (v) => v.vendor.toLowerCase() === f.vendor!.toLowerCase(),
    );
  }
  /* Month labels are compared as strings until API sends real date ranges. */
  if (f.fromMonth || f.toMonth) {
    monthlyTrend = monthlyTrend.filter((row) => {
      if (f.fromMonth && row.month < f.fromMonth) return false;
      if (f.toMonth && row.month > f.toMonth) return false;
      return true;
    });
  }

  return {
    ...summary,
    expenseByCategory:
      expenseByCategory.length > 0
        ? expenseByCategory
        : summary.expenseByCategory,
    vendorBreakdown:
      vendorBreakdown.length > 0
        ? vendorBreakdown
        : summary.vendorBreakdown,
    monthlyTrend:
      monthlyTrend.length > 0 ? monthlyTrend : summary.monthlyTrend,
  };
}
