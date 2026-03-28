"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronLeft, Gift, Clock, Copy, Check } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import type { GiftCard } from "@/lib/types";

export default function MyGiftCardsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Profile") as any;
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadCards = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session?.user) {
          router.push(`/${locale}/auth/login`);
          return;
        }

        const { data } = await supabase
          .from("gift_cards")
          .select("*")
          .or(`purchaser_id.eq.${session.user.id},recipient_email.eq.${session.user.email}`)
          .order("created_at", { ascending: false });

        if (!cancelled && data) setCards(data as any);
      } catch (err) {
        console.error("Error loading gift cards:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCards();
    return () => { cancelled = true; };
  }, [locale, router]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/${locale}/profile`} className="p-2 -ml-2 rounded-full hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} className="text-s-ink/60 dark:text-s-dm-text/60" />
          </Link>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text flex items-center gap-2">
            <Gift size={20} className="text-s-coral" />
            Meine Geschenkkarten
          </h1>
        </div>

        {/* List */}
        {cards.length === 0 ? (
          <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/10 p-8 text-center text-s-ink/40 dark:text-s-dm-text/40">
            <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Keine Geschenkkarten gefunden</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => {
              const isUsedUp = card.remaining_amount <= 0 && !card.is_active;
              const isExpired = card.expires_at && new Date(card.expires_at).getTime() < Date.now();
              const localeFmt = locale === "de" ? "de-CH" : locale;
              const isInactive = isUsedUp || isExpired || !card.is_active;

              return (
                <div key={card.id} className={`bg-white dark:bg-s-dm-surface rounded-[12px] border ${isInactive ? "border-s-ink/5 dark:border-white/5 opacity-60" : "border-s-coral/30 shadow-warm-sm bg-gradient-to-br from-white to-s-coral/5 dark:from-s-dm-surface dark:to-s-coral/5"} p-5 relative overflow-hidden`}>
                  {/* Decorative corner */}
                  {!isInactive && (
                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-s-coral/10 rounded-full blur-xl pointer-events-none" />
                  )}

                  <div className="flex justify-between items-start mb-6 align-top">
                    <div>
                      <p className="text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-widest mb-1">GIFT CARD</p>
                      <h3 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text data-text">
                        {formatCurrency(card.remaining_amount, locale)}
                      </h3>
                    </div>
                    {isInactive ? (
                      <span className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 px-2.5 py-1 bg-s-ink/5 dark:bg-white/5 rounded-btn">
                        {isExpired ? "Abgelaufen" : "Eingelöst"}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-s-coral px-2.5 py-1 bg-s-coral/10 rounded-btn">
                        Aktiv
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1">Online Code</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-s-bg-surface dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/10 rounded-btn font-mono text-sm tracking-widest text-s-ink dark:text-s-dm-text">
                        {card.code}
                      </div>
                      <button
                        onClick={() => copyCode(card.code)}
                        className="p-2.5 rounded-btn bg-s-ink/5 dark:bg-white/5 hover:bg-s-ink/10 dark:hover:bg-white/10 transition-colors"
                        title="Code kopieren"
                      >
                        {copiedCode === card.code ? <Check size={16} className="text-s-success" /> : <Copy size={16} className="text-s-ink/60 dark:text-s-dm-text/60" />}
                      </button>
                    </div>
                  </div>

                  {(card.expires_at || card.recipient_name) && (
                    <div className="pt-3 border-t border-s-ink/5 dark:border-white/5 space-y-1.5 pt-3 mt-auto">
                      {card.recipient_name && (
                        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
                          Für: <span className="font-medium text-s-ink dark:text-s-dm-text">{card.recipient_name}</span>
                        </p>
                      )}
                      {card.expires_at && (
                        <p className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50">
                          <Clock size={12} />
                          Gültig bis {new Date(card.expires_at).toLocaleDateString(localeFmt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
