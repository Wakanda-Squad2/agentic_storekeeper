"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  AgentWorkflowStepper,
  type PipelineStep,
} from "@/components/documents/agent-workflow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getDemoParsedPayload } from "@/lib/document-payloads";
import { loadAuditTrail, loadDocumentById } from "@/lib/api/documents.service";
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
  const qc = useQueryClient();
  const push = useNotificationStore((s) => s.push);

  const docQuery = useQuery({
    queryKey: queryKeys.documents.detail(documentId),
    queryFn: () => loadDocumentById(documentId),
  });
  const docMeta = docQuery.data;

  const initialPayload = useMemo(
    () => getDemoParsedPayload(documentId),
    [documentId],
  );

  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(initialPayload, null, 2),
  );
  const [parseError, setParseError] = useState<string | null>(null);

  // const auditQuery = useQuery({
  //   queryKey: queryKeys.documents.audit(documentId),
  //   queryFn: () => loadAuditTrail(documentId),
  // });

  const finished =
    docMeta?.status === "reconciled" || docMeta?.status === "categorized";

  const staticSteps: PipelineStep[] = useMemo(
    () => [
      { id: "ocr", label: "OCR extract", state: "done", confidence: 0.94 },
      {
        id: "classification",
        label: "Classification",
        state: "done",
        confidence: 0.89,
        reasoning: "Template match: supplier invoice (confidence from classifier).",
      },
      {
        id: "parsing",
        label: "Structured parsing",
        state: finished ? "done" : "running",
        confidence: finished ? 0.91 : undefined,
      },
      {
        id: "validation",
        label: "Validation",
        state: finished ? "done" : "pending",
        confidence: 0.88,
      },
      {
        id: "categorization",
        label: "Categorization",
        state: docMeta?.status === "reconciled" ? "done" : "pending",
        reasoning:
          docMeta?.status === "reconciled"
            ? "GL mapping: vehicle expense / fuel (agent rule + vendor history)."
            : undefined,
      },
      {
        id: "reconciliation",
        label: "Reconciliation",
        state: docMeta?.status === "reconciled" ? "done" : "pending",
      },
      {
        id: "dashboard",
        label: "Dashboard updated",
        state: docMeta?.status === "reconciled" ? "done" : "pending",
      },
    ],
    [docMeta?.status, finished],
  );

  const saveParsed = useMutation({
    mutationFn: async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        throw new Error("Invalid JSON");
      }
      const res = await fetch(
        `/api/bridge/documents/${documentId}/parsed`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Save failed (${res.status})`);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.documents.audit(documentId) });
      push({
        kind: "success",
        title: "Parsed data saved",
        message: "Audit trail will list this edit when backend persists events.",
      });
    },
  });

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

  const commitLocal = useCallback(() => {
    try {
      JSON.parse(jsonText);
      setParseError(null);
      saveParsed.mutate();
    } catch {
      setParseError("Fix JSON syntax before saving.");
    }
  }, [jsonText, saveParsed]);

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

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Card className="min-h-[420px]">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Human-in-the-loop</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Model confidence</span>
              <Badge variant="secondary">
                {Math.round(initialPayload.confidence * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-[220px] font-mono text-xs"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
            />
            {parseError ? (
              <p className="text-sm text-destructive">{parseError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={commitLocal}
                disabled={saveParsed.isPending}
              >
                Save corrected JSON
              </Button>
              <Button type="button" variant="outline" disabled>
                Override classification
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PATCH hits the BFF → FastAPI. Extend with Zod matching your
              document payload model before trusting edits.
            </p>
          </CardContent>
        </Card>
      </div>

      <InsightsChat
        documentId={documentId}
        documentTitle={docMeta.name}
        sectionId="document-insights"
      />
    </div>
  );
}
