import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentDocument } from "@/schemas/documents";

const statusVariant: Record<
  RecentDocument["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  uploaded: "secondary",
  ocr: "secondary",
  classified: "outline",
  parsed: "outline",
  validated: "outline",
  categorized: "default",
  reconciled: "default",
  failed: "destructive",
};

export function RecentDocuments({ items }: { items: RecentDocument[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Recent documents</CardTitle>
        <Link
          href="/dashboard/documents"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/documents/${doc.id}`}
                className="truncate font-medium hover:underline"
              >
                {doc.name}
              </Link>
              <p className="text-xs capitalize text-muted-foreground">
                {doc.type.replaceAll("_", " ")}
              </p>
            </div>
            <Badge variant={statusVariant[doc.status]}>{doc.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
