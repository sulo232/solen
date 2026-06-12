"use client";

// V3-D195 (2026-05-26): rebuilt as module-singleton + Toaster portal.
// V3-D196 (2026-05-26): tone-specific bg colors + icons per user "error
// universally recognized as red." Toast tones now use semantic-color bg
// (signal-as-bg, sanctioned per §10 update) instead of all-ink with a dot.
import * as React from "react";
import { createPortal } from "react-dom";
import { cva } from "class-variance-authority";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V3-D195 Toast primitive — SOURCE.md §10 (async state grammar) + §11 (Coming Soon affordance).
 *
 * Rebuilt 2026-05-26 from the V3-F.4 rich-context primitive into a module-level
 * singleton + `<Toaster />` portal. Motivations:
 *
 * 1. **String-first API.** Most callers want `toast.success("Gespeichert")` not
 *    `toast.success({ title: "Gespeichert" })`. New API accepts string OR options.
 * 2. **Top-of-viewport slide-down.** Brand register: notifications appear ABOVE the
 *    content, slide in from y:-20, instead of "bottom toast" which competes with
 *    sticky CTAs and the iOS home-indicator zone.
 * 3. **Module-level store.** `toast.success()` works from anywhere (event handlers,
 *    server-action callbacks, future server-action useFormState handlers) without
 *    needing a `useToast()` hook + Provider. The `<Toaster />` portal subscribes
 *    via React.useSyncExternalStore.
 * 4. **Signal-as-data dot per §1.** Variant communicates state via a SMALL colored
 *    dot (10px) — body stays ink. Honours the locked B&W chrome rule: green/blue/red
 *    are signal moments, not surface tints.
 *
 * **Back-compat:** `ToastProvider` + `useToast()` still exported as thin wrappers that
 * delegate to the singleton. `dev/primitives/page.tsx` keeps working without edits.
 *
 * @example new singleton API (preferred)
 *   import { toast, Toaster } from "@/app/[locale]/_components/primitives/Toast";
 *   // mount once at root layout:
 *   <Toaster />
 *   // fire from anywhere:
 *   toast.success("Look gespeichert");
 *   toast.error("Buchung fehlgeschlagen");
 *   toast.info("Diese Funktion kommt bald", { action: { label: "Mehr", onClick: showDetails } });
 *
 * @example back-compat (existing callers)
 *   const t = useToast();
 *   t.success({ title: "Foo", description: "Bar", action: "Undo", onAction: undo });
 */

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type ToastTone = "default" | "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Optional structured action button. Renders as small underlined ink text. */
  action?: ToastAction;
  /** Optional rich description below the title. */
  description?: React.ReactNode;
  /** Override auto-dismiss in ms. Default 4000. Pass `Infinity` for sticky. */
  duration?: number;
  /** Override aria-live. Default `polite` for default/info/success/warning, `assertive` for error. */
  ariaLive?: "polite" | "assertive";
}

interface InternalToast extends ToastOptions {
  id: string;
  tone: ToastTone;
  title: React.ReactNode;
  createdAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

// V3-D196: icon per tone. Universal recognition pattern (Apple/iOS/sonner/etc).
const toneIcon: Record<Exclude<ToastTone, "default">, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

// ─────────────────────────────────────────────────────────────────────────────
// Module-level store (singleton)
// ─────────────────────────────────────────────────────────────────────────────

type Listener = () => void;

class ToastStore {
  private toasts: InternalToast[] = [];
  private listeners = new Set<Listener>();
  private counter = 0;

  getSnapshot = (): readonly InternalToast[] => this.toasts;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private nextId() {
    this.counter += 1;
    return `toast-${Date.now()}-${this.counter}`;
  }

  push(tone: ToastTone, title: React.ReactNode, options: ToastOptions = {}): string {
    const id = this.nextId();
    const next: InternalToast = {
      id,
      tone,
      title,
      createdAt: Date.now(),
      duration: options.duration ?? DEFAULT_DURATION,
      action: options.action,
      description: options.description,
      ariaLive: options.ariaLive,
    };

    // Stack: keep newest at the TOP, drop oldest when over MAX_VISIBLE.
    this.toasts = [next, ...this.toasts].slice(0, MAX_VISIBLE);
    this.notify();
    return id;
  }

