import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CashflowReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cash flow</h1>
        <p className="text-muted-foreground">
          Placeholder for cashflow summary from the Financial Insight Agent and
          ledger reconciliation.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Connect to FastAPI reports endpoint (e.g.{" "}
          <code className="rounded bg-muted px-1">GET /reports/cashflow</code>)
          and render period comparisons here.
        </CardContent>
      </Card>
    </div>
  );
}
