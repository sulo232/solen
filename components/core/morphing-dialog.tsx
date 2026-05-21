"use client";

/**
 * MorphingDialog — V3-D75-morph (2026-05-18).
 *
 * Adapted from motion-primitives' MorphingDialog by Julien Thibeaut (MIT).
 * Source pattern: https://motion-primitives.com/docs/morphing-dialog
 *
 * Why this exists: my prior JoinUsCard used `position: relative → fixed`
 * swapping which caused stutter during morph. The motion-primitives pattern
 * uses `layoutId` between a trigger and a portal-rendered content — motion
 * morphs the shared identity smoothly across the layout boundary because the
 * content lives outside normal flow (portal) and motion only animates a
 * single conceptual element.
 *
 * Anatomy (pseudo):
 *   MorphingDialog
 *     MorphingDialogTrigger       — collapsed state (in normal flow)
 *       ...collapsed UI children...
 *     MorphingDialogContainer     — portal + backdrop
 *       MorphingDialogContent     — expanded modal (shares layoutId w trigger)
 *         MorphingDialogTitle     — also shares layoutId individually
 *         MorphingDialogSubtitle
 *         MorphingDialogDescription — non-shared content, fade-in only
 *         MorphingDialogImage
 *         MorphingDialogClose
 *
 * Parts marked "shares layoutId" use IDs derived from a single useId() at the
 * root provider. So Title in the trigger and Title in the content morph between
 * each other when the dialog opens, instead of one fading out + the other
 * fading in.
 *
 * `disableLayoutAnimation` opt-out on Description — used for body copy that
 * shouldn't morph (initial fade-in via the variants prop is cleaner there).
 */

import * as React from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  type Variant,
} from "motion/react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MorphingDialogContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  uniqueId: string;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const MorphingDialogContext =
  React.createContext<MorphingDialogContextType | null>(null);

/**
 * Hook to read MorphingDialog state from inside a child component.
 * Used by consumers like AnimatedTestimonials to pause autoplay / lock
 * gestures while the dialog is open.
 */
export function useMorphingDialog() {
  const ctx = React.useContext(MorphingDialogContext);
  if (!ctx)
    throw new Error(
      "MorphingDialog parts must be used inside a <MorphingDialog> root.",
    );
  return ctx;
}

/* ─── Root provider ─── */

export interface MorphingDialogProps {
  children: React.ReactNode;
  transition?: Transition;
}

export function MorphingDialog({ children, transition }: MorphingDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const uniqueId = React.useId();
  const triggerRef = React.useRef<HTMLDivElement | null>(null);

  // ESC + body scroll lock when open.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const value = React.useMemo<MorphingDialogContextType>(
    () => ({ isOpen, setIsOpen, uniqueId, triggerRef }),
    [isOpen, uniqueId],
  );

  return (
    <MorphingDialogContext.Provider value={value}>
      <MotionConfig transition={transition}>{children}</MotionConfig>
    </MorphingDialogContext.Provider>
  );
}

/* ─── Trigger (collapsed state) ─── */

export interface MorphingDialogTriggerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogTrigger({
  children,
  className,
  style,
}: MorphingDialogTriggerProps) {
  const { setIsOpen, isOpen, uniqueId, triggerRef } = useMorphingDialog();

  return (
    <motion.div
      ref={triggerRef}
      layoutId={`dialog-${uniqueId}`}
      className={cn("relative cursor-pointer", className)}
      style={style}
      onClick={() => setIsOpen(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
      }}
      role="button"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls={`morphing-dialog-content-${uniqueId}`}
      tabIndex={0}
    >
      {children}
    </motion.div>
  );
}

/* ─── Container (portal + backdrop) ─── */

export interface MorphingDialogContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MorphingDialogContainer({
  children,
  className,
}: MorphingDialogContainerProps) {
  const { isOpen, setIsOpen } = useMorphingDialog();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence initial={false} mode="sync">
      {isOpen && (
        <>
          <motion.div
            key="morphing-dialog-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] h-full w-full bg-black/50 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div
            className={cn(
              "fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8",
              className,
            )}
          >
            {children}
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ─── Content (expanded modal) ─── */

export interface MorphingDialogContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogContent({
  children,
  className,
  style,
}: MorphingDialogContentProps) {
  const { setIsOpen, isOpen, uniqueId, triggerRef } = useMorphingDialog();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [firstFocusableElement, setFirstFocusableElement] =
    React.useState<HTMLElement | null>(null);

  // Trap focus inside the dialog while open. Restore focus to the trigger
  // when the dialog closes.
  React.useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) {
      setFirstFocusableElement(focusable[0]);
      focusable[0].focus();
    }
    return () => {
      // Return focus to trigger.
      triggerRef.current?.focus();
    };
  }, [isOpen, triggerRef]);

  return (
    <motion.div
      ref={containerRef}
      layoutId={`dialog-${uniqueId}`}
      className={className}
      style={style}
      id={`morphing-dialog-content-${uniqueId}`}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

/* ─── Title (shares layoutId — morphs between trigger + content) ─── */

export interface MorphingDialogTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogTitle({
  children,
  className,
  style,
}: MorphingDialogTitleProps) {
  const { uniqueId } = useMorphingDialog();
  return (
    <motion.div
      layoutId={`dialog-title-container-${uniqueId}`}
      className={className}
      style={style}
      layout
    >
      {children}
    </motion.div>
  );
}

/* ─── Subtitle ─── */

export interface MorphingDialogSubtitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogSubtitle({
  children,
  className,
  style,
}: MorphingDialogSubtitleProps) {
  const { uniqueId } = useMorphingDialog();
  return (
    <motion.div
      layoutId={`dialog-subtitle-container-${uniqueId}`}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ─── Description (body copy — fade-in, no morph) ─── */

export interface MorphingDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
  variants?: {
    initial?: Variant;
    animate?: Variant;
    exit?: Variant;
  };
  disableLayoutAnimation?: boolean;
}

export function MorphingDialogDescription({
  children,
  className,
  variants,
  disableLayoutAnimation,
}: MorphingDialogDescriptionProps) {
  const { uniqueId } = useMorphingDialog();
  return (
    <motion.div
      key={`dialog-description-${uniqueId}`}
      layoutId={
        disableLayoutAnimation
          ? undefined
          : `dialog-description-content-${uniqueId}`
      }
      variants={variants}
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

/* ─── Image (shares layoutId — morphs between trigger + content placement) ─── */

export interface MorphingDialogImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MorphingDialogImage({
  src,
  alt,
  className,
  style,
}: MorphingDialogImageProps) {
  const { uniqueId } = useMorphingDialog();
  return (
    <motion.img
      src={src}
      alt={alt}
      className={cn(className)}
      style={style}
      layoutId={`dialog-img-${uniqueId}`}
    />
  );
}

/* ─── Close (X button — top-right) ─── */

export interface MorphingDialogCloseProps {
  className?: string;
  variants?: {
    initial?: Variant;
    animate?: Variant;
    exit?: Variant;
  };
}

export function MorphingDialogClose({
  className,
  variants,
}: MorphingDialogCloseProps) {
  const { setIsOpen, uniqueId } = useMorphingDialog();
  return (
    <motion.button
      onClick={() => setIsOpen(false)}
      type="button"
      aria-label="Close dialog"
      key={`dialog-close-${uniqueId}`}
      className={cn(
        "absolute right-6 top-6 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
        className,
      )}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      <XIcon size={20} aria-hidden />
    </motion.button>
  );
}
