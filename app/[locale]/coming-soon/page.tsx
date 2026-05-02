"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, ArrowLeft, Bell } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const FEATURE_MAP: Record<string, { icon: string; color: string }> = {
  vouchers: { icon: "🎁", color: "rgba(232,98,74,.12)" },
  loyalty: { icon: "⭐", color: "rgba(212,135,10,.12)" },
  referral: { icon: "💌", color: "rgba(123,166,136,.15)" },
  behandlungen: { icon: "💆", color: "rgba(107,163,200,.15)" },
};

export default function ComingSoonPage() {
  const locale = useLocale();
  const t = useTranslations("comingSoon");
  const params = useSearchParams();
  const feature = params.get("feature") ?? "default";
  const meta = FEATURE_MAP[feature] ?? { icon: "✨", color: "rgba(232,98,74,.08)" };
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const descriptionMap: Record<string, string> = {
    vouchers: t("description_vouchers"),
    loyalty: t("description_loyalty"),
    referral: t("description_referral"),
    behandlungen: t("description_behandlungen"),
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
    <div className="min-h-screen bg-[--base] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div
          className="w-20 h-20 rounded-[24px] mx-auto mb-6 flex items-center justify-center text-4xl"
          style={{ background: meta.color }}
        >
          {meta.icon}
        </div>

        <h1 className="font-heading font-bold text-2xl text-s-ink mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-s-ink/50 mb-8 leading-relaxed">
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
              className="flex-1 px-4 py-3 rounded-btn bg-[--raised] border border-s-ink/10 text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral/40 focus:ring-2 focus:ring-s-coral/10"
            />
            <button
              onClick={handleNotify}
              aria-label={t("notify")}
              className="px-5 py-3 rounded-btn bg-s-coral text-white text-sm font-heading font-bold hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 flex items-center gap-2"
            >
              <Bell size={14} />
              {t("notify")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-s-sage text-sm font-medium mb-6">
            <Sparkles size={16} />
            {t("notifySuccess")}
          </div>
        )}

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-s-ink/40 hover:text-s-coral transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          {t("backHome")}
        </Link>
      </motion.div>
    </div>
  );
}
