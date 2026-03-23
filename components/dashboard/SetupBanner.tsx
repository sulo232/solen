"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

interface SetupData {
  steps: Step[];
  completed: number;
  total: number;
  percentage: number;
}

// Step-to-dashboard-link map
const STEP_LINKS: Record<string, string> = {
  profile:   "/dashboard/settings?tab=profile",
  hours:     "/dashboard/settings?tab=hours",
  services:  "/dashboard/services",
  staff:     "/dashboard/staff",
  schedule:  "/dashboard/staff",
  payments:  "/dashboard/settings?tab=payments",
  go_live:   "/dashboard",
};

export default function SetupBanner() {
  const locale = useLocale();
  const [data, setData] = useState<SetupData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
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
  const completedSteps = data.steps.filter((s) => s.complete);
  const isDE = locale === "de" || locale === "fr";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-s-dm-surface rounded-card border border-s-coral/20 dark:border-s-coral/30 shadow-warm-sm mb-6 overflow-hidden"
    >
      {/* Summary row */}
      <div className="p-4">
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
              {incompleteSteps.slice(0, 2).map((step) => (
                <span key={step.key} className="px-2 py-0.5 rounded-pill text-[10px] bg-s-coral/5 text-s-coral font-medium">
                  {isDE ? step.label : step.label_en}
                </span>
              ))}
              {incompleteSteps.length > 2 && (
                <span className="px-2 py-0.5 rounded-pill text-[10px] bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/30 dark:text-s-dm-text/30">
                  +{incompleteSteps.length - 2}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral transition-colors"
              aria-label={expanded ? "Einklappen" : "Details anzeigen"}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? (isDE ? "Weniger" : "Less") : (isDE ? "Details" : "Details")}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-ink/50 dark:hover:text-s-dm-text/50 transition-colors"
              aria-label="Schließen"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable checklist */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-s-ink/5 dark:border-white/5 px-4 py-3 space-y-1.5">
              {data.steps.map((step) => (
                <Link
                  key={step.key}
                  href={`/${locale}${STEP_LINKS[step.key] ?? "/dashboard"}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-button hover:bg-s-bg-surface dark:hover:bg-s-dm-raised transition-colors group"
                >
                  <div className={[
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    step.complete
                      ? "bg-s-coral text-white"
                      : "border-2 border-s-ink/15 dark:border-white/15 group-hover:border-s-coral",
                  ].join(" ")}>
                    {step.complete && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span className={[
                    "text-sm flex-1",
                    step.complete
                      ? "text-s-ink/50 dark:text-s-dm-text/50 line-through"
                      : "text-s-ink dark:text-s-dm-text",
                  ].join(" ")}>
                    {isDE ? step.label : step.label_en}
                  </span>
                  {!step.complete && (
                    <ArrowRight size={13} className="text-s-ink/20 dark:text-s-dm-text/20 group-hover:text-s-coral transition-colors" />
                  )}
                </Link>
              ))}
            </div>
            <div className="px-4 pb-3">
              <Link
                href={`/${locale}/dashboard/setup`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors w-full"
              >
                {isDE ? "Setup abschließen" : "Complete setup"}
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
