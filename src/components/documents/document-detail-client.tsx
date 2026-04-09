"use client";

import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loadDocumentById } from "@/lib/api/documents.service";
import { queryKeys } from "@/lib/queries/query-keys";
import { useNotificationStore } from "@/stores/notification-store";
import { isApiError } from "@/lib/api/errors";
import {
  InsightsChat,
  scrollToInsightsSection,
} from "@/components/insights/insights-chat";
import { DocumentPreview } from "./document-preview";
type Props = { documentId: string };

export function DocumentDetailClient({ documentId }: Props) {
  const push = useNotificationStore((s) => s.push);

  const docQuery = useQuery({
    queryKey: queryKeys.documents.detail(documentId),
    queryFn: () => loadDocumentById(documentId),
  });
  const docMeta = docQuery.data;

  // const auditQuery = useQuery({
  //   queryKey: queryKeys.documents.audit(documentId),
  //   queryFn: () => loadAuditTrail(documentId),
  // });

  const reprocess = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/bridge/documents/${documentId}/agents/reparse`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error(`Re-run failed (${res.status})`);
    },
    onSuccess: () => {
      push({ kind: "info", title: "Re-parse requested", message: "Poll pipeline or open SSE stream." });
    },
  });

  if (docQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading document…
      </div>
    );
  }

  if (docQuery.error || !docMeta) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load document</AlertTitle>
        <AlertDescription>
          {docQuery.error && isApiError(docQuery.error)
            ? docQuery.error.message
            : docQuery.error instanceof Error
              ? docQuery.error.message
              : "Unknown document or upstream error."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/documents"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Documents
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {docMeta.name}
          </h1>
          <p className="text-muted-foreground capitalize">
            {docMeta.type.replaceAll("_", " ")} · {docMeta.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={reprocess.isPending}
            onClick={() => reprocess.mutate()}
          >
            Re-run agents
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              scrollToInsightsSection(document.getElementById("document-insights"))
            }
          >
            Ask about this document
          </Button>
        </div>
      </div>

      <Card className="min-h-[420px]">
        <CardHeader>
          <CardTitle className="text-base">Original preview</CardTitle>
          <p className="text-muted-foreground text-sm">
            PDFs and images load through{" "}
            <code className="rounded bg-muted px-1">/api/bridge/documents/…/file</code> (proxied from
            FastAPI). Mock mode uses sample assets.
          </p>
        </CardHeader>
        <CardContent>
          <DocumentPreview
            documentId={documentId}
            fileName={docMeta.name}
            mimeType={docMeta.mimeType}
          />
        </CardContent>
      </Card>

      <InsightsChat
        documentId={documentId}
        documentTitle={docMeta.name}
        sectionId="document-insights"
      />
    </div>
  );
}
