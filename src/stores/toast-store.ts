import { create } from "zustand";

export type ToastVariant = "error" | "success";

export type ToastItem = {
  id: string;
  title: string;
  message: string;
  variant: ToastVariant;
};

const DEFAULT_MS = 6500;

const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

let toastSeq = 0;

type ToastState = {
  toasts: ToastItem[];
  pushError: (title: string, message: string) => void;
  pushSuccess: (title: string, message: string) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushError: (title, message) => {
    const id = `toast_${++toastSeq}_${Date.now()}`;
    set((s) => ({
      toasts: [...s.toasts, { id, title, message, variant: "error" }],
    }));
    const tid = setTimeout(() => {
      dismissTimers.delete(id);
      get().dismiss(id);
    }, DEFAULT_MS);
    dismissTimers.set(id, tid);
  },
  pushSuccess: (title, message) => {
    const id = `toast_${++toastSeq}_${Date.now()}`;
    set((s) => ({
      toasts: [...s.toasts, { id, title, message, variant: "success" }],
    }));
    const tid = setTimeout(() => {
      dismissTimers.delete(id);
      get().dismiss(id);
    }, DEFAULT_MS);
    dismissTimers.set(id, tid);
  },
  dismiss: (id) => {
    const tid = dismissTimers.get(id);
    if (tid) clearTimeout(tid);
    dismissTimers.delete(id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
