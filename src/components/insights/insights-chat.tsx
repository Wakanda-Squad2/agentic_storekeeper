"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { insightAnswerSchema, type InsightAnswer } from "@/schemas/financial";
import { z } from "zod";

const questionSchema = z.object({
  question: z.string().min(4, "Ask a fuller question"),
});

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
      : "Structured answers come from the Financial Insight Agent via FastAPI; this card shows the response shape.",
    figures: fuel
      ? [fuel]
      : [
          { label: "Example revenue YTD", value: 128400.55, currency: "USD" },
          { label: "Example expenses YTD", value: 76230.1, currency: "USD" },
        ],
  });
}

export function InsightsChat() {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<InsightAnswer | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = questionSchema.safeParse({ question: question.trim() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid");
      return;
    }
    setError(null);
    setAnswer(mockAnswer(parsed.data.question));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            Ask the insight agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insight-q">Question</Label>
              <Textarea
                id="insight-q"
                placeholder='e.g. "How much did we spend on fuel this month?"'
                className="min-h-[100px] resize-y"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit">Run demo answer</Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Replace the in-memory <code className="rounded bg-muted px-1">mockAnswer</code>{" "}
            with a request to your FastAPI insight endpoint; validate with{" "}
            <code className="rounded bg-muted px-1">insightAnswerSchema</code>.
          </p>
        </CardContent>
      </Card>

      <Card className="min-h-[280px]">
        <CardHeader>
          <CardTitle className="text-base">Structured response</CardTitle>
        </CardHeader>
        <CardContent>
          {!answer ? (
            <p className="text-sm text-muted-foreground">
              Submit a question to preview JSON-shaped agent output.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Summary
                </p>
                <p className="mt-1 text-sm">{answer.summary}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Figures
                </p>
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
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(answer, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
