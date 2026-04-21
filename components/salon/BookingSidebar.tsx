"use client";

import { Star, Zap, Clock, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

interface BookingSidebarProps {
  salonName: string;
  minPrice?: number | null;
  avgRating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  opensAt?: string;
  closesAt?: string;
  bookingsThisWeek?: number;
  nextSlotLabel?: string;
  onBook: () => void;
}

export default function BookingSidebar({
  salonName,
  minPrice,
  avgRating,
  reviewCount,
  isOpen,
  opensAt,
  closesAt,
  bookingsThisWeek,
  nextSlotLabel,
  onBook,
}: BookingSidebarProps) {
  return (
    <div
      className="sticky top-[100px] rounded-2xl border border-s-ink/[0.08] bg-white p-6"
      style={{ boxShadow: "0 6px 16px rgba(0,0,0,0.12)" }}
    >
      {/* Price + Rating */}
      <div className="flex items-baseline justify-between mb-5">
        {minPrice != null && (
          <div>
            <span className="text-[20px] font-heading font-bold text-s-ink">
              ab {formatCurrency(minPrice)}
            </span>
          </div>
        )}
        {avgRating != null && avgRating > 0 && (
          <span className="flex items-center gap-1 text-[14px] text-s-ink">
            <Star className="w-[13px] h-[13px] fill-[#E8624A] text-[#E8624A]" />
            <span className="font-semibold">{avgRating.toFixed(1)}</span>
            {reviewCount != null && (
              <span className="text-[#6A6A6A] font-normal">
                ({reviewCount})
              </span>
            )}
          </span>
        )}
      </div>

      {/* Open/Closed status */}
      <div className="flex items-center gap-2 mb-5 text-[14px]">
        <span
          className={`w-2 h-2 rounded-full ${
            isOpen ? "bg-[#2E7D32]" : "bg-[#D32F2F]"
          }`}
        />
        {isOpen ? (
          <span className="text-[#2E7D32] font-medium">
            Jetzt geöffnet{closesAt ? ` · Schliesst um ${closesAt}` : ""}
          </span>
        ) : (
          <span className="text-[#D32F2F] font-medium">
            Geschlossen{opensAt ? ` · Öffnet um ${opensAt}` : ""}
          </span>
        )}
      </div>

      {/* Book button */}
      <button
        onClick={onBook}
        className="w-full h-12 rounded-[12px] bg-[#E8624A] text-white font-heading font-bold text-[16px] hover:brightness-95 active:scale-[0.97] transition-[transform,filter] duration-150 mb-4"
        style={{ boxShadow: "0 2px 12px rgba(232,98,74,0.32)" }}
      >
        Jetzt buchen
      </button>

      {/* Quick info badges */}
      <div className="space-y-3 pt-3 border-t border-s-ink/[0.08]">
        {nextSlotLabel && (
          <div className="flex items-center gap-2.5 text-[13px] text-[#484848]">
            <Clock className="w-4 h-4 text-[#6A6A6A] shrink-0" />
            <span>Nächster Termin: <span className="font-semibold text-[#2E7D32]">{nextSlotLabel}</span></span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-[13px] text-[#484848]">
          <Zap className="w-4 h-4 text-[#6A6A6A] shrink-0" />
          <span>Sofort buchbar — Bestätigung in Sekunden</span>
        </div>
        {bookingsThisWeek != null && bookingsThisWeek >= 3 && (
          <div className="flex items-center gap-2.5 text-[13px] text-[#484848]">
            <Users className="w-4 h-4 text-[#6A6A6A] shrink-0" />
            <span>{bookingsThisWeek}× diese Woche gebucht</span>
          </div>
        )}
      </div>
    </div>
  );
}
