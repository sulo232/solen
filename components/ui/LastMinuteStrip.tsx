"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Clock } from "lucide-react";
import { isToday, isTomorrow, format } from "date-fns";
import { de, fr, it, type Locale } from "date-fns/locale";
import type { LastMinuteSlot } from "@/lib/types";

interface LastMinuteStripProps {
  slots: LastMinuteSlot[];
}

const DATE_LOCALES: Record<string, Locale> = { de, fr, it };

function getDiscountPercent(original: number | undefined, discounted: number): string | null {
  if (!original || original <= discounted) return null;
  return `-${Math.round((1 - discounted / original) * 100)}%`;
}

function formatSlotTime(startsAt: string, locale: string): string {
  const date = new Date(startsAt);
  const time = format(date, "HH:mm");
  const dateLoc = DATE_LOCALES[locale];
  if (isToday(date)) return `Heute ${time}`;
  if (isTomorrow(date)) return `Morgen ${time}`;
  return format(date, "EEE d. MMM", { locale: dateLoc }) + ` ${time}`;
}

export default function LastMinuteStrip({ slots }: LastMinuteStripProps) {
  const t = useTranslations("home.lastMinute") as any;
  const tNav = useTranslations("navigation") as any;
  const locale = useLocale();

  if (!slots || slots.length === 0) return null;

  return (
    <div
      className="flex items-center gap-3 px-5 md:px-6 lg:px-10 xl:px-20 py-3"
      style={{
        background: "linear-gradient(90deg, rgba(232,98,74,.05) 0%, rgba(242,193,68,.03) 100%)",
        borderTop: "1px solid rgba(232,98,74,.1)",
        borderBottom: "1px solid rgba(232,98,74,.1)",
      }}
      aria-label={t("badge")}
    >
      {/* Badge */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-s-coral text-white font-heading font-bold uppercase tracking-[.04em]"
        style={{ fontSize: "11px" }}
        aria-hidden="true"
      >
        <Clock size={10} aria-hidden="true" />
        {t("badge")}
      </div>

      {/* Scrollable slots */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 pb-0.5">
        {slots.slice(0, 8).map((slot) => {
          const discount = getDiscountPercent(slot.original_price, slot.discounted_price);
          const catKey = (slot.service?.category ?? "coiffeur") as string;
          const categoryLabel = tNav(catKey) ?? catKey;

          return (
            <Link
              key={slot.id}
              href={`/${locale}/salon/${slot.salon.slug}?service=${slot.service_id}`}
              className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-[12px]
                bg-white dark:bg-s-dm-surface
                border border-s-ink/[0.08] dark:border-white/[0.08]
                hover:border-s-coral/30 hover:shadow-[0_2px_8px_rgba(232,98,74,.1)]
                transition-[border-color,box-shadow] duration-150
                whitespace-nowrap"
              aria-label={`${slot.salon.name} — ${formatSlotTime(slot.starts_at, locale)}`}
            >
              <div>
                <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text leading-tight" style={{ fontSize: "13px" }}>
                  {slot.salon.name}
                </p>
                <p className="font-body text-s-ink/40 dark:text-s-dm-text/40 leading-tight mt-0.5" style={{ fontSize: "11px" }}>
                  {formatSlotTime(slot.starts_at, locale)} · {categoryLabel}
                </p>
              </div>
              {discount && (
                <span
                  className="font-heading font-bold text-s-coral rounded-pill px-2 py-0.5 flex-shrink-0"
                  style={{ fontSize: "12px", background: "rgba(232,98,74,.08)" }}
                  aria-label={discount}
                >
                  {discount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* View all */}
      <Link
        href={`/${locale}/last-minute`}
        className="flex-shrink-0 font-heading font-semibold text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors duration-150 whitespace-nowrap"
        style={{ fontSize: "12px" }}
        aria-label={t("viewAll")}
      >
        {t("viewAll")}
      </Link>
    </div>
  );
}
