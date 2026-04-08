"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AgentWorkflowStepper } from "./agent-workflow-stepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { z } from "zod";
import { documentUploadResponseSchema } from "@/schemas/documents";
import { uploadFormWithProgress } from "@/lib/upload/upload-with-progress";
import { useMockDataOnly } from "@/lib/config";
import { apiAbsoluteUrl, browserUpstreamHeaders } from "@/lib/api/browser-upstream";
import { mapDocumentResponseToRecent } from "@/lib/api/storekeeper/bridge-adapters";
import type { DocumentResponse } from "@/lib/api/storekeeper/types";
import {
  useAgentPipelineStream,
  createInitialPipelineSteps,
} from "@/hooks/use-agent-pipeline-stream";
import { queryKeys } from "@/lib/queries/query-keys";
import { useNotificationStore } from "@/stores/notification-store";

const ACCEPT = {
  "image/jpeg": [],
  "image/png": [],
  "application/pdf": [],
};

const UPLOAD_STATUS_LINES = [
  "Preparing files…",
  "Sending to the server…",
  "Waiting for the API to finish…",
] as const;

function UploadIndeterminateActivity({ active }: { active: boolean }) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setLineIndex(0);
      return;
    }
    const tick = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % UPLOAD_STATUS_LINES.length);
    }, 2000);
    return () => window.clearInterval(tick);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="space-y-3 rounded-lg border border-border/80 bg-muted/30 px-4 py-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span className="transition-opacity duration-300">
          {UPLOAD_STATUS_LINES[lineIndex]}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The browser cannot measure exact upload progress for this API. This bar shows activity
        until the response returns.
      </p>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner"
        aria-hidden
      >
        <div
          className="h-full w-[36%] rounded-full bg-gradient-to-r from-primary/25 via-primary to-primary/25 shadow-[0_0_14px_rgba(108,59,255,0.35)] will-change-transform animate-upload-sweep"
        />
      </div>
    </div>
  );
}

export function UploadZone() {
  const mockData = useMockDataOnly();
  const qc = useQueryClient();
  const pushAlert = useNotificationStore((s) => s.push);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pipeline = useAgentPipelineStream(activeDocId, {
    enabled: !!activeDocId,
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      setFiles(accepted);
      setUploadError(null);
      setActiveDocId(null);
      pipeline.reset();
    },
    [pipeline.reset],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 8,
    maxSize: 40 * 1024 * 1024,
  });

  async function runUpload() {
    if (!files.length) return;
    setBusy(true);
    setUploadError(null);
    setActiveDocId(null);
    pipeline.reset();

    try {
      let parsed: z.infer<typeof documentUploadResponseSchema>;

      if (mockData) {
        const formData = new FormData();
        for (const f of files) formData.append("files", f, f.name);
        const { status, bodyText } = await uploadFormWithProgress(
          "/api/bridge/documents",
          formData,
          {
            retries: 2,
            withCredentials: true,
          },
        );
        let json: unknown;
        try {
          json = bodyText ? JSON.parse(bodyText) : null;
        } catch {
          throw new Error("Upload response was not JSON");
        }
        if (![200, 201].includes(status)) {
          const detail =
            typeof (json as { detail?: string })?.detail === "string"
              ? (json as { detail: string }).detail
              : `Upload failed (${status})`;
          throw new Error(detail);
        }
        const pr = documentUploadResponseSchema.safeParse(json);
        if (!pr.success) {
          throw new Error(
            "Upload response failed validation — update `documentUploadResponseSchema` to match FastAPI.",
          );
        }
        parsed = pr.data;
      } else {
        const headers = browserUpstreamHeaders();
        let first: DocumentResponse | null = null;
        for (const f of files) {
          const fd = new FormData();
          fd.append("file", f, f.name);
          const { status, bodyText } = await uploadFormWithProgress(
            apiAbsoluteUrl("/api/v1/documents/"),
            fd,
            {
              retries: 2,
              headers,
            },
          );
          let json: unknown;
          try {
            json = bodyText ? JSON.parse(bodyText) : null;
          } catch {
            throw new Error("Upload response was not JSON");
          }
          if (![200, 201].includes(status)) {
            const detail =
              typeof (json as { detail?: string })?.detail === "string"
                ? (json as { detail: string }).detail
                : `Upload failed (${status})`;
            throw new Error(detail);
          }
          const doc = json as DocumentResponse;
          if (!first) first = doc;
        }
        const mapped = mapDocumentResponseToRecent(first!);
        const pr = documentUploadResponseSchema.safeParse({
          id: mapped.id,
          job_id: undefined,
        });
        if (!pr.success) {
          throw new Error(
            "Upload response failed validation — update `documentUploadResponseSchema` to match FastAPI.",
          );
        }
        parsed = pr.data;
      }

      setActiveDocId(parsed.id);
      void qc.invalidateQueries({ queryKey: queryKeys.documents.list });
      pushAlert({
        kind: "success",
        title: "Upload complete",
        message: "Document ingested; streaming pipeline below.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setUploadError(msg);
      pushAlert({ kind: "error", title: "Upload failed", message: msg });
    } finally {
      setBusy(false);
    }
  }

  const steps =
    activeDocId != null ? pipeline.steps : createInitialPipelineSteps();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 transition-colors hover:bg-muted/40"
        >
          <input {...getInputProps()} />
          <FileUp className="mb-3 size-10 text-muted-foreground" />
          <p className="text-center text-sm font-medium">
            {isDragActive
              ? "Drop files here"
              : "Drag and drop receipts, invoices, or bank statements"}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            JPEG, PNG, or PDF — max 40MB per file (tune with backend limits).
          </p>
        </div>

        {files.length > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {files.map((f) => (
              <li key={f.name + f.size} className="truncate">
                {f.name} ({Math.round(f.size / 1024)} KB)
              </li>
            ))}
          </ul>
        )}

        {uploadError ? (
          <Alert variant="destructive">
            <AlertTitle>Upload or validation error</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2">
              {uploadError}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-destructive/40"
                onClick={runUpload}
              >
                <RefreshCw className="me-1 size-3.5" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {pipeline.parseErrors.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Stream schema drift</AlertTitle>
            <AlertDescription>
              {pipeline.parseErrors.slice(-3).join(" · ")}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={runUpload}
            disabled={!files.length || busy}
          >
            {busy && <Loader2 className="me-2 size-4 animate-spin" />}
            Upload
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setFiles([]);
              setActiveDocId(null);
              setUploadError(null);
              pipeline.reset();
            }}
          >
            Clear
          </Button>
        </div>

        <UploadIndeterminateActivity active={busy} />

        {activeDocId ? (
          <p className="text-xs text-muted-foreground">
            Pipeline document id:{" "}
            <span className="font-mono text-foreground">{activeDocId}</span> ·
            connection: {pipeline.connection}
          </p>
        ) : null}
      </div>

      <AgentWorkflowStepper steps={steps} />
    </div>
  );
}
