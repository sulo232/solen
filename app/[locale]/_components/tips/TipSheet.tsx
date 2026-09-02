"use client";

// Bottom sheet wrapper for the shared <TipFlow> (the approved "popup from underneath, not a full
// page, just a button"). Slides up from the bottom; dismiss by tapping the backdrop, swiping down,
// or the X. Caps at 90vh and scrolls so the card field + send button stay reachable with the mobile
// keyboard up. The TipFlow content is identical to the deep-link pages, so nothing is duplicated.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import TipFlow, { type TipFlowProps } from "./TipFlow";

type TipSheetProps = Omit<TipFlowProps, "onClose"> & {
  open: boolean;
  onClose: () => void;
};

export default function TipSheet({ open, onClose, ...tipProps }: TipSheetProps) {
  const t = useTranslations("common");
  // Portal to <body> so the sheet escapes the page's stacking context. Without this its z-index is
  // capped by an ancestor and the cookie banner (portaled to body, z-700) renders on top of it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
  };

  const ui = (
    <AnimatePresence>
      {open && (
        <motion.div
          /* z above the cookie banner (z-tooltip = 700) so it can't cover the send button */
          className="fixed inset-0 z-[1000] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-s-ink/40" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-[26px] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
          >
            {/* Grab handle + close */}
            <div className="relative flex shrink-0 items-center justify-center pt-3 pb-1">
              <span className="h-1.5 w-10 rounded-full bg-s-border" />
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="absolute right-3 top-2.5 grid h-8 w-8 place-items-center rounded-full text-s-ink-2 transition active:scale-90"
              >
                <X size={20} strokeWidth={2.2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <TipFlow {...tipProps} onClose={onClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(ui, document.body) : null;
}
