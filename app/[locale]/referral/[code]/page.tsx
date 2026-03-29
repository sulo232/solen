"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const REDIRECT_SECONDS = 5;
const STORAGE_KEY = "solen_referral_code";

interface Props {
  params: { code: string; locale: string };
}

export default function ReferralLandingPage({ params }: Props) {
  const t = useTranslations("referral");
  const locale = useLocale();
  const router = useRouter();
  const { code } = params;

  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [stored, setStored] = useState(false);

  // Store referral code in localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && code) {
      localStorage.setItem(STORAGE_KEY, code);
      setStored(true);
    }
  }, [code]);

  // Auto-redirect countdown
  useEffect(() => {
    if (!stored) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(`/${locale}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stored, locale, router]);

  const handleCta = () => {
    router.push(`/${locale}`);
  };

  return (
    <main className="min-h-screen bg-[--base] dark:bg-s-dm-bg flex items-center justify-center px-4 py-16">
      {/* Ambient warm background */}
      <div className="ambient-v5 pointer-events-none" aria-hidden="true" />

      <div
        className={cn(
          "relative z-10 w-full max-w-md",
          "bg-[--raised] dark:bg-s-dm-surface",
          "rounded-card-lg shadow-elevation-3",
          "p-8 sm:p-10 text-center",
          "flex flex-col items-center gap-6"
        )}
      >
        {/* Icon badge */}
        <div
          className="w-16 h-16 rounded-full bg-s-coral/10 dark:bg-s-coral/15 flex items-center justify-center"
          aria-hidden="true"
        >
          <Gift className="w-8 h-8 text-s-coral" strokeWidth={1.75} />
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl text-s-ink dark:text-s-dm-text leading-none tracking-wide uppercase">
            {t("headline")}
          </h1>
          <p className="font-body text-base text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed max-w-sm mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Referral code badge */}
        <div
          className={cn(
            "flex items-center gap-2 px-5 py-2.5",
            "rounded-pill bg-s-coral/[0.08] dark:bg-s-coral/[0.12]",
            "border border-s-coral/20"
          )}
        >
          <Sparkles className="w-4 h-4 text-s-coral flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="font-body text-xs font-semibold text-s-ink/60 dark:text-s-dm-text/60 uppercase tracking-widest mr-1">
            {t("codeLabel")}
          </span>
          <span className="font-body text-sm font-bold text-s-coral tracking-wider">
            {code}
          </span>
        </div>

        {/* CTA button */}
        <button
          onClick={handleCta}
          aria-label={t("cta")}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "bg-s-coral text-white font-heading font-semibold text-base",
            "rounded-btn px-8 py-4",
            "shadow-coral-glow",
            "hover:brightness-[1.06] active:scale-[0.98]",
            "transition-[transform,filter] duration-150"
          )}
        >
          {t("cta")}
          <ArrowRight className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
        </button>

        {/* Countdown redirect notice */}
        {secondsLeft > 0 && stored && (
          <p className="font-body text-xs text-s-ink/40 dark:text-s-dm-text/35">
            {t("redirect", { seconds: secondsLeft })}
          </p>
        )}
      </div>
    </main>
  );
}
