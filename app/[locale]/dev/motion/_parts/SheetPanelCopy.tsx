"use client";

// exists-check: `npm run exists "motion speed ladder demo card"` (2026-07-25), 0 matches , net-new.
// The real `Sheet` primitive (primitives/Sheet.tsx) bakes its open/close duration into a CVA
// class (`duration-[600ms]` / `data-[exiting]:duration-200`), which cannot be safely overridden
// via a passed className , `cn()` here is plain clsx (no tailwind-merge), so two conflicting
// duration utilities would both survive and source order, not intent, would decide which wins.
// Neither 600ms nor 200ms falls inside either labeled band this page compares (150ms feedback /
// 300ms reveal), so grounding the fast/slow comparison in the real component's own hardcoded
// timing is not possible without editing it , out of scope ("do NOT modify any shipped
// component"). This file mirrors Sheet's own visible chrome instead (rounded-t-[28px], the same
// shadow, the same drag handle, the same header/body layout) at a caller-supplied duration via an
// INLINE `transitionDuration` style, which always wins over a class regardless of source order,
// so both the 150ms and 300ms instances render the real Sheet's exact anatomy.
import * as React from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

export function SheetPanelCopy({
  isOpen,
  onClose,
  durationOpenMs,
  durationCloseMs,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  durationOpenMs: number;
  durationCloseMs: number;
  title: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [rendered, setRendered] = React.useState(false);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (isOpen) {
      setRendered(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    setShown(false);
    const t = window.setTimeout(() => setRendered(false), durationCloseMs);
    return () => window.clearTimeout(t);
  }, [isOpen, durationCloseMs]);

  if (!mounted || !rendered) return null;

  const durationMs = shown ? durationOpenMs : durationCloseMs;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[900]">
      <div
        className="absolute inset-0 bg-[rgba(26,18,9,0.40)] transition-opacity ease-glide"
        style={{ opacity: shown ? 1 : 0, transitionDuration: `${durationMs}ms` }}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 right-0 flex h-[75dvh] max-h-[calc(100dvh-64px)] flex-col overflow-hidden rounded-t-[28px] bg-s-bg-base shadow-[0_-4px_28px_rgba(50,47,44,0.12),0_-2px_8px_rgba(50,47,44,0.06)] transition-transform ease-glide"
        style={{
          transform: shown ? "translateY(0)" : "translateY(100%)",
          transitionDuration: `${durationMs}ms`,
        }}
        role="dialog"
        aria-label={title}
      >
        <div className="flex shrink-0 justify-center pb-2 pt-3" aria-hidden>
          <div className="h-1 w-9 rounded-full bg-s-ink/20" />
        </div>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-s-border px-5 py-4">
          <h3 className="truncate font-body text-[18px] font-semibold text-s-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-2.5 flex h-11 w-11 items-center justify-center rounded-md text-s-ink-2 transition-colors hover:text-s-ink"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3 font-body text-[16px] text-s-ink">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
