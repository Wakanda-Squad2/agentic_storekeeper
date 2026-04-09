"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileQuestion, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl, useMockDataOnly, API_ROUTES } from "@/lib/config";
import {
  absoluteUrlFromApiFilePath,
  isImageFile,
  isPdfFile,
} from "@/lib/document-preview";
import { cn } from "@/lib/utils";
import { apiAbsoluteUrl, browserUpstreamHeaders } from "@/lib/api/browser-upstream";

/** Shown in preview chrome (title/alt/links) so the FastAPI origin is visible next to the file name. */
function previewLabel(fileName: string): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  return `${fileName} · ${base}`;
}

/** Suggested download name: original name + backend host (filesystem-safe). */
function previewDownloadName(fileName: string): string {
  let host: string;
  try {
    host = new URL(getApiBaseUrl()).hostname;
  } catch {
    host = "api";
  }
  const safe = host.replace(/[^a-zA-Z0-9.-]+/g, "_");
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return `${fileName}__${safe}`;
  return `${fileName.slice(0, dot)}__${safe}${fileName.slice(dot)}`;
}

async function fetchPreviewBlob(
  urls: string[],
  signal: AbortSignal,
): Promise<Blob | null> {
  const headers = browserUpstreamHeaders();
  for (const url of urls) {
    if (!url) continue;
    try {
      const res = await fetch(url, {
        headers,
        cache: "no-store",
        signal,
      });
      if (!res.ok) continue;
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (ct.includes("application/json")) continue;
      return await res.blob();
    } catch {
      continue;
    }
  }
  return null;
}

type Props = {
  documentId: string;
  fileName: string;
  mimeType?: string;
  /** From `GET /api/v1/documents/{id}` (`file_path`) — primary source for binary preview. */
  filePath?: string;
  className?: string;
};

export function DocumentPreview({
  documentId,
  fileName,
  mimeType,
  filePath,
  className,
}: Props) {
  const mockData = useMockDataOnly();
  const [mediaError, setMediaError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobLoading, setBlobLoading] = useState(false);

  const numericId = Number(documentId);

  const bridgeFileUrl = useMemo(
    () => `/api/bridge/documents/${encodeURIComponent(documentId)}/file`,
    [documentId],
  );

  const candidateUrls = useMemo(() => {
    const out: string[] = [];
    const fp = filePath?.trim();
    if (fp) {
      const resolved = absoluteUrlFromApiFilePath(fp);
      if (resolved) out.push(resolved);
    }
    if (Number.isFinite(numericId)) {
      out.push(apiAbsoluteUrl(API_ROUTES.documentFile(numericId)));
    }
    return [...new Set(out)];
  }, [filePath, numericId]);

  useEffect(() => {
    if (mockData) {
      setBlobUrl(null);
      setBlobLoading(false);
      setMediaError(false);
      return;
    }
    if (candidateUrls.length === 0) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setBlobLoading(false);
      setMediaError(true);
      return;
    }
    setMediaError(false);
    setBlobLoading(true);
    const ac = new AbortController();
    void (async () => {
      const blob = await fetchPreviewBlob(candidateUrls, ac.signal);
      if (ac.signal.aborted) return;
      if (!blob) {
        setMediaError(true);
        setBlobLoading(false);
        return;
      }
      const u = URL.createObjectURL(blob);
      setBlobUrl(u);
      setBlobLoading(false);
    })();
    return () => {
      ac.abort();
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [mockData, candidateUrls]);

  const fileUrl = mockData ? bridgeFileUrl : blobUrl;

  const labeledName = useMemo(() => previewLabel(fileName), [fileName]);
  const downloadName = useMemo(() => previewDownloadName(fileName), [fileName]);

  const pdf = isPdfFile(fileName, mimeType);
  const image = !pdf && isImageFile(fileName, mimeType);

  if (!mockData && blobLoading) {
    return (
      <div
        className={cn(
          "bg-muted/30 flex min-h-[340px] flex-col items-center justify-center gap-2 rounded-lg border text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm">Loading preview from API…</p>
      </div>
    );
  }

  if (!mockData && !fileUrl) {
    return (
      <div
        className={cn(
          "bg-muted/30 flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center text-muted-foreground",
          className,
        )}
      >
        <FileQuestion className="size-10 opacity-80" />
        <p className="max-w-md text-sm">
          Could not load a file preview. The document detail from{" "}
          <code className="rounded bg-muted px-1 text-foreground">GET /api/v1/documents/{"{id}"}</code> should include a
          usable <code className="rounded bg-muted px-1 text-foreground">file_path</code>, or the{" "}
          <code className="rounded bg-muted px-1 text-foreground">/file</code> route must return the binary.
        </p>
      </div>
    );
  }

  if (pdf) {
    return (
      <div
        className={cn(
          "bg-muted/30 flex min-h-[340px] flex-col overflow-hidden rounded-lg border",
          className,
        )}
      >
        {fileUrl ? (
          <iframe
            title={`PDF preview: ${labeledName}`}
            src={fileUrl}
            className="min-h-[480px] w-full flex-1 border-0 bg-background"
          />
        ) : null}
        <div className="flex justify-end border-t bg-card px-2 py-1.5">
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              title={labeledName}
              download={downloadName}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ExternalLink className="me-1 size-3.5" />
              Open in new tab
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (image) {
    return (
      <div
        className={cn(
          "bg-muted/30 flex min-h-[340px] flex-col overflow-hidden rounded-lg border",
          className,
        )}
      >
        <div className="relative flex max-h-[min(70vh,640px)] min-h-[280px] flex-1 items-center justify-center overflow-auto bg-zinc-950/5 dark:bg-zinc-950/40">
          {mediaError || !fileUrl ? (
            <Fallback
              labeledName={labeledName}
              fileUrl={fileUrl}
              reason="Could not load image preview."
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic blob or bridge URL
            <img
              src={fileUrl}
              alt={labeledName}
              className="max-h-full max-w-full object-contain"
              onError={() => setMediaError(true)}
            />
          )}
        </div>
        <div className="flex justify-end border-t bg-card px-2 py-1.5">
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              title={labeledName}
              download={downloadName}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <ExternalLink className="me-1 size-3.5" />
              Open in new tab
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-muted/40 flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center",
        className,
      )}
    >
      <FileQuestion className="text-muted-foreground size-10" />
      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">No in-app preview for this type</p>
        <p className="text-muted-foreground">
          Try opening the file in a new tab if your API serves it as a download.
        </p>
      </div>
      {fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          title={labeledName}
          download={downloadName}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ExternalLink className="me-1 size-3.5" />
          Open / download
        </a>
      ) : null}
    </div>
  );
}

function Fallback({
  labeledName,
  fileUrl,
  reason,
}: {
  labeledName: string;
  fileUrl: string | null;
  reason: string;
}) {
  return (
    <div className="text-muted-foreground flex max-w-sm flex-col items-center gap-3 p-4 text-center text-sm">
      <p>{reason}</p>
      {fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          title={labeledName}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ExternalLink className="me-1 size-3.5" />
          Open file
        </a>
      ) : null}
    </div>
  );
}
