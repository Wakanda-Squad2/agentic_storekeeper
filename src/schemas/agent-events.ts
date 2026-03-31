import { z } from "zod";

/** Must match UI step ids in `AgentWorkflowStepper`. */
export const pipelineStepIdSchema = z.enum([
  "ocr",
  "classification",
  "parsing",
  "validation",
  "categorization",
  "reconciliation",
  "dashboard",
]);

export type PipelineStepId = z.infer<typeof pipelineStepIdSchema>;

export const pipelineFailureCodeSchema = z.enum([
  "ocr_failed",
  "parse_failed",
  "validation_mismatch",
  "classification_failed",
  "reconciliation_failed",
  "unknown",
]);

export type PipelineFailureCode = z.infer<typeof pipelineFailureCodeSchema>;

/**
 * Versioned envelope for SSE / WebSocket payloads.
 * Backend should emit `data: <json>\n\n` with objects matching `agentPipelineEventSchema`.
 */
export const agentPipelineEventSchema = z.discriminatedUnion("type", [
  z.object({
    v: z.literal(1),
    type: z.literal("step_started"),
    document_id: z.string(),
    step: pipelineStepIdSchema,
    ts: z.string(),
  }),
  z.object({
    v: z.literal(1),
    type: z.literal("step_completed"),
    document_id: z.string(),
    step: pipelineStepIdSchema,
    ts: z.string(),
    confidence: z.number().min(0).max(1).optional(),
    reasoning: z.string().optional(),
  }),
  z.object({
    v: z.literal(1),
    type: z.literal("step_failed"),
    document_id: z.string(),
    step: pipelineStepIdSchema,
    ts: z.string(),
    error_code: pipelineFailureCodeSchema,
    message: z.string(),
    recoverable: z.boolean().optional(),
  }),
  z.object({
    v: z.literal(1),
    type: z.literal("pipeline_completed"),
    document_id: z.string(),
    ts: z.string(),
  }),
]);

export type AgentPipelineEvent = z.infer<typeof agentPipelineEventSchema>;

/** Accept either raw event or `{ event: ... }` wrapper from some gateways. */
export const agentPipelineMessageSchema = z.union([
  agentPipelineEventSchema,
  z.object({ event: agentPipelineEventSchema }),
]);

export type AgentPipelineMessage = z.infer<typeof agentPipelineMessageSchema>;

export function unwrapAgentEvent(
  msg: AgentPipelineMessage,
): AgentPipelineEvent {
  return "event" in msg ? msg.event : msg;
}
