"use client";

import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

let toastListeners: ((toast: Toast) => void)[] = [];
let toastId = 0;

export function toast(opts: { type?: ToastType; title: string; description?: string }) {
  const t: Toast = {
    id: String(++toastId),
    type: opts.type || "info",
    title: opts.title,
    description: opts.description,
  };
  toastListeners.forEach((fn) => fn(t));
  return t;
}

toast.success = (title: string, description?: string) =>
  toast({ type: "success", title, description });
toast.error = (title: string, description?: string) =>
  toast({ type: "error", title, description });
toast.warning = (title: string, description?: string) =>
  toast({ type: "warning", title, description });
toast.info = (title: string, description?: string) =>
  toast({ type: "info", title, description });

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function subscribeToasts(fn: (toast: Toast) => void) {
  toastListeners.push(fn);
  return () => {
    toastListeners = toastListeners.filter((l) => l !== fn);
  };
}
