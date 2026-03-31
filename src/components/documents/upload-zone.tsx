"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, Loader2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AgentWorkflowStepper } from "./agent-workflow-stepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { documentUploadResponseSchema } from "@/schemas/documents";
import { uploadFormWithProgress } from "@/lib/upload/upload-with-progress";
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

export function UploadZone() {
  const qc = useQueryClient();
  const pushAlert = useNotificationStore((s) => s.push);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
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
      setUploadPct(null);
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
    setUploadPct(0);
    setActiveDocId(null);
    pipeline.reset();

    const formData = new FormData();
    for (const f of files) formData.append("files", f, f.name);

    try {
      const { status, bodyText } = await uploadFormWithProgress(
        "/api/bridge/documents",
        formData,
        {
          retries: 2,
          onProgress: (p) => setUploadPct(p.percent),
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

      const parsed = documentUploadResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error(
          "Upload response failed validation — update `documentUploadResponseSchema` to match FastAPI.",
        );
      }

      setActiveDocId(parsed.data.id);
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
      setUploadPct(null);
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
            Upload with progress
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

        {uploadPct !== null ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Multipart upload</span>
              <span>{uploadPct}%</span>
            </div>
            <Progress value={uploadPct} />
          </div>
        ) : null}

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
