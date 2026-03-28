"use client";

import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ExportButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  className?: string;
}

export function ExportButton({ onClick, loading = false, label, className = "" }: ExportButtonProps) {
  const t = useTranslations("dashboard");

  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label={label ?? t("exportCSV")}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] text-[10px] font-heading font-bold text-s-ink/55 dark:text-s-dm-text/55 hover:border-s-coral/40 hover:text-s-coral transition-colors disabled:opacity-40 ${className}`}
    >
      {loading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Download size={11} />
      )}
      {label ?? t("exportCSV")}
    </button>
  );
}
