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

export const financialSummarySchema = z.object({
  totalRevenue: z.number().finite(),
  totalExpenses: z.number().finite(),
  netProfit: z.number().finite(),
  pendingInvoicesCount: z.number().int().nonnegative(),
  pendingInvoicesAmount: z.number().finite(),
  expenseByCategory: z.array(expenseCategorySchema),
  vendorBreakdown: z.array(vendorRowSchema),
  monthlyTrend: z.array(monthlyPointSchema),
});

export type FinancialSummary = z.infer<typeof financialSummarySchema>;

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
