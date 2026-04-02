import { create } from "zustand";

export type Tenant = { id: string; name: string };

type TenantState = {
  tenants: Tenant[];
  activeTenantId: string;
  /** Sets the active tenant and replaces the list with that single org (session is one tenant at a time). */
  setActiveTenant: (id: string, displayName?: string) => void;
  hydrateFromCookie: () => void;
};

function readCookieTenantId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )tenant_id=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  activeTenantId: "",
  hydrateFromCookie: () => {
    const id = readCookieTenantId();
    if (!id) return;
    set({
      activeTenantId: id,
      tenants: [{ id, name: id }],
    });
  },
  setActiveTenant: (id, displayName) => {
    const name = displayName?.trim() || id;
    if (typeof document !== "undefined") {
      document.cookie = `tenant_id=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
    }
    set({
      tenants: [{ id, name }],
      activeTenantId: id,
    });
  },
}));
