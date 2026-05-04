"use client";

import { useEffect, useRef } from "react";
import { EASE_SOLEN } from "@/lib/animations";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  initialDetent?: "peek" | "half" | "full";
  snapPoints?: number[]; // percentage of viewport height (0.3, 0.6, 0.9)
}

const DEFAULT_SNAP_POINTS = [0.3, 0.6, 0.9];

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  initialDetent = "half",
  snapPoints = DEFAULT_SNAP_POINTS,
}: BottomSheetProps) {
  const sheetY = useMotionValue(0);
  const windowHeightRef = useRef(typeof window !== "undefined" ? window.innerHeight : 800);

  useEffect(() => {
    if (isOpen) {
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = "0";
    } else {
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    }
    return () => {
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const snapToNearest = (velocity: number, currentY: number) => {
    const windowHeight = windowHeightRef.current;
    const currentPercent = 1 - currentY / windowHeight;

    // Find nearest snap point
    let target = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - currentPercent) < Math.abs(prev - currentPercent) ? curr : prev
    );

    // If flinging down fast, close
    if (velocity > 500 && currentPercent < snapPoints[0]) {
      onClose();
      return;
    }

    // Snap to target
    animate(sheetY, windowHeight * (1 - target), {
      type: "tween",
      duration: 0.3,
      ease: [...EASE_SOLEN],
    });
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    snapToNearest(info.velocity.y, sheetY.get());
  };

  useEffect(() => {
    if (!isOpen) {
      sheetY.set(windowHeightRef.current);
    } else {
      const initialPercent = initialDetent === "peek" ? 0.3 : initialDetent === "full" ? 0.9 : 0.6;
      animate(sheetY, windowHeightRef.current * (1 - initialPercent), {
        type: "tween",
        duration: 0.3,
        ease: [...EASE_SOLEN],
      });
    }
  }, [isOpen, initialDetent, sheetY]);

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
            style={{
              boxShadow: "0 -8px 32px rgba(26,18,9,.12), var(--glass-shadow-inset)",
              y: sheetY,
            }}
            drag="y"
            dragElastic={0.2}
            dragConstraints={{ top: windowHeightRef.current * 0.1 }} // Min snap point (90% visible = 10% offset)
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-5 pb-2 sticky top-0 z-10 rounded-t-[28px] glass-frost cursor-grab active:cursor-grabbing">
              <div
                role="button"
                tabIndex={0}
                aria-label="Drag to close"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose(); } }}
                className="w-10 h-1 rounded-full bg-s-ink/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
              />
            </div>
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pb-3">
                <h3 className="font-heading text-s-ink">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-3 rounded-full text-s-ink/60 hover:text-s-ink hover:bg-s-bg-sunken:bg-white/20 transition-colors"
                  aria-label="Schliessen"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="px-4" style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
