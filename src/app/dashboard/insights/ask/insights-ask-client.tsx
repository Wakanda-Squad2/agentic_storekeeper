"use client";

import { useSearchParams } from "next/navigation";
import { InsightsChat } from "@/components/insights/insights-chat";

export function InsightsAskClient() {
  const sp = useSearchParams();
  const documentId = sp.get("documentId")?.trim() || undefined;
  const documentTitle = sp.get("documentTitle")
    ? decodeURIComponent(sp.get("documentTitle")!)
    : undefined;

  return (
    <InsightsChat
      documentId={documentId}
      documentTitle={documentTitle}
      sectionId="insights-ask"
    />
  );
}
