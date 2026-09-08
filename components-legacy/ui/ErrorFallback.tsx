"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const t = useTranslations("ui.error") as any;

  useEffect(() => {
    console.error("[ErrorFallback]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-md w-full text-center bg-white rounded-[12px] shadow-warm-md p-8"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-s-error-bg flex items-center justify-center">
          <AlertCircle size={28} className="text-s-error" />
        </div>
        <h2 className="font-heading text-lg text-s-ink mb-2">
          {t("title")}
        </h2>
        <p className="text-sm text-s-ink-2 font-body mb-6">
          {t("defaultMessage")}
        </p>
        <button
          onClick={reset}
          className="relative before:absolute before:-inset-y-0.5 before:inset-x-0 before:content-[''] inline-flex items-center gap-2 px-6 py-2.5 rounded-pill bg-s-ink text-white text-sm font-medium hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 shadow-warm-sm"
        >
          <RotateCcw size={14} strokeWidth={1.6} />
          {t("retry")}
        </button>
        {error.digest && (
          <p className="mt-4 text-[12px] text-s-ink/20 font-mono">
            {t("errorId")}: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
