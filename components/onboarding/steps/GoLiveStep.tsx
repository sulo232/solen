"use client";

import { useState, useEffect } from "react";
import { Rocket, Check, X, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";
import Spinner from "@/components/ui/Spinner";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

interface GoLiveStepProps {
  locale: string;
  onGoLive: () => void;
}

export default function GoLiveStep({ locale, onGoLive }: GoLiveStepProps) {
  const isDE = locale === "de" || locale === "fr";
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [going, setGoing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetch("/api/salon/setup-progress")
      .then((r) => r.json())
      .then((d) => setSteps(d.steps ?? []))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = steps.filter((s) => s.complete).length;
  const isCoreReady = steps.filter((s) => ["profile", "hours", "services"].includes(s.key)).every((s) => s.complete);

  const handleGoLive = async () => {
    setGoing(true);
    setShowConfetti(true);
    // Brief delay for confetti effect
    await new Promise((r) => setTimeout(r, 2000));
    onGoLive();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-s-coral/10 flex items-center justify-center">
          <Rocket size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink">
            {isDE ? "Bereit zum Start!" : "Ready to Launch!"}
          </h2>
          <p className="text-sm text-s-ink/40">
            {isDE ? "Überprüfe deine Einstellungen und geh live" : "Review your settings and go live"}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-card border border-s-ink/5 p-6 space-y-3">
        <p className="text-xs font-medium text-s-ink/50 mb-2">
          {isDE ? "Setup-Checkliste" : "Setup checklist"} — {completedCount}/{steps.length}
        </p>
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-3">
            <div className={[
              "w-6 h-6 rounded-full flex items-center justify-center",
              step.complete ? "bg-s-coral/10" : "bg-s-bg-sunken",
            ].join(" ")}>
              {step.complete
                ? <Check size={12} className="text-s-coral" strokeWidth={3} />
                : <X size={12} className="text-s-ink/20" />}
            </div>
            <p className={["text-sm", step.complete ? "text-s-ink" : "text-s-ink/30"].join(" ")}>
              {isDE ? step.label : step.label_en}
            </p>
          </div>
        ))}
      </div>

      {!isCoreReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-card px-4 py-3">
          <p className="text-sm text-amber-700">
            {isDE
              ? "⚠️ Bitte fülle mindestens Profil, Öffnungszeiten und Services aus."
              : "⚠️ Please complete at least Profile, Opening Hours, and Services."}
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
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="font-heading font-bold text-2xl text-s-ink mb-2">
              {isDE ? "Dein Salon ist live!" : "Your salon is live!"}
            </h2>
            <p className="text-sm text-s-ink/50">
              {isDE ? "Kunden können ab jetzt buchen" : "Customers can now book appointments"}
            </p>
          </motion.div>
        </motion.div>
      )}

      <button
        onClick={handleGoLive}
        disabled={!isCoreReady || going}
        className="w-full py-4 rounded-button bg-s-coral text-white text-base font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-s-coral/90 transition-colors shadow-lg shadow-s-coral/20"
      >
        {going ? <Spinner size="sm" invert /> : <PartyPopper size={18} />}
        {isDE ? "Salon aktivieren" : "Go Live"} 🎉
      </button>
    </div>
  );
}
