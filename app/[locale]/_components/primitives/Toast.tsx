"use client";

// V3-D195 (2026-05-26): rebuilt as module-singleton + Toaster portal.
// V3-D196 (2026-05-26): tone-specific bg colors + icons per user "error
// universally recognized as red." Toast tones now use semantic-color bg
// (signal-as-bg, sanctioned per §10 update) instead of all-ink with a dot.
import * as React from "react";
import { createPortal } from "react-dom";
import { Check, X, AlertTriangle, Info, type LucideIcon } from "lucide-react";
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
  /** Optional action. When set, the WHOLE toast becomes tappable (mobile-first):
   *  tapping anywhere fires onClick + dismisses, and a chevron renders as the
   *  "tap to open" affordance. The label also shows as small underlined text. */
  action?: ToastAction;
  /** Optional rich description below the title. */
  description?: React.ReactNode;
  /** Override auto-dismiss in ms. Default 4000. Pass `Infinity` for sticky. */
  duration?: number;
  /** Override aria-live. Default `polite` for default/info/success/warning, `assertive` for error. */
  ariaLive?: "polite" | "assertive";
  /** Override the leading icon (else the tone icon, or none for `default`).
   *  Use for semantic moments like a saved-heart (pass `Heart`). */
  icon?: LucideIcon;
  /** className for the custom `icon` (color it, e.g. "fill-[#FF3366] text-[#FF3366]"). */
  iconClassName?: string;
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
  success: Check,
  error: X,
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
      icon: options.icon,
      iconClassName: options.iconClassName,
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
// V3-D462 (2026-06-13): owner-locked to the Chime/Google-Photos recipe — a CLEAN
// LIGHT pill (white, hairline, soft shadow), a colored CIRCLE BADGE icon (tint
// circle + saturated glyph), ink text, one blue action (no underline, no chevron),
// docked at the BOTTOM. Replaces the pastel-whole-pill tints (read too heavy).
const TOAST_PILL = cn(
  "pointer-events-auto",
  "flex items-center gap-3",
  "rounded-[16px]",
  "shadow-elevation-3",
  "px-4 py-3",
  "w-full md:max-w-[420px] md:min-w-[280px]",
  "bg-white border border-s-border text-s-ink",
);

// Circle-badge per tone: tint bg + saturated glyph (the "look here" signal).
const toneBadge: Record<Exclude<ToastTone, "default">, { bg: string; fg: string }> = {
  success: { bg: "bg-s-success-bg", fg: "text-s-success" },
  error:   { bg: "bg-s-error-bg",   fg: "text-s-error" },
  warning: { bg: "bg-s-warning-bg", fg: "text-s-warning" },
  info:    { bg: "bg-s-accent-pale", fg: "text-s-accent" },
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
        // V3-D462: docked at the BOTTOM (thumb reach for the tappable action),
        // safe-area aware. Center on mobile, right-bias on desktop.
        "bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))]",
        "left-4 right-4",
        "flex flex-col-reverse gap-2 items-center",
        "md:bottom-6 md:left-auto md:right-6 md:items-end",
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
//   exit:  opacity 1 → 0 over 150ms ease-thud (cubic-bezier(0.7,0,0.84,0)) , THE CURVE RULE
//   (MOTION.md, 2026-07-25): exits accelerate; was ease-glide, the decelerate curve.

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

  // Mobile-first: if the toast has an action, tapping ANYWHERE on it fires the
  // action (then dismisses). Without an action, tapping just dismisses.
  const handleClick = () => {
    t.action?.onClick();
    setState("exiting");
  };

  // The label button stops propagation so the row handler doesn't double-fire.
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
        // V3-D462: slide up from below (bottom-docked), spring-settle.
        transform: state === "open" ? "translateY(0)" : "translateY(20px)",
        transition:
          state === "exiting"
            // THE CURVE RULE (MOTION.md, 2026-07-25): exits accelerate on `thud`, was `glide`
            // (the decelerate curve, so the dismissed toast used to visibly slow down leaving).
            ? "opacity 150ms cubic-bezier(0.7, 0, 0.84, 0)"
            : "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        willChange: "transform, opacity",
      }}
      className={cn(
        TOAST_PILL,
        "cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
      )}
    >
      {/* V3-D462: circle-badge — tint circle + saturated glyph (Chime-style). */}
      {t.tone !== "default" && (() => {
        const tone = t.tone as Exclude<ToastTone, "default">;
        const Glyph = t.icon ?? toneIcon[tone];
        const badge = toneBadge[tone];
        return (
          <span
            aria-hidden
            className={cn(
              "flex-shrink-0 grid place-items-center rounded-full w-[26px] h-[26px]",
              t.iconClassName ?? cn(badge.bg, badge.fg),
            )}
          >
            <Glyph size={15} strokeWidth={1.9} aria-hidden />
          </span>
        );
      })()}
      <div className="flex-1 min-w-0">
        <div className="font-body font-semibold text-[14px] leading-[1.35] text-s-ink">
          {t.title}
        </div>
        {t.description && (
          <div className="mt-0.5 font-body font-normal text-[13px] leading-[1.4] text-s-ink-2">
            {t.description}
          </div>
        )}
      </div>
      {t.action && (
        <button
          type="button"
          onClick={handleActionClick}
          className={cn(
            "flex-shrink-0 self-center whitespace-nowrap",
            "font-body font-semibold text-[14px] text-s-accent",
            "bg-transparent border-0 cursor-pointer px-1 py-0.5 rounded-sm",
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
