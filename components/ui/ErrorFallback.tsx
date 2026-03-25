"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md w-full text-center bg-white dark:bg-s-dm-surface rounded-card shadow-warm-md p-8"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-s-coral/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-s-coral" />
        </div>
        <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">
          Etwas ist schiefgelaufen
        </h2>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mb-6">
          {error.message || "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] active:scale-[0.98] transition-all shadow-warm-sm"
        >
          <RotateCcw size={14} />
          Nochmal versuchen
        </button>
        {error.digest && (
          <p className="mt-4 text-[10px] text-s-ink/20 dark:text-s-dm-text/20 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
