"use client";

import { Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import BookingCalendar from "@/components/BookingCalendar";
import type { Service } from "@/lib/types";

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
}: SalonSidebarProps) {
  const t = useTranslations("salonDetail");
  const locale = useLocale();

  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-[100px]">
        <div
          className="rounded-2xl overflow-hidden p-6 bg-white border border-[#EBEBEB]"
          style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.12)" }}
        >
          {!calendarOpen ? (
            <div className="flex flex-col gap-4">
              {/* Price + Rating row */}
              <div className="flex items-baseline justify-between">
                {services.length > 0 && (
                  <span className="text-[20px] font-heading font-bold text-[#222222]">
                    ab {formatCurrency(Math.min(...services.map((s) => s.price)), locale)}
                  </span>
                )}
                {averageRating > 0 && (
                  <span className="flex items-center gap-1 text-[14px] text-[#222222]">
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
                className="w-full h-12 rounded-[12px] bg-[#E8624A] text-white font-heading font-bold text-[16px] hover:brightness-95 transition-all duration-150"
                style={{ boxShadow: "0 2px 12px rgba(232,98,74,0.32)" }}
              >
                {t("bookNow")}
              </motion.button>
              {/* Quick info */}
              <div className="space-y-2 pt-3 border-t border-[#EBEBEB]">
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
