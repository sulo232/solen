"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Copy, Check, Users, Gift, Share2, LogIn } from "lucide-react";
import { Skeleton } from "@/app/[locale]/_components/primitives";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { formatCurrency } from "@/lib/format-currency";

export default function ReferralPage() {
  const locale = useLocale();
  const t = useTranslations("profileReferral");
  const [data, setData] = useState<{
    referral_code: string;
    friends_invited: number;
    total_earned: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("[Referral] failed to load referral data:", err))
      .finally(() => setLoading(false));
  }, []);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}?ref=${data?.referral_code ?? ""}`
    : "";

  const copyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    // The formal register governs how SOLEN addresses the customer. Here the customer is the
    // speaker, sending this to their own friend, so Solen is not the one talking and "Sie" would
    // put the customer in a register nobody uses with a friend. Named exception to COPY_LAW section
    // 1, converted back on 2026-08-10 after the hardcoded-German sweep formalised it by mistake.
    const text = t("shareText", { code: data?.referral_code ?? "", url: shareUrl });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    // mockup-ok: MOCKUP_QUEUE.md item 6, shaped Skeleton (hero + code row + stats,
    // matches the real populated layout below) replaces the ad-hoc centered Spinner.
    return (
      <div className="min-h-screen bg-s-bg-surface py-8 px-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton height={168} rounded={12} />
          <Skeleton height={64} rounded={12} />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton height={44} rounded={12} />
            <Skeleton height={44} rounded={12} />
          </div>
          <Skeleton height={118} rounded={12} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-s-bg-surface flex items-center justify-center px-4">
        <EmptyState
          icon={LogIn}
          title={t("loginRequired")}
          message={t("loginMessage")}
          action={
            <Link
              href={`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/referral`)}`}
              className="inline-flex px-6 py-3 rounded-btn bg-s-ink text-white font-semibold text-sm hover:brightness-[1.06] transition-colors"
            >
              {t("login")}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-surface py-8 px-4">
      {/* Title + back live in the global header (deepPageTitle); the old
          "Profil › Freunde einladen" breadcrumb duplicated both, so it's gone. */}
      <div className="max-w-lg mx-auto space-y-4">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-s-ink/10 to-s-ink/5 rounded-[12px] border border-s-border p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-s-ink/15 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-7 h-7 text-s-ink-2" />
          </div>
          {/* Title sits beside the global back tile (Header deepPageTitle). */}
          <p className="text-sm text-s-ink-2 max-w-xs mx-auto">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Referral code card */}
        <div className="bg-white/80 rounded-[12px] border border-s-ink/5 shadow-elevation-1 p-5">
          <p className="text-xs font-medium text-s-ink-2 mb-2">{t("codeLabel")}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-s-bg-surface border border-s-border rounded-btn px-4 py-3 data-text font-bold text-lg text-s-ink tracking-wider text-center">
              {data.referral_code}
            </div>
            <button
              onClick={copyCode}
              aria-label={t("copyCode")}
              className="p-3 rounded-btn bg-s-ink text-white hover:brightness-[1.06] transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 rounded-btn bg-[#25D366] text-white text-sm font-medium hover:bg-[#25D366]/90 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={copyCode}
            /* V3-D341 (W13): broken `hover:bg-s-sand:bg-white/15` (invalid token + double-colon) → `hover:bg-s-ink/10` (subtle hover per §6). */
            className="flex items-center justify-center gap-2 py-3 rounded-btn bg-s-bg-sunken text-s-ink text-sm font-medium hover:bg-s-ink/10 transition-colors"
          >
            <Copy className="w-4 h-4" />
            {t("copyLink")}
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white/80 rounded-[12px] border border-s-ink/5 shadow-elevation-1 p-5">
          <h2 className="font-heading text-base text-s-ink mb-3">{t("statsTitle")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-s-bg-surface rounded-btn">
              <Users className="w-5 h-5 text-s-ink-2 mx-auto mb-1" />
              <p className="data-text font-bold text-2xl text-s-ink">{data.friends_invited}</p>
              <p className="text-xs text-s-ink-2">{t("friendsInvited")}</p>
            </div>
            <div className="text-center p-3 bg-s-bg-surface rounded-btn">
              <Gift className="w-5 h-5 text-s-ink-2 mx-auto mb-1" />
              <p className="data-text font-bold text-2xl text-s-ink">{formatCurrency(data.total_earned, locale)}</p>
              <p className="text-xs text-s-ink-2">{t("earned")}</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white/80 rounded-[12px] border border-s-ink/5 shadow-elevation-1 p-5">
          <h2 className="font-heading text-base text-s-ink mb-3">{t("howItWorks")}</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: t("step1") },
              { step: "2", text: t("step2") },
              { step: "3", text: t("step3") },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-s-ink/10 text-s-ink text-xs font-bold flex items-center justify-center shrink-0">
                  {item.step}
                </span>
                <p className="text-sm text-s-ink/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
