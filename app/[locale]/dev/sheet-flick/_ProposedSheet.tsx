"use client";

// PROVENANCE: extracted verbatim from `claude/context-compact-architecture-5d1ace` via
// `git show claude/context-compact-architecture-5d1ace:"app/[locale]/_components/primitives/Sheet.tsx"`,
// the LOCKFILE §16.5 velocity-aware gesture-release physics that never landed on main
// (`_plans/BRANCH_TRIAGE_2026-09-04.md`, "IMPORTANT AND MISSING"). ONLY compile fix applied:
// the stale `text-s-ink-3` token (removed on main 2026-07-27, color-tokens-04) swapped for its
// live numerically-identical sibling `text-s-ink-2` (#6B6B6B both, tailwind.config.js ~L124).
// The drag/spring physics below (§16.5.1-§16.5.8) is untouched. Dev-only comparison copy, never
// imported by production code, never registered in the primitives barrel.

import * as React from "react";
import {
  Modal as AriaModal,
  ModalOverlay,
  Dialog,
  Heading,
} from "react-aria-components";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { animate, type AnimationPlaybackControls } from "motion";
import { cn } from "@/lib/utils";

/**
 * V3 Sheet style variants — LIVE_TRUTH §F.3.
 *
 * Mobile-only bottom-anchored overlay. Inherits §F.2 modal's react-aria portal +
 * focus-trap + scroll-lock behavior, differs in CSS positioning (bottom-anchored vs
 * centered) and motion (translateY 100% → 0 vs scale 0.95 → 1). On desktop, callers
 * should use `useResponsiveOverlay()` to fall back to <Modal> per §F.3.7.
 *
 * Composition (V2-D17 sibling-not-wrapper):
 *   <Sheet isOpen={open} onOpenChange={setOpen} height="default">
 *     <SheetHeader title="Sortieren nach" />
 *     <SheetBody>...</SheetBody>
 *     <SheetCTARow>
 *       <button>Zurücksetzen</button>
 *       <button>Anwenden</button>
 *     </SheetCTARow>
 *   </Sheet>
 *
 * Motion: ease-glide entry 600ms (long-distance smooth), ease-snap exit 200ms.
 * `motion-reduce:` collapses to opacity-only fade.
 */
const sheetSurfaceVariants = cva(
  cn(
    // base — bottom-anchored, full-width, top-only radius
    "bg-s-bg-base rounded-t-[28px]",
    "shadow-[0_-4px_28px_rgba(50,47,44,0.12),0_-2px_8px_rgba(50,47,44,0.06)]",
    "flex flex-col overflow-hidden",
    "absolute bottom-0 left-0 right-0",
    // entry/exit motion via react-aria data attrs
    "transition-transform duration-[600ms] ease-glide",
    "data-[entering]:translate-y-full",
    "data-[exiting]:translate-y-full data-[exiting]:duration-200 data-[exiting]:ease-snap",
    // reduced motion: collapse to opacity-only, 100ms (per §F.3.8 + §24b.3)
    "motion-reduce:transition-opacity motion-reduce:duration-100",
    "motion-reduce:data-[entering]:translate-y-0 motion-reduce:data-[entering]:opacity-0",
    "motion-reduce:data-[exiting]:translate-y-0 motion-reduce:data-[exiting]:opacity-0",
  ),
  {
    variants: {
      height: {
        // auto-fits content (e.g. sort sheet w 4 radio rows)
        auto: "h-auto max-h-[calc(100dvh-64px)]",
        // default 75vh — most filter / share sheets
        default: "h-[75dvh] max-h-[calc(100dvh-64px)]",
        // 90vh — look-detail, content-heavy sheets
        full: "h-[90dvh] max-h-[calc(100dvh-64px)]",
      },
    },
    defaultVariants: {
      height: "default",
    },
  },
);

export type SheetHeight = NonNullable<VariantProps<typeof sheetSurfaceVariants>["height"]>;

