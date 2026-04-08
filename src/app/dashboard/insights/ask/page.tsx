import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { InsightsAskClient } from "@/app/dashboard/insights/ask/insights-ask-client";

function Fallback() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-8">
      <Loader2 className="size-5 animate-spin" />
      Loading…
    </div>
  );
}

export default function InsightsAskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Get insights about your finances
        </p>
      </div>
      <Suspense fallback={<Fallback />}>
        <InsightsAskClient />
      </Suspense>
    </div>
  );
}
