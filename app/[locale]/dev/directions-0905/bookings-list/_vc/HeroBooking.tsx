"use client";

// exists-check: net-new vs BookingCard.tsx (the real card this hero enlarges the anatomy
// of: focal date block, salon/service/place/time, price, actions) and
// ../_shared/DirectionFrame.tsx (unrelated, the switcher shell). Not a copy of BookingCard
// itself: this is a bigger, hero-scaled treatment (larger photo, larger date block, a row
// of three actions instead of one button + an overflow menu), which is the whole point of
// this direction, so it is a new file, not an edit of the locked BookingCard.
//
// Grounded-in: components-legacy/booking/BookingCard.tsx (the real, locked booking row
// this hero enlarges: focal date block, salon/service/place, price, actions kept). This
// direction drops BookingCard's own uppercase-tracked dow label for a plain sentence-case
// one instead (owner's repeated no-caps rule outranks matching that one detail literally).
//
// registered-component-ok: _design-system/COMPONENT_REGISTRY.md has no entry for a booking
// row/card at all (BookingCard.tsx lives in components-legacy, outside the registry) and
// no "hero card" primitive exists for any surface. This direction's own brief is to show a
// bespoke hero-scaled booking card (bigger photo, bigger date block, a 3-action row) for
// owner review, so there is nothing registered to compose here; the anatomy it keeps
// (focal date block, salon/service/place, price) is BookingCard.tsx's, cited above.
//
// emphasis-ok: hierarchy on this card runs on SIZE (30/18/14/12), not weight, per the
// FLATNESS_DIAGNOSIS recommendation to stop leaning on universal bold. Only ONE element on
// the whole card is bold: the hero date-day number, the single display anchor. Salon name
// is set apart by SIZE (18px) alone, matching the emphasis-budget's own worked fix ("keep
// weight on the ONE anchor per section"); every other string (captions, service, address,
// price, the three action labels) stays font-normal, so the screen carries exactly 2
// distinct weights (700 on one element, 400 everywhere else), inside the design contract's
// ≤2-weight ceiling.
//
// Depicts: focal date block, salon name, service line, place, price -> BookingCard.tsx anatomy, kept.
// Depicts: entrance motion -> app/[locale]/_components/primitives/motion.ts's useEnterMotion (THE ENTER RECIPE).
// Depicts: three-action row (Directions / Reschedule / Cancel) -> NET-NEW: grounded in fresha--bookings-list.md's "Get directions" pair and airbnb--trips.md item 5's "Get directions" button; Reschedule/Cancel are Solen's existing actions (BookingsList.tsx handleReschedule/handleCancel), rendered here as static, never wired to the real POST endpoints (mockup, never writes to the database).
//
// Repair 2026-09-05: critic flagged the hero card carrying BOTH a hairline border
// AND shadow-elevation-1 (design contract shadow/depth row: a card carrying elevation
// drops its border, never both). This direction is not LOOK-FULL and named no such
// conflict, so it was a plain violation. Fix: removed `border border-s-border` from
// the card wrapper below, kept shadow-elevation-1 alone; the edge-visibility floor is
// still met on white by the shadow. Nothing else on the card changed.
import Image from "next/image";
import { MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useEnterMotion } from "@/app/[locale]/_components/primitives/motion";
import { formatCurrency } from "@/lib/format-currency";
import type { SeedBookingRow } from "./getBookingsC";
import { dateParts, localeCodeFor } from "./dateParts";
import { serviceName } from "./serviceName";

interface HeroBookingProps {
  booking: SeedBookingRow;
  locale: string;
  nextUpLabel: string;
  withLabel: string;
  directionsLabel: string;
  rescheduleLabel: string;
  cancelLabel: string;
}

export function HeroBooking({
  booking,
  locale,
  nextUpLabel,
  withLabel,
  directionsLabel,
  rescheduleLabel,
  cancelLabel,
}: HeroBookingProps) {
  const enter = useEnterMotion();
  const { dow, day, mon, time } = dateParts(booking.starts_at, locale);
  const name = serviceName(booking.service, locale);
  const salonName = booking.salon?.name || "-";
  const initial = salonName.trim().charAt(0).toUpperCase() || "?";
  const mapsHref = booking.salon?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salonName} ${booking.salon.address}`)}`
    : null;

  return (
    <motion.div
      {...enter}
      className="mx-4 mt-4 overflow-hidden rounded-card bg-[--raised] shadow-elevation-1"
    >
      {/* mockup-ok: real entity photo slot (booking.salon.cover_photo_url, a live seeded
          salon row); fallback is the spec'd anatomy (sunken bg + the salon's own initial),
          never a bare grey box. */}
      <div className="relative aspect-[4/3] w-full bg-s-bg-sunken">
        {booking.salon?.cover_photo_url ? (
          <Image
            src={booking.salon.cover_photo_url}
            alt={`Photo of ${salonName}`}
            fill
            sizes="390px"
            className="object-cover"
            priority
          />
        ) : (
          <span
            className="absolute inset-0 grid place-items-center font-display text-[40px] font-normal text-s-ink-2"
            aria-hidden
          >
            {initial}
          </span>
        )}
        <div className="absolute left-3 top-3 flex w-[56px] flex-col items-center rounded-[14px] bg-white/95 py-2 text-center shadow-elevation-1">
          <span className="text-[12px] font-normal text-s-ink-2">{dow}</span>
          <span className="font-heading text-[30px] font-bold leading-[1.05] text-s-ink">{day}</span>
          <span className="text-[12px] font-normal text-s-ink-2">{mon}</span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[12px] font-normal text-s-ink-2">
          {nextUpLabel}, {time}
        </p>
        <h2 className="mt-1 truncate font-heading text-[18px] font-normal tracking-[-0.01em] text-s-ink">
          {salonName}
        </h2>
        <p className="mt-0.5 truncate text-[14px] font-normal text-s-ink">{name}</p>
        {booking.staff?.name && (
          <p className="mt-0.5 truncate text-[14px] font-normal text-s-ink-2">
            {withLabel} {booking.staff.name}
          </p>
        )}
        {booking.salon?.address && (
          <p className="mt-1 flex items-center gap-1.5 text-[14px] font-normal text-s-ink-2">
            <MapPin size={14} className="flex-none text-s-ink-2" />
            <span className="truncate">{booking.salon.address}</span>
          </p>
        )}

        <div className="mt-3 border-t border-s-border pt-3 text-[14px] font-normal tabular-nums text-s-ink">
          {formatCurrency(booking.price_paid, localeCodeFor(locale))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center rounded-[16px] border border-s-border bg-white text-center text-[14px] font-normal leading-tight text-s-ink transition-transform active:scale-[0.98]"
            >
              {directionsLabel}
            </a>
          ) : (
            <span
              aria-disabled
              className="flex h-11 items-center justify-center rounded-[16px] border border-s-border bg-s-bg-sunken text-center text-[14px] font-normal leading-tight text-s-ink-2 opacity-50"
            >
              {directionsLabel}
            </span>
          )}
          <button
            type="button"
            className="flex h-11 items-center justify-center rounded-[16px] border border-s-border bg-white text-center text-[14px] font-normal leading-tight text-s-ink transition-transform active:scale-[0.98]"
          >
            {rescheduleLabel}
          </button>
          <button
            type="button"
            className="flex h-11 items-center justify-center rounded-[16px] border border-s-border bg-white text-center text-[14px] font-normal leading-tight text-s-error transition-transform active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
