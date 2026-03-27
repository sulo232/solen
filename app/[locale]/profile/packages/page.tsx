"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronLeft, Package, Clock, CheckCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import type { PackagePurchase, ServicePackage } from "@/lib/types";

type PurchaseWithPackage = PackagePurchase & { service_packages: ServicePackage };

export default function MyPackagesPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Profile");
  const [purchases, setPurchases] = useState<PurchaseWithPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push(`/${locale}/auth/login`);
          return;
        }

        const { data } = await supabase
          .from("package_purchases")
          .select("*, service_packages(*)")
          .eq("user_id", session.user.id)
          .order("purchased_at", { ascending: false });

        if (data) setPurchases(data as any);
      } catch (err) {
        console.error("Error loading packages:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPackages();
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex items-center justify-center">
        <div className="grid gap-4 w-full max-w-3xl px-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-card border border-s-ink/[0.06] dark:border-white/[0.06] p-5 bg-white dark:bg-s-dm-surface animate-pulse">
              <div className="h-4 w-40 bg-s-bg-sunken dark:bg-s-dm-bg rounded mb-3" />
              <div className="h-2 w-full bg-s-bg-sunken dark:bg-s-dm-bg rounded" />
            </div>
          ))}
        </div>
      </div>
    );
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
            <Package size={20} className="text-s-coral" />
            Meine Abo-Pakete
          </h1>
        </div>

        {/* List */}
        {purchases.length === 0 ? (
          <div className="rounded-card border border-s-ink/[0.06] dark:border-white/[0.06] p-8 text-center bg-white dark:bg-s-dm-surface">
            <Package className="w-10 h-10 mx-auto mb-3 text-s-ink/15 dark:text-s-dm-text/15" />
            <p className="text-xs font-heading uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">Keine Pakete gefunden</p>
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
                <div key={p.id} className={`rounded-card border p-5 bg-white dark:bg-s-dm-surface ${
                  isUsedUp || isExpired ? "border-s-ink/[0.06] dark:border-white/[0.06] opacity-60" : "border-s-coral/20"
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-1">
                        Gekauft am {new Date(p.purchased_at).toLocaleDateString(localeFmt)}
                      </p>
                    </div>
                    {(isUsedUp || isExpired) ? (
                      <span className="text-[9px] font-heading font-bold uppercase tracking-[.08em] px-2 py-1 rounded-[6px]"
                        style={{ background: "rgba(26,18,9,.06)", color: "rgba(26,18,9,.35)" }}>
                        {isExpired ? "Abgelaufen" : "Aufgebraucht"}
                      </span>
                    ) : (
                      <span className="text-[9px] font-heading font-bold uppercase tracking-[.08em] px-2 py-1 rounded-[6px]"
                        style={{ background: "rgba(76,175,111,.12)", color: "#1f6535" }}>
                        Aktiv
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/35 dark:text-s-dm-text/35">
                        {remaining} von {total} übrig
                      </p>
                      <p className="text-[9px] font-heading text-s-ink/25 dark:text-s-dm-text/25">{used} genutzt</p>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden"
                      style={{ background: "rgba(26,18,9,.06)" }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(used / total) * 100}%`,
                          background: isUsedUp ? "rgba(26,18,9,.15)" : "#E8624A"
                        }}
                      />
                    </div>
                  </div>

                  {expireDate && !isUsedUp && (
                    <div className="mt-4 pt-3 border-t border-s-ink/5 dark:border-white/5 flex flex-wrap gap-4 text-xs">
                      <span className="flex items-center gap-1 text-s-ink/50 dark:text-s-dm-text/50">
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
