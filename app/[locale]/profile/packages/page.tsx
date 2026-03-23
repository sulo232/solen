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
          .order("created_at", { ascending: false });

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
            <Package size={20} className="text-s-coral" />
            Meine Abo-Pakete
          </h1>
        </div>

        {/* List */}
        {purchases.length === 0 ? (
          <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/10 p-8 text-center text-s-ink/40 dark:text-s-dm-text/40">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Bisher keine Abo-Pakete gekauft</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {purchases.map((p) => {
              const pkg = p.service_packages;
              const used = p.sessions_used;
              const total = pkg.session_count;
              const remaining = total - used;
              const isUsedUp = remaining <= 0;
              const localeFmt = locale === "de" ? "de-CH" : locale;
              const expireDate = p.expires_at ? new Date(p.expires_at) : null;
              const isExpired = expireDate && expireDate.getTime() < Date.now();

              return (
                <div key={p.id} className={`bg-white dark:bg-s-dm-surface rounded-card border ${isUsedUp || isExpired ? "border-s-ink/5 dark:border-white/5 opacity-60" : "border-s-coral/20"} p-5`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-base text-s-ink dark:text-s-dm-text">
                        {locale === "de" ? pkg.name_de : pkg.name_en}
                      </h3>
                      <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-1">
                        Gekauft am {new Date(p.created_at).toLocaleDateString(localeFmt)}
                      </p>
                    </div>
                    {(isUsedUp || isExpired) ? (
                      <span className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 px-2 py-1 bg-s-ink/5 dark:bg-white/5 rounded-button">
                        {isExpired ? "Abgelaufen" : "Aufgebraucht"}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-s-coral px-2.5 py-1 bg-s-coral/10 rounded-button">
                        Aktiv
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-s-ink/60 dark:text-s-dm-text/60">{remaining} von {total} übrig</span>
                      </div>
                      <div className="h-2 w-full bg-s-bg-surface dark:bg-s-dm-bg rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isUsedUp ? 'bg-s-ink/20' : 'bg-s-coral'} transition-all`} 
                          style={{ width: `${(used / total) * 100}%` }}
                        />
                      </div>
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
