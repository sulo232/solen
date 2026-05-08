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
 * V3 Modal style variants — LIVE_TRUTH §F.2.
 *
 * Architecture (V2-D18 — explicit deviation from V2-D17 native-first):
 * `react-aria-components` Modal + ModalOverlay + Dialog. There is no native `<dialog>`
 * with the focus-trap + scroll-lock + portal behavior the spec needs across browsers.
 * cva for size variants on top of react-aria headless behavior.
 *
 * Composition pattern (V2-D17 sibling-not-wrapper):
 *   <Modal isOpen={open} onOpenChange={setOpen} size="md">
 *     <ModalHeader title="..." eyebrow="..." />
 *     <ModalBody>...</ModalBody>
 *     <ModalFooter>...</ModalFooter>
 *   </Modal>
 *
 * Motion: ease-snap for both entry (200/250ms) and exit (150ms). No spring/bounce —
 * modals are functional, not playful (§F.2.9).
 */
const modalSurfaceVariants = cva(
  cn(
    // base
    "bg-s-bg-base rounded-2xl shadow-elevation-3",
    "flex flex-col overflow-hidden",
    "max-h-[calc(100dvh-32px)]",
    // entry/exit motion via react-aria data attrs
    "transition-[opacity,transform] duration-[250ms] ease-snap",
    "data-[entering]:opacity-0 data-[entering]:scale-[0.95]",
    "data-[exiting]:opacity-0 data-[exiting]:scale-[0.95] data-[exiting]:duration-150",
    // reduced motion: collapse to opacity-only, 100ms (per §F.2.9 + §24b.3)
    "motion-reduce:transition-opacity motion-reduce:duration-100",
    "motion-reduce:data-[entering]:scale-100 motion-reduce:data-[exiting]:scale-100",
  ),
  {
    variants: {
      size: {
        sm: "w-[min(360px,calc(100vw-32px))]",
        md: "w-[min(480px,calc(100vw-32px))]",
        lg: "w-[min(640px,calc(100vw-32px))]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type ModalSize = NonNullable<VariantProps<typeof modalSurfaceVariants>["size"]>;

export interface ModalProps {
  /** Controlled open state. Pair with `onOpenChange`. */
  isOpen?: boolean;
  /** Fires when the user opens or closes (X click, escape, backdrop click). */
  onOpenChange?: (isOpen: boolean) => void;
  /** Modal width tier. Default `md` (480px). */
  size?: ModalSize;
  /**
   * Whether clicking the backdrop dismisses. Default true.
   * Set to false for destructive flows where accidental click loss = bad UX.
   */
  isDismissable?: boolean;
  /** Whether Escape key dismisses. Default true. Set to false for destructive flows. */
  keyboardDismissDisabled?: boolean;
  /** Optional className applied to the modal surface. */
  className?: string;
  /** Optional className applied to the backdrop overlay. */
  overlayClassName?: string;
  /** Render-prop or static children. Should compose `<ModalHeader>`, `<ModalBody>`, `<ModalFooter>`. */
  children?: React.ReactNode;
  /** ARIA: `<Dialog>` aria-label when no `<ModalHeader title>` is rendered. */
  "aria-label"?: string;
  /** ARIA: id of the body paragraph that describes the modal (auto-wired if omitted). */
  "aria-describedby"?: string;
}

/**
 * Solen V3 modal primitive (LIVE_TRUTH §F.2).
 *
 * Centered overlay for confirmations, login flows, focused single-task interactions.
 * Distinct from §F.3 sheet — modals work identically on mobile and desktop, never
 * auto-dismiss, never stack.
 *
 * @example
 * const [open, setOpen] = React.useState(false);
 * <Modal isOpen={open} onOpenChange={setOpen} size="md">
 *   <ModalHeader title="Termin bestätigen" eyebrow="Buchung" />
 *   <ModalBody>
 *     <p>Du buchst Damen-Schnitt &amp; Föhnen am Donnerstag um 14:30.</p>
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setOpen(false)}>Abbrechen</Button>
 *     <Button variant="primary" onClick={confirm}>Bestätigen</Button>
 *   </ModalFooter>
 * </Modal>
 */
export function Modal({
  isOpen,
  onOpenChange,
  size = "md",
  isDismissable = true,
  keyboardDismissDisabled = false,
  className,
  overlayClassName,
  children,
  ...ariaProps
}: ModalProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={keyboardDismissDisabled}
      className={cn(
        // backdrop: fixed inset, warm-ink dim + 4px blur, flex-center the modal
        "fixed inset-0 z-modal-bg flex items-center justify-center p-4",
        "bg-[rgba(26,18,9,0.40)] backdrop-blur-[4px]",
        // entry/exit fade
        "transition-opacity duration-200 ease-snap",
        "data-[entering]:opacity-0",
        "data-[exiting]:opacity-0 data-[exiting]:duration-150",
        overlayClassName,
      )}
    >
      <AriaModal
        className={cn(modalSurfaceVariants({ size }), "z-modal", className)}
      >
        <Dialog className="outline-none flex flex-col overflow-hidden flex-1 min-h-0" {...ariaProps}>
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}

/* ================================================================================
   ModalHeader — title + optional eyebrow + close X
   ================================================================================ */

interface ModalHeaderProps {
  /** The modal's title. Rendered as `<Heading slot="title">` for proper aria-labelledby wiring. */
  title?: React.ReactNode;
  /**
   * Optional eyebrow above the title.
   * Avant Garde 700 11px uppercase ink-3 letter-spacing 0.16em.
   */
  eyebrow?: React.ReactNode;
  /** Render the close X button. Default true. Hide via `closeButton={false}` only when there's another explicit way to exit. */
  closeButton?: boolean;
  /** Override the default close-button aria-label. */
  closeAriaLabel?: string;
  /** Fires when close X is clicked. If omitted, react-aria's slot="close" handles dismissal. */
  onClose?: () => void;
  /** Render custom header content instead of title+eyebrow (for fully custom layouts). */
  children?: React.ReactNode;
  /** Variant size — drives padding. Defaults to `md`. Pass through from `<Modal size>`. */
  size?: ModalSize;
  className?: string;
}

export function ModalHeader({
  title,
  eyebrow,
  closeButton = true,
  closeAriaLabel = "Schließen",
  onClose,
  children,
  size = "md",
  className,
}: ModalHeaderProps) {
  const padding = size === "lg" ? "px-7 py-6" : "px-6 py-5";

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 shrink-0",
        "border-b border-s-ink/[0.06]",
        padding,
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
   ModalBody — scrollable content area
   ================================================================================ */

interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant size — drives padding. Pass through from `<Modal size>`. Defaults to `md`. */
  size?: ModalSize;
  children: React.ReactNode;
}

export function ModalBody({ size = "md", className, children, ...props }: ModalBodyProps) {
  const padding = size === "lg" ? "px-7 pt-4 pb-6" : "px-6 pt-4 pb-5";

  return (
    <div
      {...props}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto",
        "font-body font-normal text-[16px] leading-[1.55] text-s-ink",
        padding,
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ================================================================================
   ModalFooter — sticky-bottom action area
   ================================================================================ */

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant size — drives padding. Pass through from `<Modal size>`. Defaults to `md`. */
  size?: ModalSize;
  /**
   * Layout mode. Default `right` — right-aligned action buttons.
   * `between` — destructive tertiary on far left, primary group on right.
   */
  layout?: "right" | "between";
  children: React.ReactNode;
}

export function ModalFooter({
  size = "md",
  layout = "right",
  className,
  children,
  ...props
}: ModalFooterProps) {
  const padding = size === "lg" ? "px-7 py-5" : "px-6 py-4";
  const justify = layout === "between" ? "justify-between" : "justify-end";

  return (
    <footer
      {...props}
      className={cn(
        "flex items-center gap-3 shrink-0",
        "border-t border-s-ink/[0.06]",
        justify,
        padding,
        className,
      )}
    >
      {children}
    </footer>
  );
}
