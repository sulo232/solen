"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

export default function SetupBanner() {
  const locale = useLocale();
  const t = useTranslations("dashboard.setupBanner");
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
      .catch((err) => console.error("[SetupBanner] failed to load setup progress:", err));
  }, []);

  if (!data || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem("setup_banner_dismissed", "1");
  };

  const incompleteSteps = data.steps.filter((s) => !s.complete);

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4 mb-6 bg-white">
      <p className="text-[12px] font-heading uppercase tracking-[.18em] text-s-star mb-1">{t("eyebrow")}</p>
      <p className="font-heading text-sm text-s-ink mb-3">
        {t("salonSetup")} — {data.completed}/{data.total} {t("done")}
      </p>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-s-bg-sunken mb-4 overflow-hidden">
        <div className="h-full bg-s-coral rounded-full transition-[width] duration-200"
          style={{ width: `${data.percentage}%` }} />
      </div>
      {/* Steps list */}
      {incompleteSteps.slice(0, 3).map((step) => (
        <div key={step.key} className="flex items-center gap-3 py-2.5 border-b border-s-ink/[0.04] last:border-0">
          <div className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 border border-s-ink/15">
          </div>
          <p className="text-xs font-heading text-s-ink flex-1">
            {isDE ? step.label : step.label_en}
          </p>
          <Link href={`/${locale}/dashboard/setup`}
            className="text-[12px] font-heading uppercase tracking-[.06em] text-s-coral">
            {t("setUp")} →
          </Link>
        </div>
      ))}
      {incompleteSteps.length > 3 && (
        <p className="text-[12px] text-s-ink/30 mt-2">{t("more", { n: incompleteSteps.length - 3 })}</p>
      )}
    </div>
  );
}
