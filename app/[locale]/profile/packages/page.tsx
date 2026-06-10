"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Package, Clock, CheckCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components-legacy/ui/Spinner";
import type { PackagePurchase, ServicePackage } from "@/lib/types";

type PurchaseWithPackage = PackagePurchase & { service_packages: ServicePackage };

export default function MyPackagesPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Profile") as any;
  const [purchases, setPurchases] = useState<PurchaseWithPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadPackages = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session?.user) {
          router.push(`/${locale}/auth/login`);
          return;
        }

        const { data } = await supabase
          .from("package_purchases")
          .select("*, service_packages(*)")
          .eq("user_id", session.user.id)
          .order("purchased_at", { ascending: false });

        if (!cancelled && data) setPurchases(data as any);
      } catch (err) {
        console.error("Error loading packages:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPackages();
    return () => { cancelled = true; };
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="grid gap-4 w-full max-w-3xl px-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-[12px] border border-s-border p-5 bg-white animate-pulse">
              <div className="h-4 w-40 bg-s-bg-sunken rounded mb-3" />
              <div className="h-2 w-full bg-s-bg-sunken rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Header — V3-D288: fix corrupted dark-mode hover + swap retired s-coral icon → ink */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-heading text-xl text-s-ink flex items-center gap-2">
            <Package size={20} className="text-s-ink" />
            Meine Abo-Pakete
          </h1>
        </div>

        {/* List */}
        {purchases.length === 0 ? (
          <div className="rounded-[12px] border border-s-border p-8 text-center bg-white">
            <Package className="w-10 h-10 mx-auto mb-3 text-s-ink/15" />
            <p className="text-xs font-heading uppercase tracking-[.10em] text-s-ink/30">Keine Pakete gefunden</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {purchases.map((p) => {
              const pkg = p.service_packages;
              const used = p.sessions_used;
              const total = pkg.total_sessions + pkg.bonus_sessions;
              const remaining = total - used;
              const isUsedUp = remaining <= 0;
              const localeFmt = locale === "de" ? "de-CH" : locale;
              const expireDate = p.expires_at ? new Date(p.expires_at) : null;
              const isExpired = expireDate && expireDate.getTime() < Date.now();

              return (
                // V3-D288: card border — retired s-coral → s-border; status pills + progress bar moved to tokens (LOCKFILE §1 universal-color: active=success, inactive=ink-2)
                <div key={p.id} className={`rounded-[12px] border p-5 bg-white ${
                  isUsedUp || isExpired ? "border-s-border opacity-60" : "border-s-border"
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-heading text-base text-s-ink">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-s-ink-2 mt-1">
                        Gekauft am {new Date(p.purchased_at).toLocaleDateString(localeFmt)}
                      </p>
                    </div>
                    {(isUsedUp || isExpired) ? (
                      // V3-D288: was hardcoded rgba(26,18,9,.06)/(.35) → sunken bg + ink-2 text
                      <span className="text-[12px] font-heading uppercase tracking-[.08em] px-2 py-1 rounded-[6px] bg-s-bg-sunken text-s-ink-2">
                        {isExpired ? "Abgelaufen" : "Aufgebraucht"}
                      </span>
                    ) : (
                      // V3-D288: was hardcoded green rgba/#15803D → s-success token (LOCKFILE §1 universal-color active=green)
                      <span className="text-[12px] font-heading uppercase tracking-[.08em] px-2 py-1 rounded-[6px] bg-s-success/10 text-s-success">
                        Aktiv
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-[12px] font-heading uppercase tracking-[.10em] text-s-ink/35">
                        {remaining} von {total} übrig
                      </p>
                      <p className="text-[12px] font-heading text-s-ink/25">{used} genutzt</p>
                    </div>
                    {/* V3-D288: progress bar — was hardcoded rgba(26,18,9,.06) track + #C05038 (legacy coral) fill → sunken + ink */}
                    <div className="h-2 w-full rounded-full overflow-hidden bg-s-bg-sunken">
                      <div className={`h-full rounded-full transition-[width] duration-500 ${isUsedUp ? "bg-s-ink-disabled" : "bg-s-ink"}`}
                        style={{ width: `${(used / total) * 100}%` }}
                      />
                    </div>
                  </div>

                  {expireDate && !isUsedUp && (
                    <div className="mt-4 pt-3 border-t border-s-border flex flex-wrap gap-4 text-xs">
                      <span className="flex items-center gap-1 text-s-ink-2">
                        <Clock size={12} />
                        Gültig bis {expireDate.toLocaleDateString(localeFmt)}
                      </span>
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
