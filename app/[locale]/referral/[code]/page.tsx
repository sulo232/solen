"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Gift, ArrowRight, BadgePercent } from "lucide-react";
import { cn } from "@/lib/utils";
import { REFERRAL_STORAGE_KEY } from "@/lib/referral/storage";

const STORAGE_KEY = REFERRAL_STORAGE_KEY;

interface Props {
  params: Promise<{ code: string; locale: string }>;
}

export default function ReferralLandingPage({ params }: Props) {
  const t = useTranslations("referral");
  const locale = useLocale();
  const router = useRouter();
  // Note: In client components, params are passed directly (not as Promise)
  // This type signature is for Next.js 15 compatibility
  const code = (params as any).code;

  // Store referral code in localStorage on mount. No auto-redirect: the user
  // stays in control and continues via the explicit CTA below (owner fix,
  // MOCKUP_QUEUE.md item 3, 2026-07-25).
  useEffect(() => {
    if (typeof window !== "undefined" && code) {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, [code]);

  const handleCta = () => {
    router.push(`/${locale}`);
  };

  return (
    <main className="min-h-screen bg-[--base] flex items-center justify-center px-4 py-16">
      {/* Ambient warm background */}
      <div className="ambient-v5 pointer-events-none" aria-hidden="true" />

      <div
        className={cn(
          "relative z-10 w-full max-w-md",
          "bg-[--raised]",
          "rounded-card-lg shadow-elevation-3",
          "p-8 sm:p-10 text-center",
          "flex flex-col items-center gap-6"
        )}
      >
        {/* Icon badge */}
        <div
          className="w-16 h-16 rounded-full bg-s-ink/10 flex items-center justify-center"
          aria-hidden="true"
        >
          <Gift className="w-8 h-8 text-s-ink" strokeWidth={1.75} />
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl text-s-ink leading-none tracking-wide uppercase">
            {t("headline")}
          </h1>
          <p className="font-body text-base text-s-ink/70 leading-relaxed max-w-sm mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Referral code badge */}
        <div
          className={cn(
            "flex items-center gap-2 px-5 py-2.5",
            "rounded-pill bg-s-bg-sunken",
            "border border-s-border"
          )}
        >
          <BadgePercent className="w-4 h-4 text-s-ink-2 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-body text-xs font-semibold text-s-ink-2 uppercase tracking-widest mr-1">
            {t("codeLabel")}
          </span>
          <span className="font-body text-sm font-bold text-s-ink tracking-wider">
            {code}
          </span>
        </div>

        {/* CTA button. mockup-ok: MOCKUP_QUEUE.md item 3, the auto-redirect notice that used to sit
            below this button is removed here, this is the recorded recommendation, not a new design choice */}
        <button
          onClick={handleCta}
          aria-label={t("cta")}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "bg-s-ink text-white font-heading text-base",
            "rounded-btn px-8 py-4",
            "shadow-elevation-2",
            "hover:brightness-[1.06] active:scale-[0.97]",
            "transition-[transform,filter] duration-150"
          )}
        >
          {t("cta")}
          <ArrowRight className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
