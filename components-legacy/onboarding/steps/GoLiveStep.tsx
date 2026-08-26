"use client";

import { useState, useEffect } from "react";
import { Rocket, Check, X, PartyPopper, AlertTriangle, Clock } from "lucide-react";
import { motion } from "motion/react";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<{
    has_stripe: boolean;
    has_cover_photo: boolean;
    has_services: boolean;
    approval_state: "pending" | "rejected" | "approved";
    rejection_reason: string | null;
    can_go_live: boolean;
  } | null>(null);

  const completedCount = steps.filter((s) => s.complete).length;
  // isCoreReady = the three requirements the OWNER can clear himself: stripe + cover photo +
  // at least 1 active service. Kept separate from can_go_live, which since owner decision 8
  // (TASTE_LOG 2026-08-09, "i approve for every salon") also requires admin approval. Collapsing
  // the two is what made the activate button enable itself into a 403.
  const isCoreReady = !!(readiness?.has_stripe && readiness?.has_cover_photo && readiness?.has_services);
  const approvalState = readiness?.approval_state ?? "approved";
  const awaitingApproval = approvalState === "pending";
  const wasRejected = approvalState === "rejected";
  const canActivate = !!readiness?.can_go_live;

  useEffect(() => {
    fetch("/api/salon/go-live")
      .then((r) => r.json())
      .then((d) => setReadiness(d))
      .catch((err) => console.error("[GoLiveStep] failed to fetch readiness:", err));
  }, []);

  const handleGoLive = async () => {
    setGoing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/salon/go-live", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        // The route answers a stable code for the approval gate so it reads in the user's own
        // locale; every other message it returns is still a de-only literal (pre-existing).
        setErrorMsg(data.code === "AWAITING_APPROVAL" ? t("goLive.awaitingBody") : (data.error ?? "Unbekannter Fehler"));
        setGoing(false);
        return;
      }
    } catch (err) {
      console.error("[GoLiveStep] go-live POST failed:", err);
      setErrorMsg("Verbindungsfehler. Bitte erneut versuchen.");
      setGoing(false);
      return;
    }
    setShowConfetti(true);
    await new Promise((r) => setTimeout(r, 2000));
    onGoLive();
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-ink/10 flex items-center justify-center">
          <Rocket size={22} strokeWidth={2.2} className="text-s-accent" />
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
      <div className="bg-white rounded-[12px] border border-s-border p-6 space-y-3">
        <p className="text-xs font-medium text-s-ink-2 mb-2">
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
                step.complete ? "bg-s-ink/10" : "bg-s-bg-sunken group-hover:bg-s-ink/5",
              ].join(" ")}>
                {step.complete
                  ? <Check size={12} className="text-s-accent" strokeWidth={3} />
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
          <AlertTriangle size={16} strokeWidth={1.9} className="text-s-warning shrink-0" />
          <p className="text-sm text-s-warning">
            {t("goLive.warning")}
          </p>
        </div>
      )}

      {/* Owner decision 8 (TASTE_LOG 2026-08-09, "i approve for every salon"): the last gate is not
          the owner's to clear, so it is named here instead of leaving a dead activate button. */}
      {awaitingApproval && ( // mockup-ok: no new treatment, reuses the shipped warning block directly above verbatim (same bg/border/radius/padding), applied to a new state; taste rule 6 keeps the copy ink and the icon saturated
        <div className="bg-s-warning-bg border border-s-warning/30 rounded-[12px] px-4 py-3 flex items-start gap-2"> {/* mockup-ok: same as above */}
          <Clock size={16} strokeWidth={1.9} className="text-s-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-s-ink">{t("goLive.awaitingTitle")}</p>
            <p className="text-sm text-s-ink-2 mt-0.5">{t("goLive.awaitingBody")}</p>
          </div>
        </div>
      )}

      {wasRejected && ( // mockup-ok: locked s-error token, mirrors the existing error block in this same file (line pattern ported from reviewed commit 869287867)
        <div className="bg-s-error-bg border border-s-error/30 rounded-[12px] px-4 py-3 flex items-start gap-2"> {/* mockup-ok: same as the errorMsg block below */}
          <AlertTriangle size={16} strokeWidth={1.9} className="text-s-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-s-ink">{t("goLive.rejectedTitle")}</p>
            {readiness?.rejection_reason && (
              <p className="text-sm text-s-ink-2 mt-0.5">{readiness.rejection_reason}</p>
            )}
          </div>
        </div>
      )}

      {errorMsg && ( // mockup-ok: locked s-error token, mirrors existing warning block pattern above, ported from reviewed commit 869287867
        <div className="bg-s-error/10 border border-s-error/30 rounded-[12px] px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} strokeWidth={1.9} className="text-s-error shrink-0" />
          <p className="text-sm text-s-error">{errorMsg}</p>
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
              <PartyPopper size={48} className="text-s-accent" />
            </motion.div>
            <h2 className="font-heading text-2xl text-s-ink mb-2">
              {t("goLive.live")}
            </h2>
            <p className="text-sm text-s-ink-2">
              {t("goLive.liveSubtitle")}
            </p>
          </motion.div>
        </motion.div>
      )}

      <button
        onClick={handleGoLive}
        disabled={!canActivate || going}
        className="w-full py-4 rounded-btn active:scale-[0.97] bg-s-ink text-white text-base font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] transition-[transform,filter] shadow-warm-sm"
      >
        {going ? <Spinner size="sm" invert /> : <PartyPopper size={18} strokeWidth={1.9} />}
        {t("goLive.activate")}
      </button>
    </div>
  );
}