  dismiss(id?: string) {
    if (id === undefined) {
      this.toasts = [];
    } else {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }
    this.notify();
  }
}

const store = new ToastStore();

// ─────────────────────────────────────────────────────────────────────────────
// Public singleton API: `toast.success(msg)` / `toast.error(msg)` / etc.
// ─────────────────────────────────────────────────────────────────────────────

function buildToast(tone: ToastTone) {
  return (message: React.ReactNode, options?: ToastOptions): string =>
    store.push(tone, message, options);
}

export const toast = {
  /** Default ink-on-white. No dot. Generic neutral notice. */
  show: buildToast("default"),
  /** Green dot — operation succeeded. */
  success: buildToast("success"),
  /** Red dot — operation failed. Defaults to `aria-live="assertive"`. */
  error: buildToast("error"),
  /** Royal blue dot (s-accent) — informational / Coming Soon affordance. */
  info: buildToast("info"),
  /** Amber dot — non-blocking warning. */
  warning: buildToast("warning"),
  /** Dismiss a single toast by id, or all if id omitted. */
  dismiss: (id?: string) => store.dismiss(id),
};

// ─────────────────────────────────────────────────────────────────────────────
// <Toaster /> — single portal component, mounted once at root
// ─────────────────────────────────────────────────────────────────────────────

// V3-D198 (2026-05-26): Tailwind UI / Stripe pastel pattern — saturated solids
// (V3-D196) read as Material-2014, too deep for the Uber/Revolut refined vibe.
// Now: pastel `.bg` token + ink text + colored icon. Universal recognition via
// icon shape + bg tint, not screamy saturated solid.
const toastItemVariants = cva(
  cn(
    "pointer-events-auto",
    "flex items-start gap-3",
    "rounded-[14px]",
    "shadow-elevation-3",
    "px-4 py-3",
    "w-full md:max-w-[420px] md:min-w-[280px]",
    "border", // hairline border picks up bg-derived tone via per-variant class
  ),
  {
    variants: {
      tone: {
        // Default toast is still ink (catch-all / generic) — chrome-grade
        default: "bg-s-ink text-white border-transparent",
        // Pastel tints + ink text + bordered. Refined modern fintech pattern.
        success: "bg-s-success-bg text-s-ink border-s-success/15",
        error:   "bg-s-error-bg text-s-ink border-s-error/15",
        warning: "bg-s-warning-bg text-s-ink border-s-warning/20",
        info:    "bg-s-accent-pale text-s-ink border-s-accent/15",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

// V3-D198: icon color per tone (saturated tokens — they're the "look here" signal).
const toneIconColor: Record<Exclude<ToastTone, "default">, string> = {
  success: "text-s-success",
  error: "text-s-error",
  warning: "text-s-warning",
  info: "text-s-accent",
};

export function Toaster() {
  const toasts = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  // Only mount the portal on the client.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <ol
      role="region"
      aria-label="Benachrichtigungen"
      className={cn(
        "fixed z-toast pointer-events-none",
        // Top-of-viewport, safe-area aware. Center on mobile, slight right-bias on desktop.
        "top-[max(1rem,calc(env(safe-area-inset-top)+1rem))]",
        "left-4 right-4",
        "flex flex-col gap-2 items-center",
        "md:top-6 md:left-auto md:right-6 md:items-end",
        "md:max-w-[420px]",
      )}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </ol>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ToastItem — renders one toast with auto-dismiss + CSS-driven entrance/exit
// ─────────────────────────────────────────────────────────────────────────────
//
// We use a simple 3-state machine (entering → open → exiting) with CSS transitions
// on transform + opacity. Why not motion/react: the AnimatePresence+portal+
// useSyncExternalStore combo had presence-detection issues in this environment.
// CSS transitions are equally smooth, render-cheaper, and pair with the global
// `prefers-reduced-motion` override at globals.css:681 without library quirks.
//
// Motion vocabulary (SOURCE.md §6.1 + §6.2):
//   enter: y:-20 → 0, opacity 0 → 1 over 200ms ease-snap (cubic-bezier(0.4,0,0.2,1))
//   exit:  opacity 1 → 0 over 150ms ease-glide (cubic-bezier(0.16,1,0.3,1))

type AnimState = "entering" | "open" | "exiting";

function ToastItem({ toast: t }: { toast: InternalToast }) {
  const [state, setState] = React.useState<AnimState>("entering");
  const duration = t.duration ?? DEFAULT_DURATION;

  // entering → open after one frame (gives the browser one frame to paint the
  // initial state before transitioning).
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setState("open"));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss timer fires `exiting`, then unmount via store.dismiss after the
  // exit-transition duration (150ms).
  React.useEffect(() => {
    if (state !== "open") return;
    if (duration === Infinity) return;
    const exitTimer = window.setTimeout(() => setState("exiting"), duration);
    return () => window.clearTimeout(exitTimer);
  }, [state, duration]);

  React.useEffect(() => {
    if (state !== "exiting") return;
    const unmount = window.setTimeout(() => store.dismiss(t.id), 150);
    return () => window.clearTimeout(unmount);
  }, [state, t.id]);

  const ariaLive: "polite" | "assertive" =
    t.ariaLive ?? (t.tone === "error" ? "assertive" : "polite");
  const role = t.tone === "error" ? "alert" : "status";

  const handleClick = () => {
    setState("exiting");
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    t.action?.onClick();
    setState("exiting");
  };

  return (
    <li
      role={role}
      aria-live={ariaLive}
      onClick={handleClick}
      data-state={state}
      style={{
        // Inline styles give the most reliable transition (no CSS-class-purge risk).
        opacity: state === "open" ? 1 : 0,
        // idea 10 (motion 22): tilt-settle — enters with a 2deg tilt and springs straight
        transform: state === "open" ? "translateY(0) rotate(0deg)" : "translateY(-20px) rotate(2deg)",
        transition:
          state === "exiting"
            ? "opacity 150ms cubic-bezier(0.16, 1, 0.3, 1)"
            : "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        willChange: "transform, opacity",
      }}
      className={cn(
        toastItemVariants({ tone: t.tone }),
        "cursor-pointer select-none",
        // V3-D198: pastel toasts (success/error/warning/info) all use ink-tone focus ring.
        // Only `default` (ink bg) needs white ring.
        t.tone === "default"
          ? "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          : "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
      )}
    >
      {/* V3-D198: lucide icon — saturated tone color provides the "look here" signal
          while text/bg stay refined. */}
      {t.tone !== "default" && (() => {
        const Icon = toneIcon[t.tone];
        return (
          <Icon
            size={20}
            strokeWidth={2.25}
            aria-hidden
            className={cn("mt-[1px] flex-shrink-0", toneIconColor[t.tone])}
          />
        );
      })()}
      <div className="flex-1 min-w-0">
        {/* V3-D198: title + description always ink on pastel; white on ink default. */}
        <div className={cn(
          "font-body font-medium text-[14px] leading-[1.35]",
          t.tone === "default" ? "text-white" : "text-s-ink",
        )}>
          {t.title}
        </div>
        {t.description && (
          <div className={cn(
            "mt-0.5 font-body font-normal text-[13px] leading-[1.4]",
            t.tone === "default" ? "text-white/70" : "text-s-ink-2",
          )}>
            {t.description}
          </div>
        )}
      </div>
      {t.action && (
        <button
          type="button"
          onClick={handleActionClick}
          className={cn(
            "flex-shrink-0 self-start",
            "font-body font-semibold text-[13px]",
            "underline underline-offset-[3px]",
            // Default (ink bg) → white text + white underline. Pastel → ink text + ink underline.
            t.tone === "default"
              ? "text-white decoration-white/60 hover:decoration-white"
              : "text-s-ink decoration-s-ink/40 hover:decoration-s-ink",
            "bg-transparent border-0 cursor-pointer",
            "px-1 py-0.5 rounded-sm",
            t.tone === "default"
              ? "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
              : "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
            "transition-[text-decoration-color] duration-150",
          )}
        >
          {t.action.label}
        </button>
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Back-compat: ToastProvider + useToast() — preserve the rich-options form used
// by dev/primitives/page.tsx. These delegate to the singleton; the Provider
// just renders `<Toaster />` once and exposes the same context shape.
// ─────────────────────────────────────────────────────────────────────────────

interface LegacyToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
  duration?: number;
  ariaLive?: "polite" | "assertive";
}

interface ToastContextValue {
  success: (opts: LegacyToastOptions) => string;
  info: (opts: LegacyToastOptions) => string;
  warning: (opts: LegacyToastOptions) => string;
  error: (opts: LegacyToastOptions) => string;
  custom: (tone: ToastTone, opts: LegacyToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

function adaptLegacy(tone: ToastTone, opts: LegacyToastOptions): string {
  // Convert the rich legacy `action` ReactNode + `onAction` callback to the new
  // structured ToastAction shape. Only fire the action handler if it's a string label.
  const actionLabel =
    typeof opts.action === "string"
      ? opts.action
      : opts.action != null
        ? String(opts.action)
        : undefined;
  return store.push(tone, opts.title, {
    description: opts.description,
    duration: opts.duration,
    ariaLive: opts.ariaLive,
    action:
      actionLabel && opts.onAction
        ? { label: actionLabel, onClick: opts.onAction }
        : undefined,
  });
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value = React.useMemo<ToastContextValue>(
    () => ({
      success: (opts) => adaptLegacy("success", opts),
      info: (opts) => adaptLegacy("info", opts),
      warning: (opts) => adaptLegacy("warning", opts),
      error: (opts) => adaptLegacy("error", opts),
      custom: (tone, opts) => adaptLegacy(tone, opts),
      dismiss: (id) => store.dismiss(id),
      dismissAll: () => store.dismiss(),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (ctx) return ctx;
  // If used outside <ToastProvider>, return a singleton-backed implementation so
  // callers never crash. The new pattern doesn't require the Provider — only the
  // legacy callers do, and they all mount it.
  return {
    success: (opts) => adaptLegacy("success", opts),
    info: (opts) => adaptLegacy("info", opts),
    warning: (opts) => adaptLegacy("warning", opts),
    error: (opts) => adaptLegacy("error", opts),
    custom: (tone, opts) => adaptLegacy(tone, opts),
    dismiss: (id) => store.dismiss(id),
    dismissAll: () => store.dismiss(),
  };
}
