"use client";

import { useMemo, useState } from "react";
import { ExternalLink, FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { isImageFile, isPdfFile } from "@/lib/document-preview";
import { cn } from "@/lib/utils";

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
          title={`PDF preview: ${fileName}`}
          src={fileUrl}
          className="min-h-[480px] w-full flex-1 border-0 bg-background"
        />
        <div className="flex justify-end border-t bg-card px-2 py-1.5">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
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
            <Fallback fileName={fileName} fileUrl={fileUrl} reason="Could not load image preview." />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic binary URL from bridge
            <img
              src={fileUrl}
              alt={fileName}
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
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <ExternalLink className="me-1 size-3.5" />
        Open / download
      </a>
    </div>
  );
}

function Fallback({
  fileName,
  fileUrl,
  reason,
}: {
  fileName: string;
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
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <ExternalLink className="me-1 size-3.5" />
        Open {fileName}
      </a>
    </div>
  );
}
