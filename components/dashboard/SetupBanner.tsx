"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

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

  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (data.percentage / 100) * circumference;
  const incompleteSteps = data.steps.filter((s) => !s.complete);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-s-dm-surface rounded-card border border-s-coral/20 dark:border-s-coral/30 p-5 mb-6 shadow-warm-sm"
    >
      <div className="flex items-center gap-4">
        {/* Progress circle */}
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="20" fill="none" stroke="#F5E6DC" strokeWidth="3" />
            <motion.circle
              cx="22" cy="22" r="20" fill="none" stroke="#E8624A" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-s-coral data-text">
            {data.percentage}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">
            {isDE ? "Salon-Setup" : "Salon Setup"} — {data.completed}/{data.total} {isDE ? "erledigt" : "done"}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {incompleteSteps.slice(0, 3).map((step) => (
              <span key={step.key} className="px-2 py-0.5 rounded-pill text-[10px] bg-s-coral/5 text-s-coral font-medium">
                {isDE ? step.label : step.label_en}
              </span>
            ))}
            {incompleteSteps.length > 3 && (
              <span className="px-2 py-0.5 rounded-pill text-[10px] bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/30 dark:text-s-dm-text/30">
                +{incompleteSteps.length - 3}
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/${locale}/dashboard/setup`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all shrink-0"
        >
          {isDE ? "Fortsetzen" : "Continue"}
          <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}
