"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { modalVariants } from "@/lib/animations";

// ── Focus trap hook ──────────────────────────
function useFocusTrap(ref: React.RefObject<HTMLDivElement | null>, isOpen: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !ref.current) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements =
      ref.current.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstEl = focusableElements[0];

    firstEl?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = ref.current?.querySelectorAll<HTMLElement>(focusableSelectors);
      if (!els?.length) return;
      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, ref]);
}

interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Max width class — defaults to max-w-md */
  maxWidth?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal with glassmorphic backdrop blur.
 * Traps focus, scroll, and supports Escape-to-close.
 */
export default function GlassModal({
  open,
  onClose,
  title,
  maxWidth = "max-w-md",
  children,
  className,
}: GlassModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-s-ink/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full z-10",
              maxWidth,
              "rounded-[16px] overflow-hidden",
              className
            )}
            style={{
              background: "#FFFFFF",
              boxShadow: "0 8px 24px rgba(26,18,9,.12), 0 32px 64px rgba(26,18,9,.10)"
            }}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-s-ink/[0.06]">
                <div>
                  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-1">Buchung</p>
                  <h2 className="font-heading font-bold text-s-ink text-lg">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-[8px] text-s-ink/40 hover:text-s-ink hover:bg-s-ink/5 transition-colors"
                  aria-label="Schliessen"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
