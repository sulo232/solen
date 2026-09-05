"use client";

// Exists-check: `npm run exists Sheet` -> the real, live Sheet.tsx primitive (react-aria
// ModalOverlay + Dialog, drag-to-dismiss, safe-area CTA row). `npm run exists press-motion` ->
// 0, net-new surface.
//
// Depicts: sheet anatomy -> app/[locale]/_components/primitives/Sheet.tsx (copied verbatim for anatomy and interaction; only open/close durations change below).
//
// Grounded-in: app/[locale]/_components/primitives/Sheet.tsx, per the brief: "COPY that
// component into your own _v<letter>/ folder, rename it, and change the copy." Nothing about
// the real Sheet.tsx is edited.
//
// Direction A change (the ONLY thing that differs from the real Sheet):
// - Open: 320ms `ease-glide` (was the real Sheet's shipped 600ms glide). The brief's own
//   starting value (320ms) is KEPT, not replaced: airbnb--motion.md's only measured full-screen-
//   reveal family is 400-550ms (search sheet, gallery, date picker), i.e. every measured value in
//   this family is SLOWER than 320ms, so there is no measured number to port down to. 320ms stays
//   the direction's own defining "fast sheet" identity (LOCKFILE's SPEED LAW reserves >300ms for
//   full-screen only, so 320ms is the fastest number that still clears that floor).
// - Close: 220ms `ease-thud` (was the real Sheet's shipped 200ms thud on the surface, 200ms on
//   the backdrop fade). Kept close to the real shipped number (+20ms) rather than a measured
//   Airbnb close (this capture did not measure a full-screen CLOSE at all, only opens), so the
//   real Sheet's own already-locked close family is the nearest available number.
// - Backdrop fade matches the surface durations (320ms glide in / 220ms thud out) instead of the
//   real Sheet's own 300ms/200ms, for one consistent envelope per the "Snap" identity.
//
// Everything else (bottom-anchored positioning, 28px top radius, drag handle + drag-to-dismiss
// physics, safe-area CTA row, motion-reduce fallback) is the real, unmodified Sheet anatomy.

import * as React from "react";
import {
  Modal as AriaModal,
  ModalOverlay,
  Dialog,
  Heading,
} from "react-aria-components";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PressSheetAProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children?: React.ReactNode;
}

export function PressSheetA({ isOpen, onOpenChange, children }: PressSheetAProps) {
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (isOpen) main.classList.add("sheet-scale-back");
    else main.classList.remove("sheet-scale-back");
    return () => main.classList.remove("sheet-scale-back");
  }, [isOpen]);

  const dragStart = React.useRef<number | null>(null);
  const dragDy = React.useRef(0);
  const onGrabPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
    dragDy.current = 0;
    if (modalRef.current) modalRef.current.style.transition = "none";
    const onMove = (ev: PointerEvent) => {
      if (dragStart.current == null) return;
      dragDy.current = Math.max(0, ev.clientY - dragStart.current);
      if (modalRef.current)
        modalRef.current.style.transform = `translateY(${dragDy.current}px)`;
    };
    const onUp = () => {
      const el = modalRef.current;
      if (el) {
        el.style.transition = "";
        el.style.transform = "";
      }
      if (dragDy.current > 90) onOpenChange?.(false);
      dragStart.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={cn(
        "fixed inset-0 z-sheet-bg",
        "bg-[rgba(26,18,9,0.40)] backdrop-blur-[4px]",
        "transition-opacity duration-[320ms] ease-glide",
        "data-[entering]:opacity-0",
        "data-[exiting]:opacity-0 data-[exiting]:duration-[220ms] data-[exiting]:ease-thud",
      )}
    >
      <AriaModal
        ref={modalRef}
        className={cn(
          "bg-s-bg-base rounded-t-[28px]",
          "shadow-[0_-4px_28px_rgba(50,47,44,0.12),0_-2px_8px_rgba(50,47,44,0.06)]",
          "flex flex-col overflow-hidden",
          "absolute bottom-0 left-0 right-0",
          "h-[75dvh] max-h-[calc(100dvh-64px)]",
          "transition-transform duration-[320ms] ease-glide",
          "data-[entering]:translate-y-full",
          "data-[exiting]:translate-y-full data-[exiting]:duration-[220ms] data-[exiting]:ease-thud",
          "motion-reduce:transition-opacity motion-reduce:duration-100",
          "motion-reduce:data-[entering]:translate-y-0 motion-reduce:data-[entering]:opacity-0",
          "motion-reduce:data-[exiting]:translate-y-0 motion-reduce:data-[exiting]:opacity-0",
          "z-sheet",
        )}
      >
        <Dialog className="outline-none flex flex-col h-full overflow-hidden">
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

export function PressSheetHeaderA({
  title,
  onClose,
}: {
  title: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 shrink-0 px-5 py-4 border-b border-s-border">
      <Heading
        slot="title"
        className="font-body font-semibold text-[18px] leading-[1.3] text-s-ink truncate"
      >
        {title}
      </Heading>
      <button
        type="button"
        onClick={onClose}
        slot="close"
        aria-label="Close"
        className="flex items-center justify-center shrink-0 w-11 h-11 -m-2.5 rounded-md text-s-ink-2 hover:text-s-ink transition-[color,transform] duration-150 ease-snap active:scale-[0.94] cursor-pointer"
      >
        <X className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </header>
  );
}

export function PressSheetBodyA({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-3 pb-4 font-body font-normal text-[15px] leading-[1.55] text-s-ink [-webkit-overflow-scrolling:touch]">
      {children}
    </div>
  );
}

export function PressSheetCTARowA({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex items-center gap-3 shrink-0 border-t border-s-border px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-s-bg-base justify-stretch">
      {children}
    </footer>
  );
}
