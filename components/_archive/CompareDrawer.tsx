"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Clock, Trophy, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type { Salon } from "@/lib/types";

interface CompareSalon extends Salon {
  min_price?: number;
  distance_km?: number;
}

interface CompareDrawerProps {
  salons: CompareSalon[];
  open: boolean;
  onClose: () => void;
}

/** Determine which salon column gets the "Empfehlung" ribbon */
function getBestValueIndex(salons: CompareSalon[]): number {
  if (salons.length === 0) return -1;
  let bestIdx = 0;
  let bestScore = -1;
  salons.forEach((s, i) => {
    const rating = s.average_rating ?? 0;
    const reviews = s.review_count ?? 0;
    const price = s.min_price ?? 999;
    const score = (rating * Math.log2(reviews + 1)) / (price || 1);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });
  return bestIdx;
}

function getTodayHours(salon: CompareSalon): string {
  const now = new Date();
  const key = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];
  const hours = salon.opening_hours?.[key] as { open: string; close: string } | null | undefined;
  return hours ? `${hours.open}–${hours.close}` : "Geschlossen";
}

export default function CompareDrawer({ salons, open, onClose }: CompareDrawerProps) {
  const locale = useLocale();
  const bestIdx = useMemo(() => getBestValueIndex(salons), [salons]);

  const rows: { label: string; Icon: React.ElementType; render: (s: CompareSalon, i: number) => React.ReactNode }[] = [
    {
      label: "Bewertung",
      Icon: Star,
      render: (s) => (
        <div className="flex items-center gap-1">
          <Star size={12} className="fill-s-coral text-s-coral" />
          <span className="data-text font-semibold text-s-ink">{s.average_rating?.toFixed(1) ?? "–"}</span>
        </div>
      ),
    },
    {
      label: "Anzahl Bewertungen",
      Icon: MessageCircle,
      render: (s) => <span className="data-text text-s-ink">{s.review_count ?? 0}</span>,
    },
    {
      label: "Günstigster Service",
      Icon: Trophy,
      render: (s) => (
        <span className="data-text font-semibold text-s-ink">
          {s.min_price ? formatCurrency(s.min_price, locale) : "–"}
        </span>
      ),
    },
    {
      label: "Öffnungszeiten",
      Icon: Clock,
      render: (s) => <span className="text-s-ink/70 text-xs">{getTodayHours(s)}</span>,
    },
    {
      label: "Entfernung",
      Icon: MapPin,
      render: (s) => (
        <span className="data-text text-s-ink">
          {s.distance_km ? `${s.distance_km.toFixed(1)} km` : "–"}
        </span>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-s-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "15%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed inset-x-0 bottom-0 z-60 bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-xl rounded-t-2xl shadow-surface h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-s-ink/5 dark:border-white/5">
              <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">Salons vergleichen</h2>
              <button onClick={onClose} className="p-1.5 text-s-ink/40 hover:text-s-ink dark:text-s-dm-text/40 dark:hover:text-s-dm-text">
                <X size={20} />
              </button>
            </div>

            {/* Table content */}
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(85vh-60px)]">
              <table className="w-full min-w-[500px]">
                {/* Salon name header row */}
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-sm p-3 w-36" />
                    {salons.map((salon, i) => (
                      <th key={salon.id} className="p-3 text-center relative min-w-[140px]">
                        {i === bestIdx && salons.length > 1 && (
                          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-b-lg bg-s-coral text-white text-[10px] font-bold whitespace-nowrap">
                            Empfehlung
                          </div>
                        )}
                        <div className={`mt-3 ${i === bestIdx && salons.length > 1 ? "ring-2 ring-s-coral/20 rounded-card p-2" : "p-2"}`}>
                          <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text truncate">{salon.name}</h3>
                          <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 capitalize mt-0.5 truncate">{salon.quartier}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-t border-s-ink/5 dark:border-white/5">
                      <td className="sticky left-0 bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <row.Icon size={13} className="text-s-coral shrink-0" />
                          <span className="text-xs text-s-ink/50 dark:text-s-dm-text/50 whitespace-nowrap">{row.label}</span>
                        </div>
                      </td>
                      {salons.map((salon, i) => (
                        <td key={salon.id} className={`px-4 py-3 text-center text-sm ${i === bestIdx && salons.length > 1 ? "bg-s-coral/5" : ""}`}>
                          {row.render(salon, i)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* CTA row */}
                  <tr className="border-t border-s-ink/5 dark:border-white/5">
                    <td className="sticky left-0 bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-sm px-4 py-4" />
                    {salons.map((salon) => (
                      <td key={salon.id} className="px-4 py-4 text-center">
                        <a
                          href={`/${locale}/salon/${salon.slug}`}
                          className="inline-block px-4 py-2 rounded-btn active:scale-[0.98] bg-s-coral text-white text-xs font-semibold hover:brightness-[1.06] transition-all"
                        >
                          Jetzt buchen
                        </a>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
