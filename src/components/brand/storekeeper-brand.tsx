"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

/** Raster mark from `public/storekeeper-logo.png` (generated brand asset). */
export function StorekeeperLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-xl",
        className,
      )}
    >
      <Image
        src="/storekeeper-logo.png"
        alt=""
        fill
        className="object-contain"
        sizes="112px"
        priority
      />
    </span>
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
