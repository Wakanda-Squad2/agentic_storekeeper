import { create } from "zustand";

export type Tenant = { id: string; name: string };

const DEFAULT_TENANTS: Tenant[] = [
  { id: "demo-org", name: "Demo Organization" },
  { id: "acme-retail", name: "Acme Retail" },
  { id: "northwind", name: "Northwind Traders" },
];

type TenantState = {
  tenants: Tenant[];
  activeTenantId: string;
  /** Adds tenant to list if unknown (e.g. post-onboarding slug). */
  setActiveTenant: (id: string, displayName?: string) => void;
  hydrateFromCookie: () => void;
};

function readCookieTenantId(): string {
  if (typeof document === "undefined") return "demo-org";
  const match = document.cookie.match(/(?:^|; )tenant_id=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "demo-org";
}

export const useTenantStore = create<TenantState>((set, get) => ({
  tenants: DEFAULT_TENANTS,
  activeTenantId: "demo-org",
  hydrateFromCookie: () => {
    const id = readCookieTenantId();
    const list = get().tenants;
    const exists = list.some((t) => t.id === id);
    set({
      activeTenantId: id,
      tenants: exists ? list : [...list, { id, name: id }],
    });
  },
  setActiveTenant: (id, displayName) => {
    const list = get().tenants;
    const exists = list.some((t) => t.id === id);
    const tenants = exists
      ? list
      : [...list, { id, name: displayName ?? id }];
    if (typeof document !== "undefined") {
      document.cookie = `tenant_id=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
    }
    set({ tenants, activeTenantId: id });
  },
}));
