import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { mockFinancialSummary } from "@/lib/mock-data";
import { financialSummarySchema } from "@/schemas/financial";

const summary = financialSummarySchema.parse(mockFinancialSummary);

export default function TrendsReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trends</h1>
        <p className="text-muted-foreground">
          Revenue vs expenses over time (demo series).
        </p>
      </div>
      <MonthlyTrend data={summary} />
    </div>
  );
}
