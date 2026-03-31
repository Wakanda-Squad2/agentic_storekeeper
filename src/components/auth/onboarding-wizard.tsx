"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { StorekeeperLogo } from "@/components/brand/storekeeper-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Storekeeper",
    description:
      "Connect your organization so documents, agents, and dashboards stay isolated per tenant.",
  },
  {
    id: "organization",
    title: "Organization",
    description:
      "Choose a display name and a URL-safe tenant id (used in APIs and headers).",
  },
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [organizationName, setOrganizationName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function complete() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          tenantSlug: tenantSlug.trim().toLowerCase(),
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = data.detail;
        setError(
          typeof d === "string"
            ? d
            : "Could not finish onboarding — check fields (slug: lowercase, hyphens).",
        );
        return;
      }
      void qc.invalidateQueries({ queryKey: ["auth", "me"] });
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-shadow ${
              i === step
                ? "border-[rgba(108,59,255,0.25)] bg-primary/10 shadow-[0_0_16px_rgba(108,59,255,0.12)]"
                : "border-border/80 bg-card/60 text-muted-foreground"
            }`}
          >
            {i < step ? (
              <Check className="size-4 text-success" strokeWidth={2} />
            ) : (
              <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted/80 text-xs font-medium tabular-nums">
                {i + 1}
              </span>
            )}
            <span className="hidden sm:inline">{s.title}</span>
          </div>
        ))}
      </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(108,59,255,0.15)] bg-card shadow-[0_0_20px_rgba(108,59,255,0.08)] sm:size-14"
              aria-hidden
            >
              <StorekeeperLogo className="size-8 sm:size-9" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="font-heading text-xs font-medium uppercase tracking-[0.5px] text-muted-foreground">
                Storekeeper
              </p>
              <CardTitle>{steps[step].title}</CardTitle>
              <CardDescription>{steps[step].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {step === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                You will set your workspace name and tenant id on the next
                step. Nothing is stored until you finish.
              </p>
              <Button type="button" onClick={() => setStep(1)}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="org">Organization name</Label>
                <Input
                  id="org"
                  placeholder="e.g. Acme Finance"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Tenant slug</Label>
                <Input
                  id="slug"
                  placeholder="e.g. acme-finance"
                  value={tenantSlug}
                  onChange={(e) =>
                    setTenantSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-")
                        .replace(/-+/g, "-"),
                    )
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Sent as <code className="rounded bg-muted px-1">x-tenant-id</code>{" "}
                  to the API. Use lowercase letters, numbers, and hyphens.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  disabled={pending}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => void complete()}
                  disabled={
                    pending || organizationName.trim().length < 2 || tenantSlug.length < 2
                  }
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Finish and open dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
