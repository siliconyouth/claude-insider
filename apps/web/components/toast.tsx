"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";

// Toast types
export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// No-op fallback for SSR/SSG when ToastProvider is not available
const noopToast: ToastContextValue = {
  toasts: [],
  addToast: () => "",
  removeToast: () => {},
  success: () => "",
  error: () => "",
  info: () => "",
  warning: () => "",
};

// Hook to use toast - returns safe no-op during SSR/SSG
export function useToast() {
  const context = useContext(ToastContext);
  // Return no-op fallback during SSR/SSG instead of throwing
  // This allows pages using useToast to be statically generated
  if (!context) {
    return noopToast;
  }
  return context;
}

// Toast icons
const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case "success":
      return (
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case "error":
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case "warning":
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case "info":
    default:
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

// Individual toast component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onRemove, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onRemove, 200);
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 w-full max-w-sm p-4 rounded-xl",
        "bg-white dark:bg-[#1a1a1a]",
        "border border-gray-200 dark:border-[#262626]",
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        "transition-all duration-200",
        isExiting
          ? "opacity-0 translate-x-4"
          : "opacity-100 translate-x-0 animate-slide-in-right"
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {toast.title}
        </p>
        {toast.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={handleClose}
        className={cn(
          "flex-shrink-0 p-1 rounded-lg",
          "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
          "hover:bg-gray-100 dark:hover:bg-[#262626]",
          "transition-colors"
        )}
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Toast container
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// Toast provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => addToast({ type: "success", title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => addToast({ type: "error", title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast({ type: "info", title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => addToast({ type: "warning", title, description }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Standalone toast function (for use outside React components)
let toastFn: ToastContextValue | null = null;

export function setToastHandler(handler: ToastContextValue) {
  toastFn = handler;
}

export const toast = {
  success: (title: string, description?: string) => toastFn?.success(title, description),
  error: (title: string, description?: string) => toastFn?.error(title, description),
  info: (title: string, description?: string) => toastFn?.info(title, description),
  warning: (title: string, description?: string) => toastFn?.warning(title, description),
};