export interface SheetProps {
  /** Controlled open state. Pair with `onOpenChange`. */
  isOpen?: boolean;
  /** Fires when the user opens or closes (X / escape / backdrop click). */
  onOpenChange?: (isOpen: boolean) => void;
  /**
   * Sheet height variant.
   * - `auto` — fits content (sort sheet w few rows)
   * - `default` — 75dvh (filter / share sheets)
   * - `full` — 90dvh (look-detail, content-heavy)
   */
  height?: SheetHeight;
  /** Whether clicking the backdrop dismisses. Default true. */
  isDismissable?: boolean;
  /** Whether Escape key dismisses. Default true. */
  keyboardDismissDisabled?: boolean;
  className?: string;
  overlayClassName?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * Solen V3 bottom sheet primitive (LIVE_TRUTH §F.3).
 *
 * Mobile-only (< 768px). Use `useResponsiveOverlay()` to render `<Modal>` on desktop.
 * Slides up from bottom edge with visual drag handle (no swipe gesture in v1 per §F.3.2).
 *
 * @example
 * const [open, setOpen] = React.useState(false);
 * <Sheet isOpen={open} onOpenChange={setOpen} height="default">
 *   <SheetHeader title="Filter" />
 *   <SheetBody>
 *     <PillGroup mode="multi">...</PillGroup>
 *   </SheetBody>
 *   <SheetCTARow layout="reset-and-primary">
 *     <button onClick={reset}>Zurücksetzen</button>
 *     <button onClick={apply}>47 Salons anzeigen</button>
 *   </SheetCTARow>
 * </Sheet>
 */
export function Sheet({
  isOpen,
  onOpenChange,
  height = "default",
  isDismissable = true,
  keyboardDismissDisabled = false,
  className,
  overlayClassName,
  children,
  ...ariaProps
}: SheetProps) {
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  // §16.1 (2026-06-11, owner-approved sheets mockup): the page behind an open
  // sheet steps back (translateY 10px + scale .965 + brightness .96) — Option B.
  // Targets #main-content (portals mount on <body>, so the sheet itself is
  // unaffected). Class + transition live in globals.css.
  React.useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (isOpen) main.classList.add("sheet-scale-back");
    else main.classList.remove("sheet-scale-back");
    return () => main.classList.remove("sheet-scale-back");
  }, [isOpen]);

  // §16.5 gesture-release physics (LOCKFILE, owner-approved 2026-07-10), supersedes
  // the old position-only "dy > 90px dismisses" rule. Tracks a short position and
  // timestamp history so release VELOCITY (not just where the drag stopped) drives
  // the dismiss/return-home decision, rubber-bands above home, and hands the
  // release velocity to a `motion` spring so the settle carries momentum instead
  // of restarting a CSS transition from zero.
  const currentDy = React.useRef(0);
  const historyRef = React.useRef<{ y: number; t: number }[]>([]);
  const controlsRef = React.useRef<AnimationPlaybackControls | null>(null);
  const draggingRef = React.useRef(false);
  const pointerStartY = React.useRef<number | null>(null);
  const dragBaseY = React.useRef(0);
  // Stashed intent of an in-flight settle spring (set right before it launches,
  // cleared on natural completion or once a real drag supersedes it). Lets a tap
  // that interrupts a settle resume the same decision instead of stranding the
  // sheet mid-transform (fix for the tap-during-settle freeze).
  const interruptedSettleRef = React.useRef<{ target: number; wasDismiss: boolean } | null>(null);
  // The currently-attached window listener pair, so an unmount mid-drag can
  // remove them even though onUp (which normally removes them) never fires.
  const activeListenersRef = React.useRef<{
    move: (ev: PointerEvent) => void;
    up: () => void;
  } | null>(null);

  const setTranslate = (dy: number) => {
    currentDy.current = dy;
    if (modalRef.current) modalRef.current.style.transform = `translateY(${dy}px)`;
  };
  const clearTranslate = () => {
    currentDy.current = 0;
    const el = modalRef.current;
    if (el) {
      el.style.transition = "";
      el.style.transform = "";
    }
  };

  // A drag-dismiss leaves the inline transform off-screen on purpose (the
  // dismiss settle's onComplete below fires onOpenChange(false) BEFORE
  // clearing it, so react-aria's exit unmounts the modal with no on-screen
  // flash). Precisely: the modal's own inline transition:none makes its
  // getAnimations() empty, so what holds isExiting for ~200ms is the sibling
  // BACKDROP's opacity transition; during that window the inline transform
  // still beats the data-[exiting] class, so the sheet stays pinned offscreen.
  // ModalOverlay then returns null (`!state.isOpen && !isExiting`), and a later
  // reopen mounts a brand-new element with no leftover inline style. Only the
  // ref-held offset needs resetting so a fresh drag does not compute stale dy.
  React.useEffect(() => {
    if (!isOpen) {
      currentDy.current = 0;
    }
  }, [isOpen]);

  // Unmount safety: a pointerdown mid-drag that never reaches pointerup (route
  // change away, sheet unmounted by a parent) must not leak the window
  // listeners or leave a spring running against a detached ref.
  React.useEffect(() => {
    return () => {
      const active = activeListenersRef.current;
      if (active) {
        window.removeEventListener("pointermove", active.move);
        window.removeEventListener("pointerup", active.up);
        activeListenersRef.current = null;
      }
      controlsRef.current?.stop();
    };
  }, []);

  const onGrabPointerDown = (e: React.PointerEvent) => {
    // §16.5.6 interruptibility: grabbing mid-settle stops the running spring and
    // resumes tracking FROM the live on-screen value (currentDy), never a jump
    // back to a logical 0.
    controlsRef.current?.stop();
    draggingRef.current = false;
    pointerStartY.current = e.clientY;
    dragBaseY.current = e.clientY - currentDy.current;
    historyRef.current = [{ y: e.clientY, t: e.timeStamp }];
    if (modalRef.current) modalRef.current.style.transition = "none";

    const onMove = (ev: PointerEvent) => {
      if (pointerStartY.current == null) return;
      const raw = ev.clientY - pointerStartY.current;
      // ~10px hysteresis before the sheet commits to following (protects taps/scroll).
      if (!draggingRef.current) {
        if (Math.abs(raw) < 10) return;
        draggingRef.current = true;
        // A real drag supersedes any settle this pointerdown interrupted; the
        // upcoming release makes a fresh decision, so the stashed one is stale.
        interruptedSettleRef.current = null;
      }
      // §16.5.1: last ~5 samples / ~100ms window, never just the last event pair.
      historyRef.current.push({ y: ev.clientY, t: ev.timeStamp });
      const cutoff = ev.timeStamp - 100;
      while (
        historyRef.current.length > 5 ||
        (historyRef.current.length > 1 && historyRef.current[0].t < cutoff)
      ) {
        historyRef.current.shift();
      }
      const dy = ev.clientY - dragBaseY.current;
      if (dy >= 0) {
        setTranslate(dy);
      } else {
        // §16.5.5 rubber-band above home: progressive resistance, never a hard stop.
        const dim = modalRef.current?.getBoundingClientRect().height || 1;
        const over = -dy;
        const c = 0.55;
        const follow = (over * dim * c) / (dim + c * over);
        setTranslate(-follow);
      }
    };

    // Launches (or re-launches) the settle spring toward `target` from the
    // live on-screen offset, stashing the intent first so a tap that
    // interrupts it (hysteresis never crossed, see the early-return branch of
    // onUp below) can resume the same decision instead of stranding the sheet.
    // Dismiss's onComplete fires onOpenChange(false) BEFORE clearing the
    // transform (fix for the on-screen flash: clearing first snaps the sheet
    // back on-screen synchronously, one frame before React processes the
    // close and react-aria's exit CSS re-slides it off).
    const launchSettle = (
      target: number,
      wasDismiss: boolean,
      velocity: number,
      bounce: number,
      duration: number,
    ) => {
      interruptedSettleRef.current = { target, wasDismiss };
      controlsRef.current = animate(currentDy.current, target, {
        type: "spring",
        bounce,
        duration,
        velocity,
        onUpdate: setTranslate,
        onComplete: () => {
          interruptedSettleRef.current = null;
          if (wasDismiss) {
            onOpenChange?.(false);
          } else {
            clearTranslate();
          }
        },
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      activeListenersRef.current = null;
      pointerStartY.current = null;
      if (!draggingRef.current) {
        // Never crossed hysteresis: a tap, not a drag.
        const interrupted = interruptedSettleRef.current;
        if (interrupted) {
          // The tap interrupted a running settle spring (stopped above at
          // pointerdown). Resume its intent at velocity 0 instead of leaving
          // the sheet frozen mid-transform with no pending onOpenChange and no
          // cleanup. transition stays "none" (set at pointerdown) so the
          // resumed spring's per-frame transform writes do not fight the CSS
          // entrance/exit transition.
          const { target, wasDismiss } = interrupted;
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (reducedMotion) {
            interruptedSettleRef.current = null;
            if (wasDismiss) {
              onOpenChange?.(false);
            } else {
              clearTranslate();
            }
            return;
          }
          launchSettle(target, wasDismiss, 0, wasDismiss ? 0.2 : 0, wasDismiss ? 0.3 : 0.4);
          return;
        }
        // No settle to resume: undo the transition:none set at pointerdown so
        // the entrance/exit CSS transitions stay live.
        if (modalRef.current) modalRef.current.style.transition = "";
        return;
      }

      const sheetHeight = modalRef.current?.getBoundingClientRect().height || 0;
      const dy = currentDy.current;

      // §16.5.1 release velocity, px/s, positive = downward, from the tracked history.
      const hist = historyRef.current;
      const oldest = hist[0];
      const newest = hist[hist.length - 1];
      const dt = newest.t - oldest.t;
      const vy = dt > 0 ? ((newest.y - oldest.y) / dt) * 1000 : 0;

      // §16.5.2 release decision: velocity first, position (projected) second.
      let dismiss: boolean;
      if (vy > 250) {
        dismiss = true;
      } else if (vy < -250) {
        dismiss = false;
      } else {
        const d = 0.998;
        const project = (v: number) => ((v / 1000) * d) / (1 - d);
        dismiss = dy + project(vy) > 0.25 * sheetHeight;
      }

      // §16.5.8 reduced motion: 1:1 tracking already happened, only the release
      // animation collapses (no spring, no overshoot).
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) {
        if (dismiss) {
          onOpenChange?.(false);
        } else {
          clearTranslate();
        }
        return;
      }

      // §16.5.3 / §16.5.4: settle spring seeded with the release velocity so it
      // carries momentum through instead of restarting from zero. Momentum
      // (bounce 0.2, 0.3s) is earned by a real flick; the slow projected
      // return stays critically damped (bounce 0, 0.4s) per the LOCKFILE
      // §16.5.4 house values table.
      if (dismiss) {
        launchSettle(sheetHeight || dy, true, vy, 0.2, 0.3);
      } else {
        const flickReturn = vy < -250;
        launchSettle(0, false, vy, flickReturn ? 0.2 : 0, flickReturn ? 0.3 : 0.4);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    activeListenersRef.current = { move: onMove, up: onUp };
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={keyboardDismissDisabled}
      className={cn(
        // backdrop: fixed inset, warm-ink dim + 4px blur, RELATIVE positioning context for sheet
        "fixed inset-0 z-sheet-bg",
        "bg-[rgba(26,18,9,0.40)] backdrop-blur-[4px]",
        // entry/exit fade
        "transition-opacity duration-300 ease-snap",
        "data-[entering]:opacity-0",
        "data-[exiting]:opacity-0 data-[exiting]:duration-200",
        overlayClassName,
      )}
    >
      <AriaModal ref={modalRef} className={cn(sheetSurfaceVariants({ height }), "z-sheet", className)}>
        <Dialog className="outline-none flex flex-col h-full overflow-hidden" {...ariaProps}>
          {/* Drag handle, §16.5: velocity + projected-position release (see
              onGrabPointerDown above). Generous hit zone, touch-action none so
              the browser doesn't scroll instead. */}
          <div
            className="flex cursor-grab touch-none justify-center pb-2 pt-3 shrink-0 active:cursor-grabbing"
            aria-hidden="true"
            onPointerDown={onGrabPointerDown}
          >
            <div className="w-9 h-1 rounded-full bg-s-ink/20" />
          </div>
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

/* ================================================================================
   SheetHeader — title + optional eyebrow + close X
   ================================================================================ */

interface SheetHeaderProps {
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  closeButton?: boolean;
  closeAriaLabel?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function SheetHeader({
  title,
  eyebrow,
  closeButton = true,
  closeAriaLabel = "Schließen",
  onClose,
  children,
  className,
}: SheetHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 shrink-0",
        "px-5 py-4 border-b border-s-border",
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {/* Eyebrow slot de-uppercased 2026-06-11 (owner ban): normal-case kicker. */}
        {eyebrow && (
          <div className="font-body font-semibold text-[13px] text-s-ink-2">
            {eyebrow}
          </div>
        )}
        {title && (
          <Heading
            slot="title"
            className="font-body font-semibold text-[18px] leading-[1.3] text-s-ink truncate"
          >
            {title}
          </Heading>
        )}
        {children}
      </div>
      {closeButton && (
        <button
          type="button"
          onClick={onClose}
          slot="close"
          aria-label={closeAriaLabel}
          className={cn(
            "flex items-center justify-center shrink-0",
            "w-11 h-11 -m-2.5 rounded-md",
            "text-s-ink-2 hover:text-s-ink",
            // X collapse (motion sheet 22, owner 2026-06-12): icon-tier press, cascades app-wide
            "transition-[color,transform] duration-150 ease-snap active:scale-[0.94]",
            "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
            "cursor-pointer",
          )}
        >
          <X className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </header>
  );
}

/* ================================================================================
   SheetBody — scrollable content area
   ================================================================================ */

interface SheetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SheetBody({ className, children, ...props }: SheetBodyProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto",
        "px-5 pt-3 pb-4",
        "font-body font-normal text-[16px] leading-[1.55] text-s-ink",
        // momentum scroll on iOS
        "[-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ================================================================================
   SheetCTARow — sticky-bottom action area
   ================================================================================ */

interface SheetCTARowProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Layout mode.
   * - `primary-only` (default) — single full-width CTA
   * - `reset-and-primary` — left-aligned reset link + right-aligned primary CTA
   * - `secondary-and-primary` — secondary button + primary button (filter / sort sheets)
   */
  layout?: "primary-only" | "reset-and-primary" | "secondary-and-primary";
  children: React.ReactNode;
}

export function SheetCTARow({
  layout = "primary-only",
  className,
  children,
  ...props
}: SheetCTARowProps) {
  const justify =
    layout === "primary-only" ? "justify-stretch" : "justify-between";

  return (
    <footer
      {...props}
      className={cn(
        "flex items-center gap-3 shrink-0",
        "border-t border-s-border",
        "px-5 pt-4",
        // safe-area-aware bottom padding for iOS home indicator
        "pb-[max(1rem,env(safe-area-inset-bottom))]",
        "bg-s-bg-base",
        justify,
        className,
      )}
    >
      {children}
    </footer>
  );
}

/* ================================================================================
   useResponsiveOverlay — picks Sheet on mobile, Modal on desktop (≥ 768px)
   ================================================================================ */

/**
 * Returns `"sheet"` on mobile (< 768px), `"modal"` on desktop (≥ 768px).
 *
 * Used to pick the right primitive at the surface level — sort sheet should be
 * a Sheet on mobile and a Modal on desktop. The body content composes with both.
 *
 * SSR-safe: defaults to `"sheet"` during SSR, hydrates to actual viewport size
 * on client mount.
 *
 * @example
 * import { Sheet, Modal, useResponsiveOverlay } from "@/app/[locale]/_components/primitives";
 *
 * const overlay = useResponsiveOverlay();
 * const Overlay = overlay === "sheet" ? Sheet : Modal;
 *
 * return <Overlay isOpen={open} onOpenChange={setOpen}>...</Overlay>;
 */
export function useResponsiveOverlay(): "sheet" | "modal" {
  const [overlay, setOverlay] = React.useState<"sheet" | "modal">("sheet");

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setOverlay(mq.matches ? "modal" : "sheet");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return overlay;
}
