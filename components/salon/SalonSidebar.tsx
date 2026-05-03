"use client";

import Link from "next/link";
import { Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

/**
 * SalonSidebar — Q53 (locked 2026-05-02) sticky sidebar booking entry (desktop).
 *
 * V5 anti-pattern killed: this used to render BookingCalendar INLINE
 * (toggled via `calendarOpen` prop) inside the sidebar. Q53 explicitly
 * bans inline calendar/sheet/modal — booking MUST navigate to the
 * full-page wizard at /salon/[slug]/booking. Back button restores salon
 * detail + scroll position via Next.js scroll restoration.
 *
 * `calendarOpen` + `onOpenCalendar` props kept for caller backward compat
 * but no longer alter render — the CTA is now always a Link to the wizard.
 *
 * `selectedServiceId` and `selectedStaffId` forwarded as query params so
 * the wizard can pre-fill formData if user picked a service+ row first.
 */
interface NextSlot {
  id: string;
  starts_at: string;
  ends_at: string;
  staff_id: string;
  staff_name: string;
  service_name: string;
}

interface SalonSidebarProps {
  salonId: string;
  salonName: string;
  salonSlug: string;
  services: Service[];
  averageRating: number;
  reviewCount: number;
  isOpen: boolean;
  /** @deprecated Q53 — kept for caller backward compat; no longer toggles inline calendar */
  calendarOpen?: boolean;
  /** @deprecated Q53 — kept for caller backward compat; navigation handled by Link */
  onOpenCalendar?: () => void;
  selectedServiceId?: string;
  selectedStaffId?: string;
  nextSlot?: NextSlot | null;
  onQuickBook?: (slot: NextSlot) => void;
}

export default function SalonSidebar({
  salonName,
  salonSlug,
  services,
  averageRating,
  reviewCount,
  isOpen,
  selectedServiceId,
  selectedStaffId,
  nextSlot,
  onQuickBook,
}: SalonSidebarProps) {
  const t = useTranslations("salonDetail") as any;
  const locale = useLocale();
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";

  // Forward pre-selected service/staff to the wizard via query params
  const qs = new URLSearchParams();
  if (selectedServiceId) qs.set("service", selectedServiceId);
  if (selectedStaffId) qs.set("staff", selectedStaffId);
  const bookingHref = `/${locale}/salon/${salonSlug}/booking${qs.toString() ? `?${qs.toString()}` : ""}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const minPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : null;

  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-[100px]">
        <div
          className="rounded-[16px] overflow-hidden p-6 bg-white border border-s-ink/[0.08]"
          style={{ boxShadow: "0 6px 16px rgba(26,18,9,0.10)" }}
        >
          <div className="flex flex-col gap-4">
            {/* Price + Rating row */}
            <div className="flex items-baseline justify-between">
              {minPrice !== null && (
                <span className="font-heading text-[24px] uppercase text-s-ink leading-[0.95] tabular-nums" style={{ letterSpacing: "0.01em" }}>
                  ab {formatPrice(minPrice, localeCode)}
                </span>
              )}
              {averageRating > 0 && (
                <span className="flex items-center gap-1 font-body text-[13px] text-s-ink/65">
                  <Star className="w-[12px] h-[12px] fill-s-amber text-s-amber" aria-hidden />
                  <span className="font-semibold tabular-nums">{averageRating.toFixed(1)}</span>
                  <span className="text-s-ink/40 tabular-nums">({reviewCount})</span>
                </span>
              )}
            </div>

            {/* Open/closed */}
            <div className="flex items-center gap-2 text-[13px]">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isOpen ? "#16A34A" : "#D32F2F" }}
                aria-hidden
              />
              <span className="font-body font-medium" style={{ color: isOpen ? "#16A34A" : "#D32F2F" }}>
                {isOpen ? t("open") : t("closed")}
              </span>
            </div>

            {/* Q53 primary CTA — Link to /salon/[slug]/booking, NOT inline calendar */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={bookingHref}
                aria-label={t("bookAppointment", { salonName })}
                className="block w-full h-12 rounded-full bg-s-coral text-white font-body font-bold text-[14px] uppercase tracking-[.04em] hover:brightness-[1.06] transition-[transform,filter] duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
              >
                {t("bookNow")}
              </Link>
            </motion.div>

            {/* Next Available button — quick-book if slot exists */}
            {nextSlot && (
              <button
                type="button"
                onClick={() => onQuickBook?.(nextSlot)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] border border-s-ink/10 font-body text-[13px] text-s-ink hover:border-s-coral/40 hover:text-s-coral-text transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
              >
                <Zap size={14} className="text-s-coral" aria-hidden />
                {t("nextAvailable")}: {formatDate(nextSlot.starts_at)}
              </button>
            )}

            {/* Quick info */}
            <div className="space-y-2 pt-3 border-t border-s-ink/[0.08]">
              <div className="flex items-center gap-2 font-body text-[12px] text-s-ink/55">
                <Zap className="w-4 h-4" aria-hidden />
                <span>{t("instantBooking")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
