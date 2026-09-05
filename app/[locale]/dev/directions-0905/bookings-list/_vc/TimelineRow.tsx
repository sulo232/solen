"use client";

// exists-check: net-new. No existing component renders a compact, tap-to-expand booking
// row; BookingsList.tsx's own rows are always the full BookingCard, never collapsed.
//
// Grounded-in: components-legacy/booking/BookingCard.tsx (the real card rendered INLINE on
// expand, imported directly, never redrawn: FIXED requirement "the real BookingCard ...
// with its anatomy kept").
//
// registered-component-ok: no registry entry exists for a collapsed/expandable booking
// row; the one thing this file draws by hand is the collapsed summary strip, and the
// expanded state is the real, imported BookingCard, not hand-drawn.
//
// Depicts: collapsed thumbnail, name, date, state word -> NET-NEW: grounded in fresha--bookings-list.md's Past-row anatomy and airbnb--trips.md item 6's condensed variant.
// Depicts: expanded detail -> components-legacy/booking/BookingCard.tsx, real component, imported.
// Depicts: expand/collapse motion -> NET-NEW: airbnb--motion.md's curve rule (glide grow, thud collapse) applied via a framer-motion layout animation.
import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import BookingCard from "@/components-legacy/booking/BookingCard";
import { GLIDE_EASE } from "@/app/[locale]/_components/primitives/motion";
import type { SeedBookingRow } from "./getBookingsC";
import { dateParts } from "./dateParts";
import { serviceName } from "./serviceName";
import { toBookingCardBooking } from "./toBookingCardBooking";

// Locked "thud" ease (LOCKFILE §4 / tailwind.config.js `ease-thud`), cubic-bezier(0.7,0,0.84,0),
// accelerate, exits only. Not exported from the shared motion.ts module, so the literal
// locked value is copied here rather than re-deriving a new one.
const THUD_EASE = [0.7, 0, 0.84, 0] as const;

// Neutral-tray tone for a settled/no-show row, a light grey background rather than a
// tinted-ink fill (avoids the retired ink-fill-as-active-indicator treatment entirely).
const TONE_BY_ROW_STATE: Record<SeedBookingRow["status"], { bg: string; fg: string }> = {
  confirmed: { bg: "bg-s-success/10", fg: "text-s-success" },
  pending: { bg: "bg-s-warning/10", fg: "text-s-warning" },
  cancelled: { bg: "bg-s-error/10", fg: "text-s-error" },
  completed: { bg: "bg-s-bg-sunken", fg: "text-s-ink-2" },
  no_show: { bg: "bg-s-bg-sunken", fg: "text-s-ink-2" },
};

interface TimelineRowProps {
  booking: SeedBookingRow;
  locale: string;
}

export function TimelineRow({ booking, locale }: TimelineRowProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("bookingCard");
  const { day, mon } = dateParts(booking.starts_at, locale);
  const name = serviceName(booking.service, locale);
  const salonName = booking.salon?.name || "-";
  const initial = salonName.trim().charAt(0).toUpperCase() || "?";
  const tone = TONE_BY_ROW_STATE[booking.status] ?? TONE_BY_ROW_STATE.completed;
  const wordForStatus = t(`status.${booking.status}`);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: open ? 0.28 : 0.18, ease: open ? GLIDE_EASE : THUD_EASE } }}
      className="border-b border-s-border"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="relative h-11 w-11 flex-none overflow-hidden rounded-[12px] bg-s-bg-sunken">
          {booking.salon?.cover_photo_url ? (
            <Image src={booking.salon.cover_photo_url} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[14px] font-normal text-s-ink-2" aria-hidden>
              {initial}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-normal text-s-ink">{salonName}</p>
          <p className="truncate text-[12px] font-normal text-s-ink-2">
            {day} {mon}, {name}
          </p>
        </div>

        <span className={`flex-none rounded-full px-2.5 py-1 text-[12px] font-normal ${tone.bg} ${tone.fg}`}>
          {wordForStatus}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: GLIDE_EASE }}
          className="flex-none text-s-ink-2"
        >
          <ChevronDown size={16} strokeWidth={1.9} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.28, ease: GLIDE_EASE, delay: 0.06 } }}
            exit={{ opacity: 0, transition: { duration: 0.16, ease: THUD_EASE } }}
            className="px-4 pb-4"
          >
            <BookingCard booking={toBookingCardBooking(booking)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
