"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";

function ToastCard({
  toastId,
  title,
  message,
  variant,
  onDismiss,
}: {
  toastId: string;
  title: string;
  message: string;
  variant: "error" | "success";
  onDismiss: () => void;
}) {
  const [enter, setEnter] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnter(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role="alert"
      id={`toast-${toastId}`}
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 ease-out",
        enter
          ? "translate-x-0 translate-y-0 opacity-100"
          : "translate-x-4 translate-y-1 opacity-0",
        variant === "error" &&
          "border-destructive/45 bg-destructive/10 text-foreground ring-1 ring-destructive/25 dark:border-destructive/50 dark:bg-destructive/20 dark:ring-destructive/30",
        variant === "success" &&
          "border-emerald-500/40 bg-emerald-500/12 text-foreground ring-1 ring-emerald-500/25 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:ring-emerald-500/20",
      )}
    >
      <div className="flex gap-3">
        {variant === "error" ? (
          <AlertCircle
            className="text-destructive mt-0.5 size-5 shrink-0"
            aria-hidden
          />
        ) : (
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{message}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground -me-1 -mt-1 h-8 w-8 shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Fixed toast stack (Tailwind). Mount once inside the dashboard shell.
 */
export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed top-16 z-100 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 inset-e-4 sm:inset-e-6 sm:top-18"
    >
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toastId={t.id}
          title={t.title}
          message={t.message}
          variant={t.variant}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
    </div>
  );
}
