import { storekeeperJson } from "@/lib/api/storekeeper/http";
import type { DocumentResponse } from "@/lib/api/storekeeper/types";
import type { PipelineStepId } from "@/schemas/agent-events";

const STEP_ORDER: PipelineStepId[] = [
  "ocr",
  "classification",
  "parsing",
  "validation",
  "categorization",
  "reconciliation",
  "dashboard",
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isTerminalSuccess(status: string): boolean {
  const t = status.toLowerCase();
  if (/fail|error/.test(t)) return false;
  return (
    t.includes("complete") ||
    t.includes("reconcil") ||
    t.includes("done") ||
    t.includes("success") ||
    t.includes("validated")
  );
}

function isTerminalFail(status: string): boolean {
  const t = status.toLowerCase();
  return t.includes("fail") || t.includes("error");
}

/**
 * The hosted API has no SSE pipeline endpoint. We poll `GET /api/v1/documents/{id}` and
 * emit step events when `status` changes, then close when the document reaches a terminal state.
 */
export async function runDocumentStatusPipelineStream(
  documentId: string,
  numericId: number,
  forwardHeaders: Headers,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
): Promise<void> {
  const send = (payload: unknown) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  };

  const ts = () => new Date().toISOString();
  let prevStatus: string | null = null;
  let stepIdx = 0;

  try {
    const doc0 = await storekeeperJson<DocumentResponse>(
      `/api/v1/documents/${numericId}`,
      { method: "GET" },
      forwardHeaders,
    );

    send({
      v: 1,
      type: "step_started",
      document_id: documentId,
      step: STEP_ORDER[0],
      ts: ts(),
    });
    prevStatus = doc0.status;

    if (isTerminalFail(doc0.status)) {
      send({
        v: 1,
        type: "step_failed",
        document_id: documentId,
        step: "parsing",
        ts: ts(),
        error_code: "unknown",
        message: `Document status: ${doc0.status}`,
        recoverable: true,
      });
      return;
    }
    if (isTerminalSuccess(doc0.status)) {
      send({ v: 1, type: "pipeline_completed", document_id: documentId, ts: ts() });
      return;
    }

    for (let i = 0; i < 90; i++) {
      await sleep(2000);
      const doc = await storekeeperJson<DocumentResponse>(
        `/api/v1/documents/${numericId}`,
        { method: "GET" },
        forwardHeaders,
      );

      if (isTerminalFail(doc.status)) {
        if (stepIdx < STEP_ORDER.length) {
          send({
            v: 1,
            type: "step_failed",
            document_id: documentId,
            step: STEP_ORDER[Math.min(stepIdx, STEP_ORDER.length - 1)],
            ts: ts(),
            error_code: "unknown",
            message: `Document status: ${doc.status}`,
            recoverable: true,
          });
        }
        return;
      }

      if (isTerminalSuccess(doc.status)) {
        send({ v: 1, type: "pipeline_completed", document_id: documentId, ts: ts() });
        return;
      }

      if (doc.status !== prevStatus) {
        if (prevStatus != null && stepIdx < STEP_ORDER.length) {
          send({
            v: 1,
            type: "step_completed",
            document_id: documentId,
            step: STEP_ORDER[stepIdx],
            ts: ts(),
          });
          stepIdx++;
          if (stepIdx < STEP_ORDER.length) {
            send({
              v: 1,
              type: "step_started",
              document_id: documentId,
              step: STEP_ORDER[stepIdx],
              ts: ts(),
            });
          }
        }
        prevStatus = doc.status;
      }
    }

    send({ v: 1, type: "pipeline_completed", document_id: documentId, ts: ts() });
  } catch {
    send({
      v: 1,
      type: "step_failed",
      document_id: documentId,
      step: "ocr",
      ts: ts(),
      error_code: "unknown",
      message: "Could not poll document status from the API.",
      recoverable: true,
    });
  }
}
