"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Package, Gift, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";

interface PackageData {
  id: string;
  name: string;
  total_sessions: number;
  bonus_sessions: number;
  price: number;
  services: { name_de: string; name_en: string; category: string } | null;
}

export default function SalonPackagesPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonName, setSalonName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First get salon ID from slug
    fetch(`/api/salons?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        const salon = d.data ?? d;
        if (salon?.id) {
          setSalonId(salon.id);
          setSalonName(salon.name ?? "");
          return fetch(`/api/packages?salon_id=${salon.id}`);
        }
        return null;
      })
      .then((r) => r?.json())
      .then((d) => {
        if (d?.items) setPackages(d.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const serviceName = (pkg: PackageData) =>
    locale === "en" ? pkg.services?.name_en : pkg.services?.name_de;

  const labels = {
    de: {
      title: "Pakete",
      sessions: "Sitzungen",
      bonus: "Bonus",
      perSession: "Pro Sitzung",
      buy: "Paket kaufen",
      empty: "Keine Pakete verfügbar",
      back: "Zurück zum Salon",
    },
    en: {
      title: "Packages",
      sessions: "sessions",
      bonus: "bonus",
      perSession: "Per session",
      buy: "Buy Package",
      empty: "No packages available",
      back: "Back to salon",
    },
  };
  const l = labels[locale as "de" | "en"] ?? labels.de;

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/${locale}/salon/${slug}`} className="text-sm text-s-coral flex items-center gap-1 mb-6">
          <ArrowLeft size={14} /> {l.back}
        </Link>

        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-1">
          {l.title}
        </h1>
        {salonName && <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">{salonName}</p>}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <Package size={32} className="mx-auto mb-3 text-s-ink/20 dark:text-s-dm-text/20" />
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{l.empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg, i) => {
              const totalSessions = pkg.total_sessions + (pkg.bonus_sessions ?? 0);
              const perSession = Math.round(pkg.price / totalSessions);

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-s-dm-surface rounded-[16px] shadow-card p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-bold text-s-ink dark:text-s-dm-text">{pkg.name}</h3>
                      <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{serviceName(pkg)}</p>
                    </div>
                    <span className="data-text text-xl font-bold text-s-coral">
                      {formatCurrency(pkg.price, locale)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="text-s-ink/60 dark:text-s-dm-text/60">
                      {pkg.total_sessions} {l.sessions}
                    </span>
                    {pkg.bonus_sessions > 0 && (
                      <span className="text-s-coral flex items-center gap-1">
                        <Gift size={12} /> +{pkg.bonus_sessions} {l.bonus}
                      </span>
                    )}
                    <span className="text-s-ink/40 dark:text-s-dm-text/40 ml-auto">
                      {l.perSession}: {formatCurrency(perSession, locale)}
                    </span>
                  </div>

                  <button className="w-full py-2.5 rounded-btn bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em]">
                    {l.buy}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
