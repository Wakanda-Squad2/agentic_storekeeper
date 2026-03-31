import { InsightsChat } from "@/components/insights/insights-chat";

export default function InsightsAskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">
          Natural-language questions backed by the Financial Insight Agent over
          validated structured data.
        </p>
      </div>
      <InsightsChat />
    </div>
  );
}
