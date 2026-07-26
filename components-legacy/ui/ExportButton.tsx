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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-s-border text-[12px] font-heading text-s-ink-2 hover:border-s-accent/40 hover:text-s-accent transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:opacity-40 ${className}`}
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
