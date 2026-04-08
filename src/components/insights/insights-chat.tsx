"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { insightAnswerSchema, type InsightAnswer } from "@/schemas/financial";
import { z } from "zod";
import { useMockDataOnly } from "@/lib/config";

const questionSchema = z.object({
  question: z.string().min(4, "Ask a fuller question"),
});

export type InsightsChatProps = {
  /** When set, questions go to `POST /api/v1/chat/ask-about-document` (upload-specific). */
  documentId?: string;
  /** Shown in the card header / mock copy. */
  documentTitle?: string;
  /** Anchor for in-page scroll (e.g. document detail). */
  sectionId?: string;
};

function mockAnswer(question: string): InsightAnswer {
  const q = question.toLowerCase();
  const fuel =
    q.includes("fuel") || q.includes("gas")
      ? { label: "Fuel (MTD)", value: 4120.5, currency: "USD" as const }
      : null;
  return insightAnswerSchema.parse({
    question,
    summary: fuel
      ? "Fuel spend is tracked from receipts and fuel vendor invoices for the selected tenant."
      : "Mock mode: turn off NEXT_PUBLIC_USE_MOCK_DATA for live FastAPI chat.",
    figures: fuel
      ? [fuel]
      : [
          { label: "Example revenue YTD", value: 128400.55, currency: "USD" },
          { label: "Example expenses YTD", value: 76230.1, currency: "USD" },
        ],
  });
}

function mockDocumentAnswer(
  question: string,
  documentTitle: string | undefined,
  numericId: number,
): InsightAnswer {
  const label = documentTitle?.trim() || `Document #${numericId}`;
  return insightAnswerSchema.parse({
    question,
    summary: `Mock mode: questions about "${label}" would be sent to POST /api/v1/chat/ask-about-document with document_id ${numericId}. Your question: ${question.slice(0, 200)}${question.length > 200 ? "…" : ""}`,
    figures: [],
  });
}

function figuresFromChatData(data: unknown): InsightAnswer["figures"] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const raw = o.figures;
  if (!Array.isArray(raw)) return [];
  const out: InsightAnswer["figures"] = [];
  for (const x of raw) {
    if (!x || typeof x !== "object") continue;
    const r = x as Record<string, unknown>;
    const label = String(r.label ?? "").trim();
    const value = Number(r.value);
    const currency = String(r.currency ?? "NGN");
    if (label && Number.isFinite(value)) {
      out.push({ label, value, currency });
    }
  }
  return out;
}

/** Prefer top-level `figures`; else `data.figures` (common FastAPI wrapper). */
function figuresFromAskDocumentPayload(body: Record<string, unknown>): InsightAnswer["figures"] {
  const top = figuresFromChatData(body);
  if (top.length) return top;
  const d = body.data;
  if (d && typeof d === "object") return figuresFromChatData(d);
  return [];
}

const SUMMARY_KEYS = ["answer", "summary", "response", "message", "text"] as const;

