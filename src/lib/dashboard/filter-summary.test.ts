import { describe, expect, it } from "vitest";
import { mockFinancialSummary } from "@/lib/mock-data";
import { financialSummarySchema } from "@/schemas/financial";
import { applyDashboardFilters } from "@/lib/dashboard/filter-summary";

describe("applyDashboardFilters", () => {
  const base = financialSummarySchema.parse(mockFinancialSummary);

  it("filters expense categories by name", () => {
    const out = applyDashboardFilters(base, { category: "Fuel" });
    expect(out.expenseByCategory).toHaveLength(1);
    expect(out.expenseByCategory[0].category).toBe("Fuel");
  });

  it("filters vendors", () => {
    const out = applyDashboardFilters(base, { vendor: "Acme Supplies" });
    expect(out.vendorBreakdown).toHaveLength(1);
  });

  it("filters monthly trend by string compare on labels (prefer ISO dates in API)", () => {
    const out = applyDashboardFilters(base, { fromMonth: "Mar", toMonth: "Mar" });
    expect(out.monthlyTrend.map((m) => m.month)).toEqual(["Mar"]);
  });
});
