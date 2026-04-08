"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/config";
import { isImageFile, isPdfFile } from "@/lib/document-preview";
import { cn } from "@/lib/utils";

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

type Props = {
  documentId: string;
  fileName: string;
  mimeType?: string;
  className?: string;
};

export function DocumentPreview({ documentId, fileName, mimeType, className }: Props) {
  const [mediaError, setMediaError] = useState(false);

  const fileUrl = useMemo(
    () => `/api/bridge/documents/${encodeURIComponent(documentId)}/file`,
    [documentId],
  );

  const labeledName = useMemo(() => previewLabel(fileName), [fileName]);
  const downloadName = useMemo(() => previewDownloadName(fileName), [fileName]);

  const pdf = isPdfFile(fileName, mimeType);
  const image = !pdf && isImageFile(fileName, mimeType);

  if (pdf) {
    return (
      <div
        className={cn(
          "bg-muted/30 flex min-h-[340px] flex-col overflow-hidden rounded-lg border",
          className,
        )}
      >
        <iframe
          title={`PDF preview: ${labeledName}`}
          src={fileUrl}
          className="min-h-[480px] w-full flex-1 border-0 bg-background"
        />
        <div className="flex justify-end border-t bg-card px-2 py-1.5">
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
          {mediaError ? (
            <Fallback
              labeledName={labeledName}
              fileUrl={fileUrl}
              reason="Could not load image preview."
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic binary URL from bridge
            <img
              src={fileUrl}
              alt={labeledName}
              className="max-h-full max-w-full object-contain"
              onError={() => setMediaError(true)}
            />
          )}
        </div>
        <div className="flex justify-end border-t bg-card px-2 py-1.5">
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
    </div>
  );
}

function Fallback({
  labeledName,
  fileUrl,
  reason,
}: {
  labeledName: string;
  fileUrl: string;
  reason: string;
}) {
  return (
    <div className="text-muted-foreground flex max-w-sm flex-col items-center gap-3 p-4 text-center text-sm">
      <p>{reason}</p>
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
    </div>
  );
}
