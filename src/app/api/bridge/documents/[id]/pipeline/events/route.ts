import { NextRequest } from "next/server";
import { API_ROUTES, getApiBaseUrl, useMockDataOnly } from "@/lib/config";
import { bridgeUpstreamHeaders } from "@/lib/api/bridge-headers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function sseHeaders(contentType: string | null): HeadersInit {
  return {
    "Content-Type": contentType ?? "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

/** Published FastAPI OpenAPI has no `/pipeline/events`; avoids breaking the upload UI. */
function syntheticCompletedStream(documentId: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const payload = {
        v: 1,
        type: "pipeline_completed" as const,
        document_id: documentId,
        ts: new Date().toISOString(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: sseHeaders("text/event-stream") });
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  if (useMockDataOnly()) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const steps = [
          "ocr",
          "classification",
          "parsing",
          "validation",
          "categorization",
          "reconciliation",
          "dashboard",
        ] as const;
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const start = {
            v: 1,
            type: "step_started",
            document_id: id,
            step,
            ts: new Date().toISOString(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(start)}\n\n`),
          );
          await new Promise((r) => setTimeout(r, 400));
          const done = {
            v: 1,
            type: "step_completed",
            document_id: id,
            step,
            ts: new Date().toISOString(),
            confidence: 0.85 + i * 0.02,
            reasoning:
              step === "categorization"
                ? "Matched merchant MCC and vendor history for expense class."
                : undefined,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(done)}\n\n`),
          );
        }
        const fin = {
          v: 1,
          type: "pipeline_completed",
          document_id: id,
          ts: new Date().toISOString(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(fin)}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, { headers: sseHeaders("text/event-stream") });
  }

  const url = new URL(API_ROUTES.documentPipelineEvents(id), getApiBaseUrl());
  const headers = await bridgeUpstreamHeaders(request);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers,
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unreachable", { status: 503 });
  }

  if (upstream.status === 404 || upstream.status === 405) {
    return syntheticCompletedStream(id);
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
    });
  }

  return new Response(upstream.body, {
    headers: sseHeaders(upstream.headers.get("Content-Type")),
  });
}
