"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

export default function SetupBanner() {
  const locale = useLocale();
  const isDE = locale === "de" || locale === "fr";
  const [data, setData] = useState<{ steps: Step[]; completed: number; total: number; percentage: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if user dismissed it this session
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("setup_banner_dismissed")) {
      setDismissed(true);
      return;
    }
    fetch("/api/salon/setup-progress")
      .then((r) => r.json())
      .then((d) => {
        if (d.percentage < 100) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("setup_banner_dismissed", "1");
  };

  const incompleteSteps = data.steps.filter((s) => !s.complete);

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4 mb-6 bg-white dark:bg-s-dm-surface">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-1">Einrichtung</p>
      <p className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text mb-3">
        {isDE ? "Salon-Setup" : "Salon Setup"} — {data.completed}/{data.total} {isDE ? "erledigt" : "done"}
      </p>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-s-ink/[0.06] mb-4 overflow-hidden">
        <div className="h-full bg-s-coral rounded-full transition-[width] duration-[250ms]"
          style={{ width: `${data.percentage}%` }} />
      </div>
      {/* Steps list */}
      {incompleteSteps.slice(0, 3).map((step) => (
        <div key={step.key} className="flex items-center gap-3 py-2.5 border-b border-s-ink/[0.04] last:border-0">
          <div className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 border border-s-ink/15">
          </div>
          <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text flex-1">
            {isDE ? step.label : step.label_en}
          </p>
          <Link href={`/${locale}/dashboard/setup`}
            className="text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-coral">
            Einrichten →
          </Link>
        </div>
      ))}
      {incompleteSteps.length > 3 && (
        <p className="text-[10px] text-s-ink/30 mt-2">+{incompleteSteps.length - 3} weitere</p>
      )}
    </div>
  );
}
