"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

interface SetupWizardProps {
  salonId: string;
  initialSteps: Step[];
  children: React.ReactNode[];
  locale: string;
  onComplete: () => void;
}

export default function SetupWizard({ salonId, initialSteps, children, locale, onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(initialSteps);
  const [direction, setDirection] = useState(1);
  const t = useTranslations("onboarding");

  const isDE = locale === "de" || locale === "fr";
  const totalSteps = children.length;
  const isLast = currentStep === totalSteps - 1;

  const goNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const goTo = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  const markComplete = (key: string) => {
    setSteps((prev) => prev.map((s) => s.key === key ? { ...s, complete: true } : s));
  };

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg">
      {/* Step indicator */}
      <div className="bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-sm border-b border-s-ink/5 dark:border-white/5 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">
              {t("setup.title")}
            </h1>
            <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40 data-text">
              {currentStep + 1} / {totalSteps}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <button
                  key={step.key}
                  onClick={() => goTo(i)}
                  className="flex flex-col items-center relative z-10 group"
                >
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                      i === currentStep
                        ? "bg-s-coral text-white scale-110 shadow-warm-sm"
                        : step.complete
                          ? "bg-s-coral/10 dark:bg-s-coral/20 text-s-coral"
                          : "bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/30 dark:text-s-dm-text/30",
                    ].join(" ")}
                  >
                    {step.complete && i !== currentStep ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={[
                      "text-[10px] mt-1 whitespace-nowrap hidden sm:block transition-colors",
                      i === currentStep ? "text-s-coral font-medium" : "text-s-ink/30 dark:text-s-dm-text/30",
                    ].join(" ")}
                  >
                    {isDE ? step.label : step.label_en}
                  </span>
                </button>
              ))}
            </div>
            {/* Connecting line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-s-bg-sunken dark:bg-s-dm-raised -z-0" />
            <motion.div
              className="absolute top-4 left-4 h-0.5 bg-s-coral -z-0"
              initial={false}
              animate={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {typeof children[currentStep] === "function"
              ? (children[currentStep] as Function)({ goNext, markComplete, salonId })
              : children[currentStep]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-s-ink/5 dark:border-white/5">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-btn text-sm text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} />
            {t("setup.back")}
          </button>

          <div className="flex gap-2">
            {!isLast && (
              <button
                onClick={goNext}
                className="px-4 py-2.5 rounded-btn text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
              >
                {t("setup.skip")}
              </button>
            )}
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-all shadow-warm-sm"
            >
              {isLast ? t("setup.goLive") : t("setup.next")}
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
