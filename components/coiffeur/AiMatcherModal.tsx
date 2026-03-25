"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

// ── Question data ──────────────────────────────────────────────────────────

const STEPS = [
  {
    question: "Was ist dein Haartyp?",
    options: ["Lockig", "Wellig", "Glatt", "Fein", "Kräftig", "Gefärbt"],
  },
  {
    question: "Welchen Service suchst du?",
    options: ["Schneiden", "Färben", "Behandlung", "Styling", "Extensions", "Beratung"],
  },
  {
    question: "Wie wichtig ist dir…?",
    options: ["Preis", "Nähe", "Bewertungen", "Verfügbarkeit", "Spezialisierung"],
  },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface AiMatcherModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AiMatcherModal({ open, onClose }: AiMatcherModalProps) {
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset state when modal reopens
  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers([]);
      setSelected(null);
      setDone(false);
    }
  }, [open]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const currentStep = STEPS[step];
  const progress = ((step + (done ? 1 : 0)) / STEPS.length) * 100;

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setDone(true);
    }
  };

  const searchQuery = answers.join(" ") + (selected ? ` ${selected}` : "");

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="KI-Salon-Empfehlung"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-s-ink/40 backdrop-blur-panel"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-md bg-white dark:bg-s-dm-surface rounded-t-[24px] sm:rounded-[24px] shadow-warm-xl overflow-hidden"
        style={{ animation: "slideUp 0.35s var(--ease, cubic-bezier(0.34,1.56,0.64,1)) both" }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-s-ink/5 dark:bg-white/5">
          <div
            className="h-full bg-s-coral transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-s-coral" />
            <span className="font-heading font-bold text-s-ink dark:text-s-dm-text text-sm tracking-[0.1em] uppercase">
              KI-Empfehlung
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-pill hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Schließen"
          >
            <X size={18} className="text-s-ink/50 dark:text-s-dm-text/50" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {!done ? (
            <>
              {/* Step indicator */}
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 font-body mb-3">
                Schritt {step + 1} von {STEPS.length}
              </p>

              {/* Question */}
              <h2
                key={step}
                className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-5"
                style={{ animation: "fadeSlideIn 0.3s var(--ease, ease) both" }}
              >
                {currentStep.question}
              </h2>

              {/* Options */}
              <div
                key={`opts-${step}`}
                className="flex flex-wrap gap-2 mb-6"
                style={{ animation: "fadeSlideIn 0.35s var(--ease, ease) 0.05s both" }}
              >
                {currentStep.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelected(opt === selected ? null : opt)}
                    className={`px-4 py-2 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] border transition-all duration-200 ${
                      selected === opt
                        ? "bg-s-coral text-white border-s-coral shadow-warm-sm"
                        : "bg-s-bg-surface dark:bg-s-dm-surface text-s-ink/70 dark:text-s-dm-text/70 border-s-ink/10 dark:border-white/10 hover:border-s-coral"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={handleNext}
                disabled={!selected}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-heading font-bold uppercase tracking-[.04em] text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-[1.06] transition-all shadow-warm-sm"
              >
                {step < STEPS.length - 1 ? "Weiter" : "Empfehlung anzeigen"}
                <ChevronRight size={16} />
              </button>
            </>
          ) : (
            /* Done state */
            <div
              className="text-center py-4"
              style={{ animation: "fadeSlideIn 0.4s var(--ease, ease) both" }}
            >
              <div className="w-14 h-14 rounded-pill bg-s-coral/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={26} className="text-s-coral" />
              </div>
              <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
                Wir haben Salons für dich!
              </h2>
              <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mb-6">
                Basierend auf deinen Antworten zeigen wir dir die besten Matches in Basel.
              </p>
              <Link
                href={`/${locale}/coiffeur?q=${encodeURIComponent(searchQuery.trim())}`}
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-heading font-bold uppercase tracking-[.04em] text-xs hover:brightness-[1.06] transition-all shadow-warm-sm"
              >
                Salons entdecken <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
