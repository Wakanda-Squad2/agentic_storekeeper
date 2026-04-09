"use client";

import { useParams } from "next/navigation";
import { DocumentDetailClient } from "@/components/documents/document-detail-client";

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : null;
  if (!id) return null;
  return <DocumentDetailClient documentId={id} />;
}
