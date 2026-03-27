"use client";

import { useState, useEffect } from "react";
import { Rocket, Check, X, PartyPopper, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Spinner from "@/components/ui/Spinner";
import { useTranslations, useLocale } from "next-intl";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

interface GoLiveStepProps {
  onGoLive: () => void;
  steps: Step[];
  goTo: (index: number) => void;
}

export default function GoLiveStep({ onGoLive, steps, goTo }: GoLiveStepProps) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const isDE = locale === "de" || locale === "fr";
  const [going, setGoing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const completedCount = steps.filter((s) => s.complete).length;
  const isCoreReady = steps.filter((s) => ["profile", "hours", "services"].includes(s.key)).every((s) => s.complete);

  const handleGoLive = async () => {
    setGoing(true);
    setShowConfetti(true);
    await new Promise((r) => setTimeout(r, 2000));
    onGoLive();
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-card bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
          <Rocket size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t("goLive.title")}
          </h2>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50">
            {t("goLive.subtitle")}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 space-y-3">
        <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">
          {t("goLive.checklist")} — {completedCount}/{steps.length}
        </p>
        {steps.map((step, i) => (
          <button 
            key={step.key} 
            onClick={() => goTo(i)}
            disabled={step.key === "go_live"}
            className="w-full flex items-center justify-between group hover:bg-s-bg-sunken dark:hover:bg-s-dm-raised p-2 -mx-2 rounded-lg transition-colors cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              <div className={[
                "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                step.complete ? "bg-s-coral/10 dark:bg-s-coral/20" : "bg-s-bg-sunken dark:bg-s-dm-raised group-hover:bg-s-ink/5",
              ].join(" ")}>
                {step.complete
                  ? <Check size={12} className="text-s-coral" strokeWidth={3} />
                  : <X size={12} className="text-s-ink/20 dark:text-s-dm-text/20" />}
              </div>
              <p className={["text-sm", step.complete ? "text-s-ink dark:text-s-dm-text" : "text-s-ink/40 dark:text-s-dm-text/40"].join(" ")}>
                {isDE ? step.label : step.label_en}
              </p>
            </div>
          </button>
        ))}
      </div>

      {!isCoreReady && (
        <div className="bg-s-warning-bg dark:bg-s-warning-bg/20 border border-s-warning/30 rounded-card px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-s-warning shrink-0" />
          <p className="text-sm text-s-warning">
            {t("goLive.warning")}
          </p>
        </div>
      )}

      {/* Confetti overlay */}
      {showConfetti && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-s-dm-bg/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8 }}
              className="flex justify-center mb-4"
            >
              <PartyPopper size={48} className="text-s-coral" />
            </motion.div>
            <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-2">
              {t("goLive.live")}
            </h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">
              {t("goLive.liveSubtitle")}
            </p>
          </motion.div>
        </motion.div>
      )}

      <button
        onClick={handleGoLive}
        disabled={!isCoreReady || going}
        className="w-full py-4 rounded-btn active:scale-[0.98] bg-s-coral text-white text-base font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] transition-all shadow-warm-sm"
      >
        {going ? <Spinner size="sm" invert /> : <PartyPopper size={18} />}
        {t("goLive.activate")}
      </button>
    </div>
  );
}
