"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Check } from "lucide-react";

interface Step {
  key: string;
  label: string;
  label_en: string;
  complete: boolean;
}

export default function SetupBanner() {
  const locale = useLocale();
  const t = useTranslations("dashboard.setupBanner");
  // Step names come from the same i18n map the setup wizard uses — the API
  // sends only { key, complete } (blank-label bug, W14.5 triage 2026-06-12).
  const tSteps = useTranslations("onboarding.setup.steps");
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

  // P7 (owner-approved 2026-07-16, "RIP seven is approved"): every step renders now, not
  // just the open ones , done = green check, the first incomplete step = the filled
  // "current" disc with its step number, the rest = an outline disc. Progress bar, count
  // and the Einrichten links stay exactly as they were.
  const currentIndex = data.steps.findIndex((s) => !s.complete);

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] p-4 mb-6 bg-white">
      {/* mockup-ok: D2 fix, sentence case 13px semibold (approved public/_mockups/fixes-refined) */}
      <p className="text-[13px] font-heading font-semibold text-s-star mb-1">{t("eyebrow")}</p>
      <p className="font-heading text-sm text-s-ink mb-3">
        {t("salonSetup")}: {data.completed}/{data.total} {t("done")}
      </p>
      {/* Progress bar. motion audit RANK 5: was `transition-[width]` (hard rule 2),
          converted to a transform-only scaleX from the left edge, retimed to the
          reveal tier (250-300ms, THE SPEED LAW) since the fill travels. */}
      <div className="h-1.5 rounded-full bg-s-bg-sunken mb-4 overflow-hidden">
        <div className="h-full w-full origin-left bg-s-accent rounded-full transition-transform duration-[280ms]"
          style={{ transform: `scaleX(${data.percentage / 100})` }} />
      </div>
      {/* Steps list , the whole plan, done/current/upcoming all visible up front */}
      {data.steps.map((step, i) => {
        const isCurrent = i === currentIndex;
        const discClass = `w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[12px] font-semibold ${
          step.complete
            ? "bg-s-success text-white"
            : isCurrent
              ? "bg-s-ink text-white"
              : "border border-s-ink-2 text-s-ink-2"
        }`;
        const labelClass = `text-xs font-heading flex-1 ${
          step.complete
            ? "text-s-ink-2 line-through"
            : isCurrent
              ? "text-s-ink font-semibold"
              : "text-s-ink-2"
        }`;
        return (
          <div key={step.key} className="flex items-center gap-3 py-2.5 border-b border-s-ink/[0.04] last:border-0">
            <div className={discClass}>
              {step.complete ? <Check className="w-3 h-3" strokeWidth={2.5} /> : i + 1}
            </div>
            <p className={labelClass}>
              {tSteps(step.key as Parameters<typeof tSteps>[0])}
            </p>
            {!step.complete && (
              /* mockup-ok: D2 fix, sentence case 13px semibold (approved public/_mockups/fixes-refined) */
              <Link href={`/${locale}/dashboard/setup`}
                className="text-[13px] font-heading font-semibold text-s-coral">
                {t("setUp")} →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
