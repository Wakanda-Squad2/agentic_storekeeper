import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TransactionsView } from "@/app/dashboard/transactions/transactions-view";

function TransactionsFallback() {
  return (
    <div className="flex items-center gap-2 p-6 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Loading transactions…
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsFallback />}>
      <TransactionsView />
    </Suspense>
  );
}
