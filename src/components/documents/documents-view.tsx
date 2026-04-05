"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { UploadZone } from "@/components/documents/upload-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadDocumentsList } from "@/lib/api/documents.service";
import { queryKeys } from "@/lib/queries/query-keys";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isApiError } from "@/lib/api/errors";

export function DocumentsView() {
  const q = useQuery({
    queryKey: queryKeys.documents.list,
    queryFn: loadDocumentsList,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Uploads post to FastAPI via the Next.js bridge (multipart{" "}
          <code className="rounded bg-muted px-1">file</code> per request). Pipeline SSE still uses
          bridge routes when enabled.
        </p>
      </div>

      <UploadZone />

      {q.error ? (
        <Alert variant="destructive">
          <AlertTitle>Document list failed</AlertTitle>
          <AlertDescription>
            {isApiError(q.error)
              ? q.error.message
              : q.error instanceof Error
                ? q.error.message
                : "Error"}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Library</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {q.isLoading ? (
            <div className="flex items-center gap-2 px-6 py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading validated document list…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/documents/${d.id}`}
                        className="font-medium hover:underline"
                      >
                        {d.name}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize">
                      {d.type.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell className="capitalize">{d.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
