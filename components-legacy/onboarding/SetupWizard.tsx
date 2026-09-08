"use client";

import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Spinner from "@/components-legacy/ui/Spinner";

export interface Step {
  key: string;
  complete: boolean;
}

export interface StepHandle {
  save: () => Promise<boolean>;
}

export interface SetupWizardRenderProps {
  goNext: () => Promise<void>;
  markComplete: (key: string) => void;
  goTo: (index: number) => void;
  steps: Step[];
  salonId: string;
  stepRef: (instance: StepHandle | null) => void;
}

export async function saveCurrentSetupStep(handle: StepHandle | null): Promise<boolean> {
  if (!handle) return false;
  try {
    return await handle.save();
  } catch (err) {
    console.error("[SetupWizard] step save failed:", err);
    return false;
  }
}

export async function saveAndAdvanceSetupStep(
  handle: StepHandle | null,
  advance: () => void,
): Promise<boolean> {
  const saved = await saveCurrentSetupStep(handle);
  if (!saved) return false;
  advance();
  return true;
}

function StepMountSignal({
  index,
  onMount,
  onUnmount,
  children,
}: {
  index: number;
  onMount: (index: number) => void;
  onUnmount: (index: number) => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    onMount(index);
    return () => onUnmount(index);
  }, [index, onMount, onUnmount]);
  return <>{children}</>;
}

interface SetupWizardProps {
  salonId: string;
  initialSteps: Step[];
  children: (React.ReactNode | ((props: SetupWizardRenderProps) => React.ReactNode))[];
  locale: string;
  onComplete: () => void;
}

export default function SetupWizard({ salonId, initialSteps, children, locale, onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(initialSteps);
  const [direction, setDirection] = useState(1);
  const [advancing, setAdvancing] = useState(false);
  const stepRefs = useRef<(StepHandle | null)[]>([]);
  const displayedStepRef = useRef<number | null>(null);
  const actionInFlightRef = useRef(false);
  const t = useTranslations("onboarding") as any;

  // Sync when parent re-fetches progress (e.g. after onSaved callbacks)
  useEffect(() => {
    if (initialSteps.length > 0) setSteps(initialSteps);
  }, [initialSteps]);

  const totalSteps = children.length;
  const isLast = currentStep === totalSteps - 1;

  const markDisplayed = useCallback((index: number) => {
    displayedStepRef.current = index;
  }, []);

  const clearDisplayed = useCallback((index: number) => {
    if (displayedStepRef.current === index) displayedStepRef.current = null;
  }, []);

  const goNext = async () => {
    if (actionInFlightRef.current || displayedStepRef.current !== currentStep) return;
    actionInFlightRef.current = true;
    setAdvancing(true);
    try {
      const saved = await saveCurrentSetupStep(stepRefs.current[currentStep]);
      if (!saved) return;
      if (isLast) {
        onComplete();
        return;
      }
      setDirection(1);
      setCurrentStep(Math.min(currentStep + 1, totalSteps - 1));
    } finally {
      actionInFlightRef.current = false;
      setAdvancing(false);
    }
  };

  const skipStep = () => {
    if (actionInFlightRef.current || displayedStepRef.current !== currentStep) return;
    setDirection(1);
    setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
  };

  const goPrev = () => {
    if (actionInFlightRef.current || displayedStepRef.current !== currentStep) return;
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const goTo = (index: number) => {
    if (actionInFlightRef.current || displayedStepRef.current !== currentStep) return;
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  const markComplete = (key: string) => {
    setSteps((prev) => prev.map((s) => s.key === key ? { ...s, complete: true } : s));
  };

  return (
    <main className="min-h-screen bg-s-bg-surface">
      {/* Step indicator */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-s-ink/5 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-heading text-lg text-s-ink">
              {t("setup.title")}
            </h1>
            <span className="text-xs text-s-ink/40 data-text">
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
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300",
                      i === currentStep
                        ? "bg-s-ink text-white scale-110 shadow-warm-sm"
                        : step.complete
                          ? "bg-s-ink/10 text-s-accent"
                          : "bg-s-bg-sunken text-s-ink/30",
                    ].join(" ")}
                  >
                    {step.complete && i !== currentStep ? (
                      <Check size={14} strokeWidth={1.6} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={[
                      "text-[12px] mt-1 whitespace-nowrap hidden sm:block transition-colors",
                      i === currentStep ? "text-s-accent font-medium" : "text-s-ink/30",
                    ].join(" ")}
                  >
                    {t(`setup.steps.${step.key}` as any)}
                  </span>
                </button>
              ))}
            </div>
            {/* Connecting line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-s-bg-sunken -z-0" />
            <motion.div
              className="absolute top-4 left-4 h-0.5 bg-s-ink -z-0"
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
            initial={{ opacity: 0, y: direction * 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction * -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <StepMountSignal
              index={currentStep}
              onMount={markDisplayed}
              onUnmount={clearDisplayed}
            >
              {typeof children[currentStep] === "function"
                ? children[currentStep]({
                    goNext,
                    markComplete,
                    goTo,
                    steps,
                    salonId,
                    stepRef: (instance) => {
                      stepRefs.current[currentStep] = instance;
                    },
                  })
                : isValidElement<{ ref?: (instance: StepHandle | null) => void }>(children[currentStep])
                  ? cloneElement(children[currentStep], {
                      ref: (instance: StepHandle | null) => {
                        stepRefs.current[currentStep] = instance;
                      },
                    })
                  : children[currentStep]}
            </StepMountSignal>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-s-border">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-btn text-sm text-s-ink-2 hover:text-s-ink transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft size={16} strokeWidth={1.9} />
            {t("setup.back")}
          </button>

          <div className="flex gap-2">
            {!isLast && (
              <button
                onClick={skipStep}
                disabled={advancing}
                className="px-4 py-2.5 rounded-btn text-sm text-s-ink/40 hover:text-s-ink transition-colors disabled:opacity-50"
              >
                {t("setup.skip")}
              </button>
            )}
            <button
              onClick={goNext}
              disabled={advancing}
              aria-busy={advancing}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-btn active:scale-[0.97] bg-s-ink text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] shadow-warm-sm disabled:opacity-50"
            >
              {advancing && <Spinner size="sm" invert />}
              {isLast ? t("setup.goLive") : t("setup.next")}
              {!isLast && <ChevronRight size={16} strokeWidth={1.9} />}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
