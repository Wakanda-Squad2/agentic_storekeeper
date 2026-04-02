"use client";

import { useEffect } from "react";
import { Building2, ChevronsUpDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/stores/tenant-store";
import { useAuth } from "@/hooks/use-auth";

export function TenantSwitcher() {
  const { user } = useAuth();
  const tenants = useTenantStore((s) => s.tenants);
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const setActiveTenant = useTenantStore((s) => s.setActiveTenant);
  const hydrateFromCookie = useTenantStore((s) => s.hydrateFromCookie);

  useEffect(() => {
    hydrateFromCookie();
  }, [hydrateFromCookie]);

  useEffect(() => {
    if (!user?.tenantId || user.tenantId === "pending") return;
    setActiveTenant(
      user.tenantId,
      user.organizationName ?? user.tenantId,
    );
  }, [user?.tenantId, user?.organizationName, setActiveTenant]);

  const active =
    tenants.find((t) => t.id === activeTenantId) ?? tenants[0];

  const label =
    user?.tenantId === "pending"
      ? "Complete onboarding"
      : (active?.name ?? "Organization");

  const showMenu = tenants.length > 1;

  const triggerClass = cn(
    buttonVariants({ variant: "outline" }),
    "h-9 gap-2 px-3 font-normal",
    !showMenu && "pointer-events-none cursor-default",
  );

  const triggerContent = (
    <>
      <Building2 className="size-4 shrink-0 opacity-70" />
      <span className="truncate">{label}</span>
      {showMenu ? (
        <ChevronsUpDown className="ms-auto size-4 shrink-0 opacity-50" />
      ) : null}
    </>
  );

  if (!showMenu) {
    return (
      <div
        className={triggerClass}
        role="status"
        aria-label="Current organization"
      >
        {triggerContent}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger type="button" className={triggerClass}>
        {triggerContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {tenants.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setActiveTenant(t.id, t.name)}
            className={t.id === active?.id ? "bg-accent" : ""}
          >
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
