"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  agentPipelineMessageSchema,
  unwrapAgentEvent,
  type AgentPipelineEvent,
} from "@/schemas/agent-events";
import type { PipelineStep, StepState } from "@/components/documents/agent-workflow-stepper";
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

const LABELS: Record<PipelineStepId, string> = {
  ocr: "OCR extract",
  classification: "Classification",
  parsing: "Structured parsing",
  validation: "Validation",
  categorization: "Categorization",
  reconciliation: "Reconciliation",
  dashboard: "Dashboard updated",
};

export function createInitialPipelineSteps(): PipelineStep[] {
  return STEP_ORDER.map((id) => ({
    id,
    label: LABELS[id],
    state: "pending" as StepState,
  }));
}

function applyEvent(
  steps: PipelineStep[],
  event: AgentPipelineEvent,
): PipelineStep[] {
  const next = steps.map((s) => ({ ...s }));

  if (event.type === "step_started") {
    const i = next.findIndex((s) => s.id === event.step);
    if (i >= 0) next[i] = { ...next[i], state: "running" };
    return next;
  }

  if (event.type === "step_completed") {
    const i = next.findIndex((s) => s.id === event.step);
    if (i >= 0) {
      next[i] = {
        ...next[i],
        state: "done",
        confidence: event.confidence,
        reasoning: event.reasoning,
      };
    }
    return next;
  }

  if (event.type === "step_failed") {
    const i = next.findIndex((s) => s.id === event.step);
    if (i >= 0) {
      next[i] = {
        ...next[i],
        state: "failed",
        errorMessage: event.message,
        errorCode: event.error_code,
      };
    }
    return next;
  }

  if (event.type === "pipeline_completed") {
    return next.map((s) =>
      s.state === "pending" || s.state === "running"
        ? { ...s, state: "done" as StepState }
        : s,
    );
  }

  return next;
}

type StreamState = {
  steps: PipelineStep[];
  parseErrors: string[];
  connection: "idle" | "open" | "closed" | "error";
};

function handleSseDataLine(
  data: string,
  setState: Dispatch<SetStateAction<StreamState>>,
) {
  let raw: unknown;
  try {
    raw = JSON.parse(data);
  } catch {
    setState((prev) => ({
      ...prev,
      parseErrors: [...prev.parseErrors, "Non-JSON SSE payload"],
    }));
    return;
  }

  const parsed = agentPipelineMessageSchema.safeParse(raw);
  if (!parsed.success) {
    setState((prev) => ({
      ...prev,
      parseErrors: [
        ...prev.parseErrors,
        `Invalid event: ${parsed.error.message}`,
      ],
    }));
    return;
  }

  const event = unwrapAgentEvent(parsed.data);
  setState((prev) => ({
    ...prev,
    steps: applyEvent(prev.steps, event),
  }));
}

/**
 * Subscribes to same-origin SSE `/api/bridge/documents/:id/pipeline/events`.
 * The bridge proxies the upstream stream when it exists, or returns a stub when the API has no pipeline route (e.g. 404).
 */
export function useAgentPipelineStream(
  documentId: string | null,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled !== false && !!documentId;

  const [state, setState] = useState<StreamState>(() => ({
    steps: createInitialPipelineSteps(),
    parseErrors: [],
    connection: "idle",
  }));

  const reset = useCallback(() => {
    setState({
      steps: createInitialPipelineSteps(),
      parseErrors: [],
      connection: "idle",
    });
  }, []);

  useEffect(() => {
    if (!enabled || !documentId) return;

    setState((s) => ({
      ...s,
      steps: createInitialPipelineSteps(),
      parseErrors: [],
      connection: "open",
    }));

    const url = `/api/bridge/documents/${documentId}/pipeline/events`;
    const es = new EventSource(url);

    es.onmessage = (ev) => {
      handleSseDataLine(ev.data, setState);
    };

    es.onerror = () => {
      setState((prev) => ({ ...prev, connection: "error" }));
      es.close();
    };

    return () => {
      es.close();
    };
  }, [documentId, enabled]);

  return useMemo(
    () => ({
      steps: state.steps,
      parseErrors: state.parseErrors,
      connection: state.connection,
      reset,
    }),
    [state, reset],
  );
}
