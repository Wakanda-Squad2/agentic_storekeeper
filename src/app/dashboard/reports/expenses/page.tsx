import { ExpenseDonut } from "@/components/dashboard/expense-donut";
import { mockFinancialSummary } from "@/lib/mock-data";

const summary = mockFinancialSummary;

export default function ExpensesReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Category breakdown (demo data); replace with API-driven aggregates.
        </p>
      </div>
      <div className="max-w-xl">
        <ExpenseDonut data={summary} />
      </div>
    </div>
  );
}
