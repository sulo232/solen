"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { modalVariants } from "@/lib/animations";

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
 * Traps scroll and supports Escape-to-close.
 */
export default function GlassModal({
  open,
  onClose,
  title,
  maxWidth = "max-w-md",
  children,
  className,
}: GlassModalProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-dark/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full z-10",
              maxWidth,
              "rounded-3xl border border-white/60",
              "bg-white/90 backdrop-blur-glass shadow-glass-hover",
              className
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-s-ink/5">
                <h2 className="font-heading font-semibold text-s-ink text-lg">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-s-ink/40 hover:text-s-ink hover:bg-dark/5 transition-colors"
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