function stringSummaryFromRecord(o: Record<string, unknown>): string | undefined {
  for (const k of SUMMARY_KEYS) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

/** FastAPI `ask-about-document` response shape is open; normalize to a summary string. */
function summaryFromAskDocumentBody(body: unknown): string {
  if (body == null) return "";
  if (typeof body === "string") return body;
  if (typeof body === "object") {
    const o = body as Record<string, unknown>;
    const top = stringSummaryFromRecord(o);
    if (top) return top;
    const data = o.data;
    if (data && typeof data === "object") {
      const nested = stringSummaryFromRecord(data as Record<string, unknown>);
      if (nested) return nested;
    }
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }
  return String(body);
}

function parseNumericDocumentId(documentId: string | undefined): number | null {
  if (!documentId?.trim()) return null;
  const n = Number(documentId.trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

export function InsightsChat({
  documentId,
  documentTitle,
  sectionId = "document-insights",
}: InsightsChatProps) {
  const mockOnly = useMockDataOnly();
  const numericDocId = parseNumericDocumentId(documentId);
  const documentScoped = Boolean(documentId?.trim());

  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<InsightAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = questionSchema.safeParse({ question: question.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid");
      return;
    }
    setError(null);

    if (mockOnly) {
      if (documentScoped && numericDocId != null) {
        setAnswer(mockDocumentAnswer(parsed.data.question, documentTitle, numericDocId));
      } else if (documentScoped) {
        setAnswer(
          insightAnswerSchema.parse({
            question: parsed.data.question,
            summary: `Mock: "${documentTitle ?? "This upload"}" uses a non-numeric id in demo data. Use a real FastAPI document id (integer) for ask-about-document, or turn off mock mode.`,
            figures: [],
          }),
        );
      } else {
        setAnswer(mockAnswer(parsed.data.question));
      }
      return;
    }

    setLoading(true);
    try {
      if (documentScoped) {
        if (numericDocId == null) {
          throw new Error(
            "This document id is not a numeric FastAPI id. Open a document from the API-backed list, or ask from Insights without a document scope.",
          );
        }
        const res = await fetch("/api/bridge/chat/ask-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            document_id: numericDocId,
            question: parsed.data.question,
          }),
        });
        const json: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const detail =
            typeof (json as { detail?: string })?.detail === "string"
              ? (json as { detail: string }).detail
              : `Request failed (${res.status})`;
          throw new Error(detail);
        }
        const body = json as Record<string, unknown>;
        const summary = summaryFromAskDocumentBody(body);
        setAnswer(
          insightAnswerSchema.parse({
            question: parsed.data.question,
            summary,
            figures: figuresFromAskDocumentPayload(body),
          }),
        );
      } else {
        const res = await fetch("/api/bridge/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: parsed.data.question }),
        });
        const json: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const detail =
            typeof (json as { detail?: string })?.detail === "string"
              ? (json as { detail: string }).detail
              : `Request failed (${res.status})`;
          throw new Error(detail);
        }
        const body = json as { answer?: string; data?: Record<string, unknown> };
        const summary = typeof body.answer === "string" ? body.answer : "";
        setAnswer(
          insightAnswerSchema.parse({
            question: parsed.data.question,
            summary,
            figures: figuresFromChatData(body.data ?? {}),
          }),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const title = documentScoped
    ? documentTitle
      ? `Ask about this upload · ${documentTitle}`
      : "Ask about this upload"
    : "Ask the insight agent";

  const placeholder = documentScoped
    ? 'e.g. "What is the total on this invoice?" or "Summarize the line items."'
    : 'e.g. "How much did we spend on fuel this month?"';

  return (
    <div id={sectionId} className="scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              {title}
            </CardTitle>
            {documentScoped && numericDocId != null ? (
              <p className="text-muted-foreground text-xs">
                Document id <span className="font-mono text-foreground">{numericDocId}</span> ·
                routed to <code className="rounded bg-muted px-1">/api/v1/chat/ask-about-document</code>
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`insight-q-${sectionId}`}>Question</Label>
                <Textarea
                  id={`insight-q-${sectionId}`}
                  placeholder={placeholder}
                  className="min-h-[100px] resize-y"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                {error ? (
                  <p className="text-destructive text-sm" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="me-2 size-4 animate-spin" />}
                {mockOnly ? "Run demo answer" : documentScoped ? "Ask about upload" : "Ask (FastAPI)"}
              </Button>
            </form>
            <p className="text-muted-foreground mt-4 text-xs">
              {mockOnly ? (
                <>
                  Mock mode uses local sample data. Set{" "}
                  <code className="rounded bg-muted px-1">NEXT_PUBLIC_USE_MOCK_DATA=false</code> for
                  live FastAPI.
                </>
              ) : documentScoped ? (
                <>
                  Upload-scoped questions use the bridge{" "}
                  <code className="rounded bg-muted px-1">/api/bridge/chat/ask-document</code> →
                  FastAPI ask-about-document.
                </>
              ) : (
                <>
                  General questions use{" "}
                  <code className="rounded bg-muted px-1">/api/bridge/chat</code>; figures render when
                  the model returns a <code className="rounded bg-muted px-1">figures</code> array in{" "}
                  <code className="rounded bg-muted px-1">data</code>.
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[280px]">
          <CardHeader>
            <CardTitle className="text-base">Structured response</CardTitle>
          </CardHeader>
          <CardContent>
            {!answer ? (
              <p className="text-muted-foreground text-sm">
                Submit a question to preview JSON-shaped agent output.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase">Summary</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{answer.summary}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase">Figures</p>
                  <ul className="mt-2 space-y-2">
                    {answer.figures.map((f) => (
                      <li
                        key={f.label}
                        className="flex justify-between gap-4 text-sm tabular-nums"
                      >
                        <span>{f.label}</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: f.currency,
                          }).format(f.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <pre className="bg-muted max-h-48 overflow-auto rounded-lg p-3 text-xs">
                  {JSON.stringify(answer, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function scrollToInsightsSection(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}
