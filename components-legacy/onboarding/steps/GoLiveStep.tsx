"use client";

import { useState, useEffect } from "react";
import { Rocket, Check, X, PartyPopper, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Spinner from "@/components-legacy/ui/Spinner";
import { useTranslations, useLocale } from "next-intl";

interface Step {
  key: string;
  complete: boolean;
}

interface GoLiveStepProps {
  onGoLive: () => void;
  steps: Step[];
  goTo: (index: number) => void;
}

export default function GoLiveStep({ onGoLive, steps, goTo }: GoLiveStepProps) {
  const t = useTranslations("onboarding") as any;
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
        <div className="w-12 h-12 rounded-[12px] bg-s-coral/10 flex items-center justify-center">
          <Rocket size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-s-ink">
            {t("goLive.title")}
          </h2>
          <p className="text-sm text-s-ink/40">
            {t("goLive.subtitle")}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-[12px] border border-s-ink/5 p-6 space-y-3">
        <p className="text-xs font-medium text-s-ink/50 mb-2">
          {t("goLive.checklist")} — {completedCount}/{steps.length}
        </p>
        {steps.map((step, i) => (
          <button 
            key={step.key} 
            onClick={() => goTo(i)}
            disabled={step.key === "go_live"}
            className="w-full flex items-center justify-between group hover:bg-s-bg-sunken p-2 -mx-2 rounded-[8px] transition-colors cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
          >
            <div className="flex items-center gap-3">
              <div className={[
                "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                step.complete ? "bg-s-coral/10" : "bg-s-bg-sunken group-hover:bg-s-ink/5",
              ].join(" ")}>
                {step.complete
                  ? <Check size={12} className="text-s-coral" strokeWidth={3} />
                  : <X size={12} className="text-s-ink/20" />}
              </div>
              <p className={["text-sm", step.complete ? "text-s-ink" : "text-s-ink/40"].join(" ")}>
                {t(`setup.steps.${step.key}` as any)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {!isCoreReady && (
        <div className="bg-s-warning-bg border border-s-warning/30 rounded-[12px] px-4 py-3 flex items-center gap-2">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
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
            <h2 className="font-heading text-2xl text-s-ink mb-2">
              {t("goLive.live")}
            </h2>
            <p className="text-sm text-s-ink/50">
              {t("goLive.liveSubtitle")}
            </p>
          </motion.div>
        </motion.div>
      )}

      <button
        onClick={handleGoLive}
        disabled={!isCoreReady || going}
        className="w-full py-4 rounded-btn active:scale-[0.97] bg-s-coral text-white text-base font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] transition-[transform,filter] shadow-warm-sm"
      >
        {going ? <Spinner size="sm" invert /> : <PartyPopper size={18} />}
        {t("goLive.activate")}
      </button>
    </div>
  );
}
