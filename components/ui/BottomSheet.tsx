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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute bottom-0 inset-x-0 bg-white dark:bg-s-dm-surface rounded-t-3xl shadow-glass-hover overscroll-contain max-h-[90vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-sm z-10 rounded-t-3xl">
              <div className="w-12 h-1.5 rounded-full bg-s-sand-dark dark:bg-white/20" />
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
