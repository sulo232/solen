"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import type { Salon } from "@/lib/types";

interface CompareBarProps {
  salons: Salon[];
  onRemove: (id: string) => void;
  onCompare: () => void;
}

export default function CompareBar({ salons, onRemove, onCompare }: CompareBarProps) {
  if (salons.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-pill shadow-lg px-4 py-2.5 flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          {salons.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-teal/10 text-teal text-xs font-medium">
              {s.name}
              <button onClick={() => onRemove(s.id)} className="text-teal/50 hover:text-teal">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={onCompare}
          disabled={salons.length < 2}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-teal text-white text-xs font-semibold disabled:opacity-40 hover:bg-teal/90 transition-colors"
        >
          Vergleichen
          <ArrowRight size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
