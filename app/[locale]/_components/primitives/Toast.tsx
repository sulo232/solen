"use client";

import * as React from "react";
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * V3 Toast primitive — LIVE_TRUTH §F.4.
 *
 * Hand-rolled queue + Context per §F.4.7 — `react-aria-components` exports only
 * `UNSTABLE_Toast*` at v1.16.0, locking ourselves in is risky. Hand-roll achieves
 * the same UX with stable API + zero new dependencies.
 *
 * Architecture:
 *   <ToastProvider> in app root layout
 *   ↓
 *   useToast() hook in any client component → returns { success, info, warning, error, custom }
 *   ↓
 *   queue manager: max 3 visible, FIFO beyond, per-toast setTimeout for auto-dismiss
 *   ↓
 *   ToastRegion renders fixed bottom-right (desktop) / bottom-center (mobile)
 *
 * @example
 * // In app/[locale]/layout.tsx:
 * <ToastProvider>{children}</ToastProvider>
 *
 * // In any component:
 * const toast = useToast();
 * toast.success({ title: "Look gespeichert", action: "Anzeigen", onAction: navigateToSaved });
 * toast.error({ title: "Buchung fehlgeschlagen", action: "Erneut versuchen", onAction: retry });
 */

export type ToastTone = "success" | "info" | "warning" | "error";

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional action button label (right-aligned text-only button). */
  action?: React.ReactNode;
  /** Fires when action button is clicked. Toast dismisses after. */
  onAction?: () => void;
  /**
   * Auto-dismiss timer in ms. Defaults per tone:
   * success/info = 3000, warning = 6000, error = Infinity (sticky).
   * Pass `Infinity` to make non-error toasts sticky.
   */
  duration?: number;
  /** ARIA: override auto-derived live region. Defaults: error="assertive", others="polite". */
  ariaLive?: "polite" | "assertive";
}

interface InternalToast extends ToastOptions {
  id: string;
  tone: ToastTone;
  createdAt: number;
}

interface ToastContextValue {
  success: (opts: ToastOptions) => string;
  info: (opts: ToastOptions) => string;
  warning: (opts: ToastOptions) => string;
  error: (opts: ToastOptions) => string;
  custom: (tone: ToastTone, opts: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;
const DEFAULT_DURATIONS: Record<ToastTone, number> = {
  success: 3000,
  info: 3000,
  warning: 6000,
  error: Infinity,
};

let idCounter = 0;
const nextId = () => `toast-${Date.now()}-${++idCounter}`;

/* ================================================================================
   ToastProvider — render once at app root, manages queue + portal
   ================================================================================ */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);
  const [queue, setQueue] = React.useState<InternalToast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
    setQueue([]);
  }, []);

  // When a visible slot opens, pull from queue
  React.useEffect(() => {
    if (toasts.length < MAX_VISIBLE && queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setToasts((prev) => [...prev, next]);
    }
  }, [toasts.length, queue]);

  const enqueue = React.useCallback((tone: ToastTone, opts: ToastOptions) => {
    const id = nextId();
    const toast: InternalToast = {
      ...opts,
      id,
      tone,
      createdAt: Date.now(),
    };
    setToasts((prev) => {
      // Error tone priority: replace oldest non-error if queue full
      if (prev.length >= MAX_VISIBLE) {
        if (tone === "error") {
          const oldestNonErrorIdx = prev.findIndex((t) => t.tone !== "error");
          if (oldestNonErrorIdx >= 0) {
            return [...prev.slice(0, oldestNonErrorIdx), ...prev.slice(oldestNonErrorIdx + 1), toast];
          }
        }
        // Otherwise queue it
        setQueue((q) => [...q, toast]);
        return prev;
      }
      return [...prev, toast];
    });
    return id;
  }, []);

  const value = React.useMemo<ToastContextValue>(
    () => ({
      success: (opts) => enqueue("success", opts),
      info: (opts) => enqueue("info", opts),
      warning: (opts) => enqueue("warning", opts),
      error: (opts) => enqueue("error", opts),
      custom: (tone, opts) => enqueue(tone, opts),
      dismiss,
      dismissAll,
    }),
    [enqueue, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ================================================================================
   useToast — hook for triggering toasts from any client component
   ================================================================================ */

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() must be called inside <ToastProvider>");
  }
  return ctx;
}

/* ================================================================================
   ToastRegion — fixed-position container, rendered by ToastProvider
   ================================================================================ */

