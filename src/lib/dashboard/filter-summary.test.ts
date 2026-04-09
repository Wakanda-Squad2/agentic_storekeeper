import { describe, expect, it } from "vitest";
import { mockFinancialSummaryApiInput } from "@/lib/mock-data";
import { financialSummarySchema } from "@/schemas/financial";
import { applyDashboardFilters } from "@/lib/dashboard/filter-summary";

describe("applyDashboardFilters", () => {
  const base = financialSummarySchema.parse(mockFinancialSummaryApiInput);

  it("filters expense categories by name", () => {
    const out = applyDashboardFilters(base, { category: "fuel" });
    expect(out.expenseByCategory).toHaveLength(1);
    expect(out.expenseByCategory[0].category).toBe("fuel");
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

describe("financialSummarySchema", () => {
  it("accepts FastAPI snake_case summary payload", () => {
    const parsed = financialSummarySchema.parse({
      total_revenue: 2_500_000,
      total_expenses: 1_800_000,
      net_profit: 700_000,
      pending_invoices: 5,
      currency: "NGN",
      expenses_by_category: {
        rent: 500_000,
        fuel: 120_000,
      },
      monthly_trends: [
        { month: "Jan", revenue: 100_000, expenses: 80_000 },
      ],
    });
    expect(parsed.currency).toBe("NGN");
    expect(parsed.pendingInvoicesAmount).toBeUndefined();
    expect(parsed.expenseByCategory).toHaveLength(2);
    expect(parsed.monthlyTrend).toHaveLength(1);
  });
});
