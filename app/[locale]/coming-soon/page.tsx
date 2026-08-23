"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, ArrowLeft, Bell, Gift, Star, Send, Heart, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

// V3-D307: emojis (LOCKFILE §0 hard rule 1 — "No emoji. Anywhere in code/files/UI/commits") → lucide-react icons; inline rgba background tints → neutral s-bg-sunken (Layer 1 chrome per LOCKFILE §1)
const FEATURE_MAP: Record<string, { Icon: LucideIcon }> = {
  vouchers: { Icon: Gift },
  loyalty: { Icon: Star },
  referral: { Icon: Send },
};

export default function ComingSoonPage() {
  const locale = useLocale();
  const t = useTranslations("comingSoon");
  const params = useSearchParams() ?? new URLSearchParams();
  const feature = params.get("feature") ?? "default";
  const meta = FEATURE_MAP[feature] ?? { Icon: Clock };
  const FeatureIcon = meta.Icon;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const descriptionMap: Record<string, string> = {
    vouchers: t("description_vouchers"),
    loyalty: t("description_loyalty"),
    referral: t("description_referral"),
  };
  const description = descriptionMap[feature] ?? t("descriptionDefault");

  const handleNotify = async () => {
    if (!email.includes("@")) return;
    try {
      const res = await fetch("/api/coming-soon-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feature }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error("[ComingSoon] Notify error:", err);
      // Still show success — email capture is best-effort
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* V3-D307: bg-[--base]/bg-[--raised] CSS vars → bg-white/bg-white; retired s-coral CTA → bg-s-ink primary (LOCKFILE §0 rule 2); retired s-sage success → s-success (universal-color convention LOCKFILE §1); arbitrary s-ink/X opacities → canonical s-ink-2; H1 normalized to Salon-PDP H1 spec (LOCKFILE §2) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Owner picked stop 4 on /dev/mock/versions/coming-soon-icon, 2026-08-14: no grey tile,
            the glyph carries itself at 64. "i never want this anywhere". */}
        <FeatureIcon size={64} strokeWidth={1.25} className="mx-auto mb-6 text-s-ink" aria-hidden />

        <h1 className="font-display text-3xl md:text-[40px] font-semibold tracking-tight text-s-ink leading-[1.05] mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-s-ink-2 mb-8 leading-relaxed">
          {description}
        </p>

        {!submitted ? (
          <div className="flex gap-2 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              aria-label={t("emailPlaceholder")}
              className="min-w-0 flex-1 px-4 py-3 text-sm font-body text-s-ink placeholder:text-s-ink-2" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
            />
            <button
              onClick={handleNotify}
              aria-label={t("notify")}
              className="px-5 py-3 rounded-btn bg-s-ink text-white text-sm font-body font-semibold hover:brightness-110 active:scale-[0.97] transition-[transform,filter] duration-200 flex items-center gap-2"
            >
              <Bell size={14} />
              {t("notify")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-s-success text-sm font-medium mb-6">
            <Check size={16} />
            {t("notifySuccess")}
          </div>
        )}

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-s-ink-2 hover:text-s-ink transition-colors duration-200"
        >
          <ArrowLeft size={14} />
          {t("backHome")}
        </Link>
      </motion.div>
    </div>
  );
}
