"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
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
    <div className="rounded-card border border-s-ink/5 bg-white dark:bg-s-dm-surface p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag size={16} className="text-s-coral" />
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">Warenkorb</h3>
      </div>

      {/* Services */}
      {services.map(svc => (
        <div key={svc.id} className="space-y-2">
          <div className="flex justify-between text-sm">
            <div>
              <p className="font-medium text-s-ink dark:text-s-dm-text">
                {locale === "en" ? svc.name_en : svc.name_de}
              </p>
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{svc.duration_minutes} Min</p>
            </div>
            <span className="data-text font-medium text-s-ink dark:text-s-dm-text">
              {formatCurrency(svc.price, locale)}
            </span>
          </div>

          {/* Addons for this service */}
          {addons[svc.id]?.map(addon => (
            <label key={addon.id} className="flex items-center gap-2 text-sm cursor-pointer pl-2">
              <input
                type="checkbox"
                checked={selectedAddons.has(addon.id)}
                onChange={() => toggleAddon(addon.id)}
                className="w-3.5 h-3.5 rounded accent-s-coral"
              />
              <Plus size={10} className="text-s-ink/30" />
              <span className="text-s-ink/70 dark:text-s-dm-text/70 flex-1">{addon.name}</span>
              <span className="text-xs data-text text-s-ink/50 dark:text-s-dm-text/50">
                +{formatCurrency(addon.price, locale)} · {addon.duration_minutes} Min
              </span>
            </label>
          ))}
        </div>
      ))}

      {staffName && (
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">Stylist: {staffName}</p>
      )}

      {/* Gift card & referral code */}
      <div className="space-y-2 pt-2 border-t border-s-ink/5 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Gift size={12} className="text-s-ink/30" />
          <input
            type="text"
            value={giftCardCode}
            onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
            placeholder="Gutschein-Code"
            className="flex-1 px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-xs text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tag size={12} className="text-s-ink/30" />
          <input
            type="text"
            value={referralCode}
            onChange={e => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Empfehlungs-Code"
            className="flex-1 px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-s-bg-surface dark:bg-s-dm-bg text-xs text-s-ink dark:text-s-dm-text outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
          />
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t border-s-ink/5 dark:border-white/5">
        <div>
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">Total · {totalDuration} Min</p>
        </div>
        <span className="data-text font-bold text-lg text-s-coral">
          {formatCurrency(totalPrice, locale)}
        </span>
      </div>

      <button
        onClick={() => onCheckout({ totalPrice, totalDuration, addonIds: [...selectedAddons], giftCardCode, referralCode })}
        disabled={checking}
        className="w-full py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-semibold text-sm hover:bg-s-coral/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {checking && <Spinner size="sm" invert />}
        Bezahlen & Buchen
      </button>
    </div>
  );
}