function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: InternalToast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <ol
      role="region"
      aria-label="Benachrichtigungen"
      className={cn(
        "fixed z-toast pointer-events-none",
        // mobile: bottom-center, full-width minus 16px each side, safe-area-aware
        "bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))] left-4 right-4",
        "flex flex-col gap-2",
        // desktop: bottom-right, max 480px
        "md:bottom-6 md:right-6 md:left-auto md:items-end",
        "md:max-w-[480px]",
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </ol>
  );
}

/* ================================================================================
   ToastItem — single toast with auto-dismiss timer + hover-pause
   ================================================================================ */

const toastVariants = cva(
  cn(
    "relative pointer-events-auto",
    "flex items-start gap-3",
    "bg-s-bg-base rounded-[12px]",
    "shadow-elevation-3",
    "py-3.5 pr-4 pl-5",
    "w-full md:max-w-[480px] md:min-w-[280px]",
    "overflow-hidden",
    // entry/exit motion
    "transition-all duration-200 ease-snap",
    "data-[state=opening]:opacity-0 data-[state=opening]:translate-y-5",
    "data-[state=open]:opacity-100 data-[state=open]:translate-y-0",
    "data-[state=dismissing]:opacity-0 data-[state=dismissing]:-translate-y-2.5 data-[state=dismissing]:duration-150",
    "motion-reduce:transition-opacity motion-reduce:duration-100",
    "motion-reduce:data-[state=opening]:translate-y-0",
    "motion-reduce:data-[state=dismissing]:translate-y-0",
    // tone-bar (left edge)
    "before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1",
  ),
  {
    variants: {
      tone: {
        success: "before:bg-s-success",
        info: "before:bg-s-brand",
        warning: "before:bg-s-warning",
        error: "before:bg-s-error",
      },
    },
  },
);

const iconColorMap: Record<ToastTone, string> = {
  success: "text-s-success",
  info: "text-s-brand",
  warning: "text-s-warning",
  error: "text-s-error",
};

const IconMap: Record<ToastTone, React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: InternalToast;
  onDismiss: (id: string) => void;
}) {
  const [state, setState] = React.useState<"opening" | "open" | "dismissing">("opening");
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = React.useRef<number>(
    toast.duration ?? DEFAULT_DURATIONS[toast.tone],
  );
  const startTimeRef = React.useRef<number>(0);

  // Trigger opening → open transition on mount
  React.useEffect(() => {
    const t = setTimeout(() => setState("open"), 16);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss timer
  const startTimer = React.useCallback(() => {
    if (remainingRef.current === Infinity) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      setState("dismissing");
      setTimeout(() => onDismiss(toast.id), 150);
    }, remainingRef.current);
  }, [onDismiss, toast.id]);

  const pauseTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
  }, []);

  React.useEffect(() => {
    if (state === "open" && !isPaused) startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, isPaused, startTimer]);

  const handleDismiss = React.useCallback(() => {
    setState("dismissing");
    setTimeout(() => onDismiss(toast.id), 150);
  }, [onDismiss, toast.id]);

  const handleAction = React.useCallback(() => {
    toast.onAction?.();
    handleDismiss();
  }, [toast, handleDismiss]);

  const Icon = IconMap[toast.tone];

  const ariaLive: "polite" | "assertive" = toast.ariaLive
    ?? (toast.tone === "error" ? "assertive" : "polite");

  const role = toast.tone === "error" ? "alert" : "status";

  return (
    <li
      role={role}
      aria-live={ariaLive}
      data-state={state}
      onMouseEnter={() => {
        pauseTimer();
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        setIsPaused(false);
      }}
      className={toastVariants({ tone: toast.tone })}
    >
      <span className={cn("flex-shrink-0 pt-px", iconColorMap[toast.tone])}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-body font-semibold text-[14px] leading-[1.3] text-s-ink">
          {toast.title}
        </div>
        {toast.description && (
          <div className="font-body font-normal text-[12px] leading-[1.4] text-s-ink-3 mt-0.5">
            {toast.description}
          </div>
        )}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={handleAction}
          className={cn(
            "flex-shrink-0 bg-transparent border-0 cursor-pointer",
            "font-body font-semibold text-[13px] text-s-brand",
            "hover:text-s-ink transition-colors duration-150 ease-snap",
            "px-1 py-0.5 rounded-sm",
            "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
          )}
        >
          {toast.action}
        </button>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Schließen"
        className={cn(
          "flex-shrink-0 flex items-center justify-center",
          "w-8 h-8 -my-2 -mr-2.5 bg-transparent border-0 cursor-pointer",
          "text-s-ink-3 hover:text-s-ink",
          "transition-colors duration-150 ease-snap",
          "rounded-md",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
        )}
      >
        <X className="w-4 h-4" strokeWidth={2} aria-hidden />
      </button>
    </li>
  );
}
