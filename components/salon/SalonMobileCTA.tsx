"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import BottomSheet from "@/components/ui/BottomSheet";
import BookingCalendar from "@/components/BookingCalendar";
import type { Service } from "@/lib/types";

interface SalonMobileCTAProps {
  salonId: string;
  salonName: string;
  salonSlug: string;
  services: Service[];
  averageRating: number;
  reviewCount: number;
  isOpen: boolean;
  selectedServiceId?: string;
  selectedStaffId?: string;
}

export default function SalonMobileCTA({
  salonId,
  salonName,
  salonSlug,
  services,
  averageRating,
  reviewCount,
  isOpen,
  selectedServiceId,
  selectedStaffId,
}: SalonMobileCTAProps) {
  const t = useTranslations("salonDetail");
  const locale = useLocale();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <>
      {/* Mobile sticky booking bar */}
      <div
        onClick={() => setMobileSheetOpen(true)}
        className="fixed bottom-0 left-0 right-0 lg:hidden z-40"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex flex-col gap-0.5">
            {services.length > 0 && (
              <span className="text-[15px] font-heading font-bold text-s-ink">
                ab {formatCurrency(Math.min(...services.map((s) => s.price)), locale)}
              </span>
            )}
            {averageRating > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-[#6A6A6A]">
                <Star className="w-[10px] h-[10px] fill-[#E8624A] text-[#E8624A]" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span>({reviewCount})</span>
              </span>
            )}
          </div>
          <button
            className="h-[44px] px-6 rounded-[10px] bg-[#E8624A] text-white font-heading font-bold text-[14px] hover:brightness-95 active:scale-[0.97] transition-[transform,filter] duration-150"
            style={{ boxShadow: "0 2px 8px rgba(232,98,74,0.28)" }}
          >
            {t("bookNow")}
          </button>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <BottomSheet isOpen={mobileSheetOpen} onClose={() => setMobileSheetOpen(false)} title={t("bookAppointment")}>
        <BookingCalendar
          salonId={salonId}
          salonName={salonName}
          salonSlug={salonSlug}
          serviceId={selectedServiceId}
          staffMemberId={selectedStaffId}
        />
      </BottomSheet>
    </>
  );
}
