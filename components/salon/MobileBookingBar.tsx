"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

interface MobileBookingBarProps {
  minPrice?: number | null;
  avgRating?: number;
  reviewCount?: number;
  onBook: () => void;
}

export default function MobileBookingBar({
  minPrice,
  avgRating,
  reviewCount,
  onBook,
}: MobileBookingBarProps) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-[55] md:hidden"
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
        {/* Left: Price + Rating */}
        <div className="flex flex-col gap-0.5">
          {minPrice != null && (
            <span className="text-[15px] font-heading font-bold text-[#222222]">
              ab {formatCurrency(minPrice)}
            </span>
          )}
          {avgRating != null && avgRating > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-[#6A6A6A]">
              <Star className="w-[10px] h-[10px] fill-[#E8624A] text-[#E8624A]" />
              <span className="font-medium">{avgRating.toFixed(1)}</span>
              {reviewCount != null && (
                <span>({reviewCount})</span>
              )}
            </span>
          )}
        </div>

        {/* Right: Book button */}
        <button
          onClick={onBook}
          className="h-[44px] px-6 rounded-[10px] bg-[#E8624A] text-white font-heading font-bold text-[14px] hover:brightness-95 active:scale-[0.97] transition-all duration-150"
          style={{ boxShadow: "0 2px 8px rgba(232,98,74,0.28)" }}
        >
          Buchen
        </button>
      </div>
    </motion.div>
  );
}
