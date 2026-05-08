"use client";

import * as React from "react";
import {
  Modal as AriaModal,
  ModalOverlay,
  Dialog,
  Heading,
} from "react-aria-components";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
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
      <AriaModal className={cn(sheetSurfaceVariants({ height }), "z-sheet", className)}>
        <Dialog className="outline-none flex flex-col h-full overflow-hidden" {...ariaProps}>
          {/* Drag handle — visual only in v1 per §F.3.2. v2 will wire swipe gesture. */}
          <div className="flex justify-center pt-3 pb-2 shrink-0" aria-hidden="true">
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
        "px-5 py-4 border-b border-s-ink/[0.06]",
        className,
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        {eyebrow && (
          <div className="font-body font-bold text-[13px] uppercase tracking-[0.16em] text-s-ink-3">
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
            "transition-colors duration-150 ease-snap",
            "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
            "cursor-pointer",
          )}
        >
          <X className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
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
        "border-t border-s-ink/[0.06]",
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
