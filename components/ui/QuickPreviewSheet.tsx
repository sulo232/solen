"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

interface PreviewSalon {
  name: string;
  slug: string;
  cover_photo_url: string | null;
  average_rating: number;
  review_count: number;
  opening_hours?: Record<string, { open: string; close: string } | null>;
  services?: { name_de: string; name_en: string; price: number; duration_minutes: number }[];
}

interface QuickPreviewSheetProps {
  salon: PreviewSalon | null;
  open: boolean;
  onClose: () => void;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function QuickPreviewSheet({ salon, open, onClose }: QuickPreviewSheetProps) {
  const locale = useLocale();
  const t = useTranslations("ui.preview") as any;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!salon) return null;

  const topServices = (salon.services ?? []).slice(0, 3);
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todayHours = salon.opening_hours?.[todayKey];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Mobile: Bottom sheet ── */}
          <div className="fixed inset-0 z-60 md:hidden">
            <motion.div
              className="absolute inset-0 bg-s-ink/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="absolute bottom-0 inset-x-0 bg-white dark:bg-s-dm-surface rounded-t-3xl shadow-warm-xl max-h-[80vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-sm z-10">
                <div className="w-10 h-1 rounded-full bg-s-sand dark:bg-white/20" />
              </div>
              <SheetContent salon={salon} locale={locale} topServices={topServices} todayHours={todayHours} onClose={onClose} t={t} />
            </motion.div>
          </div>

          {/* ── Desktop: Side panel ── */}
          <div className="fixed inset-0 z-60 hidden md:flex justify-end">
            <motion.div
              className="absolute inset-0 bg-s-ink/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="relative w-[420px] max-w-full h-full bg-white dark:bg-s-dm-surface shadow-warm-lg overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-s-bg-sunken dark:bg-white/10 text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-sand transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SheetContent salon={salon} locale={locale} topServices={topServices} todayHours={todayHours} onClose={onClose} t={t} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function SheetContent({
  salon,
  locale,
  topServices,
  todayHours,
  onClose,
  t,
}: {
  salon: PreviewSalon;
  locale: string;
  topServices: { name_de: string; name_en: string; price: number; duration_minutes: number }[];
  todayHours: { open: string; close: string } | null | undefined;
  onClose: () => void;
  t: any;
}) {
  return (
    <div className="px-5 pb-8">
      {/* Cover photo */}
      {salon.cover_photo_url && (
        <div className="relative w-full aspect-[16/9] rounded-[12px] overflow-hidden bg-s-bg-sunken mb-4">
          <Image src={salon.cover_photo_url} alt={salon.name} fill className="object-cover" />
        </div>
      )}

      {/* Name + rating */}
      <h3 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">{salon.name}</h3>
      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-s-coral text-s-coral" />
          <span className="data-text font-semibold text-sm text-s-ink dark:text-s-dm-text">{salon.average_rating.toFixed(1)}</span>
          <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">({salon.review_count})</span>
        </div>
      </div>

      {/* Today's hours */}
      {todayHours && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-s-ink/50 dark:text-s-dm-text/50">
          <Clock className="w-3 h-3" />
          <span>{t("today")}: {todayHours.open}–{todayHours.close}</span>
        </div>
      )}

      {/* Top services */}
      {topServices.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide mb-2">{t("topServices")}</p>
          <div className="divide-y divide-s-ink/5 dark:divide-white/5">
            {topServices.map((svc, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">
                    {locale === "de" ? svc.name_de : svc.name_en}
                  </p>
                  <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{svc.duration_minutes} {t("minutes")}</p>
                </div>
                <span className="data-text font-semibold text-sm text-s-ink dark:text-s-dm-text">{formatCurrency(svc.price, locale)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <Link
          href={`/${locale}/salon/${salon.slug}`}
          onClick={onClose}
          className="flex-1 py-3 rounded-pill border border-s-ink/10 dark:border-white/10 text-sm font-medium text-s-ink dark:text-s-dm-text text-center hover:border-s-coral/50 transition-colors"
        >
          {t("showMore")}
        </Link>
        <Link
          href={`/${locale}/salon/${salon.slug}?book=true`}
          onClick={onClose}
          className="flex-1 py-3 rounded-pill active:scale-[0.98] bg-s-coral text-white text-sm font-medium text-center shadow-coral-glow hover:brightness-[1.06] transition-[transform,filter] duration-150"
        >
          {t("book")}
        </Link>
      </div>
    </div>
  );
}
