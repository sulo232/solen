"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag, Plus, Gift, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface CartService {
  id: string;
  name_de: string;
  name_en: string;
  price: number;
  duration_minutes: number;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface ServiceCartProps {
  services: CartService[];
  staffName?: string;
  salonId: string;
  onCheckout: (data: { totalPrice: number; totalDuration: number; addonIds: string[]; giftCardCode: string; referralCode: string }) => void;
  checking?: boolean;
}

export default function ServiceCart({ services, staffName, salonId, onCheckout, checking }: ServiceCartProps) {
  const locale = useLocale();
  const t = useTranslations("booking.cart");
  const [addons, setAddons] = useState<Record<string, Addon[]>>({});
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [giftCardCode, setGiftCardCode] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // Fetch addons per service
  useEffect(() => {
    for (const svc of services) {
      fetch(`/api/services/${svc.id}/addons`)
        .then(r => r.json())
        .then(d => {
          if (d.items) setAddons(prev => ({ ...prev, [svc.id]: d.items }));
        })
        .catch(() => {});
    }
  }, [services]);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allAddons = Object.values(addons).flat();
  const activeAddons = allAddons.filter(a => selectedAddons.has(a.id));

  const totalPrice = services.reduce((s, svc) => s + svc.price, 0) + activeAddons.reduce((s, a) => s + a.price, 0);
  const totalDuration = services.reduce((s, svc) => s + svc.duration_minutes, 0) + activeAddons.reduce((s, a) => s + a.duration_minutes, 0);

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] bg-white dark:bg-s-dm-surface p-5 space-y-4"
      style={{ boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
      {/* P6 — Header eyebrow */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/40 dark:text-s-dm-text/40">{t("title")}</p>
        <ShoppingBag size={13} className="text-s-ink/25 dark:text-s-dm-text/25" />
      </div>

      {/* Services */}
      {services.map(svc => (
        <div key={svc.id} className="space-y-2">
          <div className="flex justify-between text-sm">
            <div>
              <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
                {locale === "en" ? svc.name_en : svc.name_de}
              </p>
              <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/35 dark:text-s-dm-text/35">{svc.duration_minutes} {t("minutes")}</p>
            </div>
            <span className="data-text font-bold text-base text-s-ink dark:text-s-dm-text">
              {formatCurrency(svc.price, locale)}
            </span>
          </div>

          {/* P7 — Addon checkboxes (custom coral checkbox) */}
          {addons[svc.id]?.map(addon => (
            <label key={addon.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-[10px] cursor-pointer hover:bg-s-bg-base dark:hover:bg-s-dm-bg transition-colors"
              style={{ border: selectedAddons.has(addon.id) ? "1px solid rgba(232,98,74,.25)" : "1px solid rgba(26,18,9,.06)" }}>
              {/* Custom checkbox */}
              <div className={`w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-all ${
                selectedAddons.has(addon.id)
                  ? "bg-s-coral border-s-coral"
                  : "border-s-ink/15 dark:border-white/15 bg-white dark:bg-s-dm-surface"
              }`}>
                {selectedAddons.has(addon.id) && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" checked={selectedAddons.has(addon.id)} onChange={() => toggleAddon(addon.id)} className="sr-only" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{addon.name}</p>
                <p className="text-[9px] font-heading uppercase tracking-[.08em] text-s-ink/35 dark:text-s-dm-text/35">{addon.duration_minutes} {t("minutes")}</p>
              </div>
              <span className="text-xs font-heading font-bold text-s-ink/70 dark:text-s-dm-text/70">+{formatCurrency(addon.price, locale)}</span>
            </label>
          ))}
        </div>
      ))}

      {staffName && (
        <div className="flex items-center gap-1.5 text-xs text-s-ink/50 dark:text-s-dm-text/50">
          <span className="w-4 h-4 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg flex items-center justify-center text-[10px]">✂</span>
          {staffName}
        </div>
      )}

      {/* P8 — Gift card & referral code inputs */}
      <div className="space-y-2 pt-3 border-t border-s-ink/[0.06] dark:border-white/[0.06]">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/35 dark:text-s-dm-text/35">{t("discountCodes")}</p>
        <div className="relative">
          <Gift size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30" />
          <input
            type="text"
            value={giftCardCode}
            onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
            placeholder={t("giftCardPlaceholder")}
            className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-s-bg-base dark:bg-s-dm-bg text-xs font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/35 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
          />
        </div>
        <div className="relative">
          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30" />
          <input
            type="text"
            value={referralCode}
            onChange={e => setReferralCode(e.target.value.toUpperCase())}
            placeholder={t("referralPlaceholder")}
            className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-s-bg-base dark:bg-s-dm-bg text-xs font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/35 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
          />
        </div>
      </div>

      {/* P9 — Total row */}
      <div className="flex justify-between items-center pt-3 border-t border-s-ink/[0.06] dark:border-white/[0.06]">
        <div>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/35 dark:text-s-dm-text/35">{t("total")}</p>
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("totalMinutes", { count: totalDuration })}</p>
        </div>
        <div className="text-right">
          <span className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">{formatCurrency(totalPrice, locale)}</span>
          <p className="text-[9px] text-s-ink/35 dark:text-s-dm-text/35 mt-0.5">{t("inclVat")}</p>
        </div>
      </div>

      {/* P9 — CTA */}
      <button
        onClick={() => onCheckout({ totalPrice, totalDuration, addonIds: [...selectedAddons], giftCardCode, referralCode })}
        disabled={checking}
        className="w-full py-4 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.06em] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.30), 0 6px 20px rgba(232,98,74,.20)" }}
      >
        {checking && <Spinner size="sm" invert />}
        {t("payAndBook")}
      </button>
    </div>
  );
}
