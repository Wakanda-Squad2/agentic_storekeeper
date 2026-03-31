"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PipelineStepId } from "@/schemas/agent-events";
import { userFacingPipelineMessage, type PipelineErrorCode } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

export type StepState = "pending" | "running" | "done" | "failed";

export interface PipelineStep {
  id: PipelineStepId;
  label: string;
  state: StepState;
  confidence?: number;
  reasoning?: string;
  errorMessage?: string;
  errorCode?: PipelineErrorCode;
}

const STATE_LABEL: Record<StepState, string> = {
  pending: "Pending",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

export function AgentWorkflowStepper({ steps }: { steps: PipelineStep[] }) {
  const failed = steps.find((s) => s.state === "failed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent workflow</CardTitle>
        <p className="text-sm text-muted-foreground">
          Live updates from SSE: validated with{" "}
          <code className="rounded bg-muted px-1">agentPipelineEventSchema</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {failed ? (
          <Alert variant="destructive">
            <AlertTitle>Step failed: {failed.label}</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                {failed.errorCode
                  ? userFacingPipelineMessage(failed.errorCode)
                  : failed.errorMessage ?? "Processing error."}
              </p>
              {failed.errorMessage && failed.errorCode && (
                <p className="text-xs opacity-90">{failed.errorMessage}</p>
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <ol className="relative space-y-0 border-s border-primary/25 ps-6">
          {steps.map((step, i) => (
            <li key={step.id} className="mb-6 last:mb-0">
              <span
                className={cn(
                  "absolute -start-[7px] mt-1.5 flex size-3 rounded-full bg-card ring-2",
                  step.state === "running" &&
                    "animate-neo-pulse ring-primary/60 bg-primary/40",
                  step.state === "done" && "ring-success/50 bg-success/30",
                  step.state === "failed" &&
                    "ring-destructive/60 bg-destructive/25",
                  step.state === "pending" && "ring-border bg-muted",
                )}
                aria-hidden
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {step.state === "running" ? (
                    <span className="rounded-full animate-neo-pulse">
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </span>
                  ) : step.state === "done" ? (
                    <CheckCircle2 className="size-4 text-success" strokeWidth={2} />
                  ) : step.state === "failed" ? (
                    <XCircle className="size-4 text-destructive" strokeWidth={2} />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" strokeWidth={2} />
                  )}
                  <span className="font-medium">
                    {i + 1}. {step.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      step.state === "failed"
                        ? "destructive"
                        : step.state === "done"
                          ? "success"
                          : step.state === "running"
                            ? "default"
                            : "secondary"
                    }
                  >
                    {STATE_LABEL[step.state]}
                  </Badge>
                  {typeof step.confidence === "number" && (
                    <span
                      className={cn(
                        "text-xs tabular-nums text-muted-foreground",
                        step.state === "done" && "text-foreground",
                      )}
                    >
                      {Math.round(step.confidence * 100)}% conf.
                    </span>
                  )}
                </div>
              </div>
              {step.reasoning && step.state === "done" ? (
                <p className="ms-6 mt-1 text-xs text-muted-foreground">
                  {step.reasoning}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
