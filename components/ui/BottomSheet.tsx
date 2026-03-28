"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-s-ink/50 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute bottom-0 inset-x-0 rounded-t-[28px] overflow-hidden overscroll-contain max-h-[90vh] overflow-y-auto glass-frost"
            style={{ boxShadow: "0 -8px 32px rgba(26,18,9,.12), var(--glass-shadow-inset)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-5 pb-2 sticky top-0 z-10 rounded-t-[28px] glass-frost">
              <div className="w-10 h-1 rounded-full bg-s-ink/15" />
            </div>
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pb-3">
                <h3 className="font-heading font-semibold text-s-ink dark:text-s-dm-text">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-s-ink/40 hover:text-s-ink hover:bg-s-bg-sunken dark:text-s-dm-text/40 dark:hover:text-s-dm-text dark:hover:bg-white/10 transition-colors"
                  aria-label="Schliessen"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="px-4 pb-8">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
