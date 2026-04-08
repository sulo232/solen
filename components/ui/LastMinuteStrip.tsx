"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
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
      className="relative overflow-hidden"
      style={{ background: "#E8624A" }}
      aria-label={t("badge")}
    >
      {/* Ambient glow top-right */}
      <div
        className="pointer-events-none absolute -top-10 right-0 w-[300px] h-[200px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,.12) 0%, transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="px-5 md:px-6 lg:px-10 xl:px-20 py-4 flex items-center gap-6">
        {/* Left: label + title */}
        <div className="flex-shrink-0 hidden sm:block">
          <p
            className="font-heading font-bold uppercase tracking-[.1em] mb-0.5"
            style={{ fontSize: "10px", color: "#FAD4CC" }}
          >
            {t("badge")}
          </p>
          <p className="font-heading font-bold text-white leading-tight" style={{ fontSize: "18px" }}>
            {t("title") || "Heute noch frei"}
          </p>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 flex-shrink-0" style={{ background: "rgba(255,255,255,.2)" }} aria-hidden="true" />

        {/* Scrollable slot cards */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide flex-1 py-1">
          {slots.slice(0, 6).map((slot) => {
            const discount = getDiscountPercent(slot.original_price, slot.discounted_price);
            const catKey = (slot.service?.category ?? "coiffeur") as string;
            const categoryLabel = tNav(catKey) ?? catKey;

            return (
              <Link
                key={slot.id}
                href={`/${locale}/salon/${slot.salon.slug}?service=${slot.service_id}`}
                className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] whitespace-nowrap active:scale-[0.97] transition-[transform,background] duration-150"
                style={{
                  background: "rgba(255,255,255,.15)",
                  border: "1px solid rgba(255,255,255,.22)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.22)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.15)"; }}
                aria-label={`${slot.salon.name} — ${formatSlotTime(slot.starts_at, locale)}`}
              >
                <div>
                  <p className="font-heading font-semibold text-white leading-tight" style={{ fontSize: "13px" }}>
                    {slot.salon.name}
                  </p>
                  <p className="font-body leading-tight mt-0.5" style={{ fontSize: "11px", color: "#FAD4CC" }}>
                    {formatSlotTime(slot.starts_at, locale)} · {categoryLabel}
                  </p>
                </div>
                {discount && (
                  <span
                    className="font-heading font-bold rounded-pill px-2 py-0.5 flex-shrink-0"
                    style={{ fontSize: "12px", background: "rgba(255,255,255,.18)", color: "#FFFFFF" }}
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
          className="flex-shrink-0 font-heading font-semibold transition-opacity duration-150 whitespace-nowrap hover:opacity-100"
          style={{ fontSize: "12px", color: "rgba(255,255,255,.7)" }}
          aria-label={t("viewAll")}
        >
          {t("viewAll")} →
        </Link>
      </div>
    </div>
  );
}
