"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const t = useTranslations("ui.error") as any;
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md w-full text-center bg-white rounded-[12px] shadow-warm-md p-8"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-s-amber/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-s-amber" />
        </div>
        <h2 className="font-heading text-lg text-s-ink mb-2">
          {t("title")}
        </h2>
        <p className="text-sm text-s-ink/50 font-body mb-6">
          {error.message || t("defaultMessage")}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pill bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 shadow-warm-sm"
        >
          <RotateCcw size={14} />
          {t("retry")}
        </button>
        {error.digest && (
          <p className="mt-4 text-[10px] text-s-ink/20 font-mono">
            {t("errorId")}: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
