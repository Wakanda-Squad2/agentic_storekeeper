"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export function StorekeeperLogo({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `storekeeper-logo-grad-${uid}`;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6C3BFF" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path
        d="M6 10a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V10z"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 14h12M10 18h8"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type StorekeeperBrandProps = {
  className?: string;
  layout?: "vertical" | "horizontal";
  size?: "sm" | "md";
};

export function StorekeeperBrand({
  className,
  layout = "vertical",
  size = "md",
}: StorekeeperBrandProps) {
  const logoClass =
    size === "sm" ? "size-8" : layout === "vertical" ? "size-14" : "size-10";
  const titleClass =
    size === "sm"
      ? "text-base font-semibold tracking-[0.5px]"
      : "text-lg font-semibold tracking-[0.5px] md:text-xl";

  if (layout === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <StorekeeperLogo className={logoClass} />
        <span className={cn("font-heading text-foreground", titleClass)}>
          Storekeeper
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center gap-3 text-center", className)}
    >
      <StorekeeperLogo className={logoClass} />
      <span className={cn("font-heading text-foreground", titleClass)}>
        Storekeeper
      </span>
    </div>
  );
}
