import { z } from "zod";

export const expenseCategorySchema = z.object({
  category: z.string().min(1),
  amount: z.number().finite(),
});

export const vendorRowSchema = z.object({
  vendor: z.string().min(1),
  amount: z.number().finite(),
  txCount: z.number().int().nonnegative(),
});

export const monthlyPointSchema = z.object({
  month: z.string().min(1),
  revenue: z.number().finite(),
  expenses: z.number().finite(),
});

/** Wire format from FastAPI (snake_case). Parsed with `financialSummarySchema`. */
export const financialSummaryApiSchema = z.object({
  total_revenue: z.number().finite(),
  total_expenses: z.number().finite(),
  net_profit: z.number().finite(),
  pending_invoices: z.number().int().nonnegative(),
  pending_invoices_amount: z.number().finite().optional(),
  currency: z.string().min(1).default("NGN"),
  expenses_by_category: z.record(z.string(), z.number().finite()).default({}),
  vendor_breakdown: z
    .array(
      z.object({
        vendor: z.string().min(1),
        amount: z.number().finite(),
        tx_count: z.number().int().nonnegative().optional(),
      }),
    )
    .optional()
    .default([]),
  monthly_trends: z
    .array(
      z.object({
        month: z.string().min(1),
        revenue: z.number().finite(),
        expenses: z.number().finite(),
      }),
    )
    .default([]),
});

export type FinancialSummaryApi = z.input<typeof financialSummaryApiSchema>;

function mapFinancialSummaryFromApi(
  api: z.infer<typeof financialSummaryApiSchema>,
) {
  return {
    totalRevenue: api.total_revenue,
    totalExpenses: api.total_expenses,
    netProfit: api.net_profit,
    pendingInvoicesCount: api.pending_invoices,
    pendingInvoicesAmount: api.pending_invoices_amount,
    currency: api.currency,
    expenseByCategory: Object.entries(api.expenses_by_category).map(
      ([category, amount]) => ({ category, amount }),
    ),
    vendorBreakdown: api.vendor_breakdown.map((v) => ({
      vendor: v.vendor,
      amount: v.amount,
      txCount: v.tx_count ?? 0,
    })),
    monthlyTrend: api.monthly_trends.map((m) => ({
      month: m.month,
      revenue: m.revenue,
      expenses: m.expenses,
    })),
  };
}

/** Normalized shape returned from the BFF and used in dashboard components. */
export const financialSummaryNormalizedSchema = z.object({
  totalRevenue: z.number().finite(),
  totalExpenses: z.number().finite(),
  netProfit: z.number().finite(),
  pendingInvoicesCount: z.number().int().nonnegative(),
  pendingInvoicesAmount: z.number().finite().optional(),
  currency: z.string().min(1),
  expenseByCategory: z.array(expenseCategorySchema),
  vendorBreakdown: z.array(vendorRowSchema),
  monthlyTrend: z.array(monthlyPointSchema),
});

export type FinancialSummary = z.infer<typeof financialSummaryNormalizedSchema>;

/** Parse FastAPI / upstream JSON (snake_case) → normalized dashboard model. */
export const financialSummarySchema = financialSummaryApiSchema.transform(
  (api) => financialSummaryNormalizedSchema.parse(mapFinancialSummaryFromApi(api)),
);

/** Agent insight answer — align with FastAPI response contract. */
export const insightAnswerSchema = z.object({
  question: z.string(),
  summary: z.string(),
  figures: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        currency: z.string().default("USD"),
      }),
    )
    .default([]),
});

export type InsightAnswer = z.infer<typeof insightAnswerSchema>;
