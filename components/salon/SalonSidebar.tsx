"use client";

import { Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import BookingCalendar from "@/components/BookingCalendar";
import type { Service } from "@/lib/types";

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
  calendarOpen: boolean;
  onOpenCalendar: () => void;
  selectedServiceId?: string;
  selectedStaffId?: string;
  nextSlot?: NextSlot | null;
  onQuickBook?: (slot: NextSlot) => void;
}

export default function SalonSidebar({
  salonId,
  salonName,
  salonSlug,
  services,
  averageRating,
  reviewCount,
  isOpen,
  calendarOpen,
  onOpenCalendar,
  selectedServiceId,
  selectedStaffId,
  nextSlot,
  onQuickBook,
}: SalonSidebarProps) {
  const t = useTranslations("salonDetail");
  const locale = useLocale();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-[100px]">
        <div
          className="rounded-2xl overflow-hidden p-6 bg-white border border-s-ink/[0.08]"
          style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.12)" }}
        >
          {!calendarOpen ? (
            <div className="flex flex-col gap-4">
              {/* Price + Rating row */}
              <div className="flex items-baseline justify-between">
                {services.length > 0 && (
                  <span className="text-[20px] font-heading font-bold text-s-ink">
                    ab {formatCurrency(Math.min(...services.map((s) => s.price)), locale)}
                  </span>
                )}
                {averageRating > 0 && (
                  <span className="flex items-center gap-1 text-[14px] text-s-ink">
                    <Star className="w-[13px] h-[13px] fill-[#E8624A] text-[#E8624A]" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-[#6A6A6A]">({reviewCount})</span>
                  </span>
                )}
              </div>
              {/* Open/closed */}
              <div className="flex items-center gap-2 text-[14px]">
                <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-[#2E7D32]" : "bg-[#D32F2F]"}`} />
                <span className={isOpen ? "text-[#2E7D32] font-medium" : "text-[#D32F2F] font-medium"}>
                  {isOpen ? t("open") : t("closed")}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenCalendar}
                className="w-full h-12 rounded-[12px] bg-[#E8624A] text-white font-heading font-bold text-[16px] hover:brightness-95 transition-[transform,filter] duration-150"
                style={{ boxShadow: "0 2px 12px rgba(232,98,74,0.32)" }}
              >
                {t("bookNow")}
              </motion.button>

              {/* Next Available button */}
              {nextSlot && (
                <button
                  onClick={() => onQuickBook?.(nextSlot)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] border border-s-ink/10 text-sm font-body text-s-ink hover:border-[#E8624A]/40 hover:text-[#E8624A] transition-colors duration-150"
                >
                  <Zap size={14} className="text-[#E8624A]" />
                  {t("nextAvailable")}: {formatDate(nextSlot.starts_at)}
                </button>
              )}

              {/* Quick info */}
              <div className="space-y-2 pt-3 border-t border-s-ink/[0.08]">
                <div className="flex items-center gap-2 text-[13px] text-[#484848]">
                  <Zap className="w-4 h-4 text-[#6A6A6A]" />
                  <span>{t("instantBooking")}</span>
                </div>
              </div>
            </div>
          ) : (
            <BookingCalendar
              salonId={salonId}
              salonName={salonName}
              salonSlug={salonSlug}
              serviceId={selectedServiceId}
              staffMemberId={selectedStaffId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
