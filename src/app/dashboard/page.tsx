import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

function DashboardFallback() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Loading dashboard…
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardOverview />
    </Suspense>
  );
}
