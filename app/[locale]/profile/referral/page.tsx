"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Copy, Check, Users, Gift, Share2, ChevronRight } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

export default function ReferralPage() {
  const locale = useLocale();
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
    ? `${window.location.origin}/de?ref=${data?.referral_code ?? ""}`
    : "";

  const copyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Hey! Buche deinen nächsten Termin auf Solen und erhalte CHF 10 Guthaben mit meinem Code: ${data?.referral_code}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-s-bg-surface dark:bg-s-ink flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-s-bg-surface dark:bg-s-ink flex items-center justify-center">
        <p className="text-s-ink/60 dark:text-s-dm-text/60 text-sm">Bitte melde dich an, um deine Empfehlungen zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-ink py-8 px-4">
      {/* Breadcrumb */}
      <div className="max-w-lg mx-auto mb-4 text-xs text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-1">
        <Link href={`/${locale}/profile`} className="hover:text-s-coral transition-colors">Profil</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-s-ink/60 dark:text-s-dm-text/60">Freunde einladen</span>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-s-coral/10 to-s-coral/5 dark:from-s-coral/20 dark:to-s-coral/5 rounded-[12px] border border-s-coral/20 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-s-coral/15 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-7 h-7 text-s-coral" />
          </div>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-1">Freunde einladen</h1>
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 max-w-xs mx-auto">
            Teile deinen Code und erhalte CHF 10 Guthaben — dein Freund bekommt auch CHF 10!
          </p>
        </div>

        {/* Referral code card */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[12px] border border-s-ink/5 dark:border-white/10 shadow-warm-md p-5">
          <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">Dein Empfehlungscode</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-s-bg-surface dark:bg-white/5 border border-s-ink/10 dark:border-white/10 rounded-btn px-4 py-3 data-text font-bold text-lg text-s-ink dark:text-s-dm-text tracking-wider text-center">
              {data.referral_code}
            </div>
            <button
              onClick={copyCode}
              className="p-3 rounded-btn bg-s-coral text-white hover:brightness-[1.06] transition-colors"
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
            className="flex items-center justify-center gap-2 py-3 rounded-btn bg-s-bg-sunken dark:bg-white/10 text-s-ink dark:text-s-dm-text text-sm font-medium hover:bg-s-sand dark:hover:bg-white/15 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Link kopieren
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[12px] border border-s-ink/5 dark:border-white/10 shadow-warm-md p-5">
          <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-3">Deine Statistiken</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-s-bg-surface dark:bg-white/5 rounded-btn">
              <Users className="w-5 h-5 text-s-coral mx-auto mb-1" />
              <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{data.friends_invited}</p>
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">Freunde eingeladen</p>
            </div>
            <div className="text-center p-3 bg-s-bg-surface dark:bg-white/5 rounded-btn">
              <Gift className="w-5 h-5 text-s-coral mx-auto mb-1" />
              <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{formatCurrency(data.total_earned, locale)}</p>
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">Verdient</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[12px] border border-s-ink/5 dark:border-white/10 shadow-warm-md p-5">
          <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-3">So funktioniert&apos;s</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Teile deinen Empfehlungscode mit Freunden" },
              { step: "2", text: "Dein Freund registriert sich und bucht einen Termin" },
              { step: "3", text: "Ihr beide erhaltet CHF 10 Guthaben!" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-s-coral/10 text-s-coral text-xs font-bold flex items-center justify-center shrink-0">
                  {item.step}
                </span>
                <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
