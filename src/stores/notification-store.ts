import { create } from "zustand";

export type AlertKind = "success" | "error" | "info" | "warning";

export type AppNotification = {
  id: string;
  kind: AlertKind;
  title: string;
  message: string;
  at: number;
};

type State = {
  items: AppNotification[];
  push: (n: Omit<AppNotification, "id" | "at">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

let seq = 0;

export const useNotificationStore = create<State>((set) => ({
  items: [],
  push: (n) => {
    const id = `n_${++seq}_${Date.now()}`;
    set((s) => ({
      items: [
        { ...n, id, at: Date.now() },
        ...s.items,
      ].slice(0, 12),
    }));
  },
  dismiss: (id) =>
    set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
  clear: () => set({ items: [] }),
}));
