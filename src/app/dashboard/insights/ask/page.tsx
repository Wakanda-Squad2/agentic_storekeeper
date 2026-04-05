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
        <p className="text-muted-foreground">
          Natural-language questions about your ledger or a{" "}
          <span className="text-foreground">specific upload</span> (pass{" "}
          <code className="rounded bg-muted px-1">?documentId=123</code> and optional{" "}
          <code className="rounded bg-muted px-1">documentTitle</code> in the URL).
        </p>
      </div>
      <Suspense fallback={<Fallback />}>
        <InsightsAskClient />
      </Suspense>
    </div>
  );
}
