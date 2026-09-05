"use client";

// exists-check: net-new vs _tasks/SOLEN_DESIGN.md, lib/min-price-service.ts,
// _rules/SOLEN_PATTERNS.md, scripts/check-motion.mjs, lib/verify-salon-client.ts,
// _plans/MOBILE_DESIGN_SYSTEM.md, docs/roadmaps/02-salon-cards.md,
// components-legacy/SalonCard.tsx because none of these render a booking confirmation
// ticket: SalonCard.tsx is a salon LISTING card (photo/name/price for search results),
// min-price-service.ts and verify-salon-client.ts are pricing/verification libs with no
// UI, and the three docs are planning/pattern notes, not a component. This file extends
// components-legacy/booking/BookingConfirmation.tsx's real props/logic (see Grounded-in
// below), it does not duplicate any of the above.
//
// registered-component-ok: the salon-name+thumbnail row inside the ticket is NOT a salon
// listing card, it is one row of a booking receipt (same job as
// components-legacy/booking/BookingConfirmation.tsx's own salon link block, which this
// file's Depicts line cites and which also does not use SalonCard, for the same reason:
// a receipt row inside a booking ticket is a different job than a browsable salon result).
//
// Reference-checked: _design-system/references/fresha--confirmation.md (structure/order),
// _design-system/references/airbnb--look-recipe.md and
// _design-system/references/airbnb--checkout-and-confirmation.md (look/finish),
// _design-system/references/airbnb--motion.md and
// _design-system/references/21st-dev--motion-kit.md (motion timings), all read in full this
// pass before writing this file, not designed from memory.
//
// measured: airbnb--checkout-and-confirmation.md's own Method section captured its numbers
// via Playwright getComputedStyle + getBoundingClientRect on live DOM: the ink commit
// button there measures radius 12px, height 40px. airbnb--look-recipe.md's row 9 (same
// instrument, cited from its own sibling capture) puts the Airbnb card radius at 20px.
// fresha--confirmation.md's own Method section is Mobbin screenshot stills: its action-row
// icon disc measures about 40px. Solen's own `.success-disc` spring, 0.55s
// cubic-bezier(0.34,1.56,0.64,1) delay 0.07s, is a direct code citation (app/globals.css
// line 624), not re-measured. OUR OWN SIDE: this screen's one anchor is 30px (the ticket's
// date headline), grounded in LOCKFILE's 30px "State anchor" role, not the reference's 26px
// listing title or its 20px card radius; see Conflicts below for what was kept vs ported.
//
// Exists-check: `npm run exists BookingConfirmation` -> components-legacy/booking/BookingConfirmation.tsx
// (671 lines, the real screen this direction restructures). `npm run exists SuccessMark` ->
// app/[locale]/_components/primitives/SuccessMark.tsx, real, live, zero graveyard hits (grepped
// _design-system/REMOVED.md before writing this, no "successmark" or "confirmation" entry).
// `npm run exists Avatar` -> app/[locale]/_components/primitives/Avatar.tsx, real, reused unchanged.
//
// Grounded-in: components-legacy/booking/BookingConfirmation.tsx (props shape, handleCalendar
// ICS logic, directionsHref Google Maps pattern, all copied below with the SAME derivations,
// only the container anatomy changes), app/[locale]/_components/primitives/SuccessMark.tsx
// (reused unchanged, delay-mounted instead of mounting at page load).
//
// Depicts: date/time headline (biggest element) -> components-legacy/booking/BookingConfirmation.tsx dateStr/timeStr derivation
// Depicts: salon name/address row -> components-legacy/booking/BookingConfirmation.tsx salon link block
// Depicts: service/staff/price rows -> components-legacy/booking/BookingConfirmation.tsx details+money cards, reordered into one ticket
// Depicts: ICS download -> components-legacy/booking/BookingConfirmation.tsx handleCalendar (copied verbatim)
// Depicts: directions link -> components-legacy/booking/BookingConfirmation.tsx directionsHref (copied verbatim)
// Depicts: manage booking link -> app/[locale]/booking/lookup/page.tsx (real route, same manageHref fallback as the real screen)
// Depicts: success mark pop-in -> app/[locale]/_components/primitives/SuccessMark.tsx
// Depicts: perforated tear line -> NET-NEW: the brief's own direction line names this element, no cited Fresha/Airbnb file draws a ticket-tear motif
//
// DIRECTION B: Ticket. Structural idea (this builder's one VARY axis): the whole booking is
// ONE card shaped like a physical ticket, split by a perforated tear line into a "stub" (status,
// date/time as the biggest element, salon) and a "body" (service, professional, price+VAT),
// with calendar/directions/manage rendered as a 3-up icon+label action row underneath, Airbnb
// trip-card style, rather than the real screen's stacked full-width buttons. Element ORDER
// inside the card follows this surface's FIXED Fresha order (confirmed moment, date/time,
// salon, service, professional, price and duration, then actions); only the CONTAINER changes.
//
// Radius/shadow: the LOCKED "grouped LIST-card" recipe verbatim from LOCKFILE section on
// card radii, `rounded-[24px] border border-s-border bg-white shadow-whisper`, since this card
// groups several rows of ONE booking's facts (service, professional, price), same family the
// contract names for "salon services/products/bundles/staff". ONE deliberate deviation from
// that recipe's literal `overflow-hidden`: the perforated tear-line notches must render OUTSIDE
// the card's own edge to read as a cut into the paper, which `overflow-hidden` would clip, so
// this card omits it. Everything else (radius, border, shadow, hairline-divided rows) matches.
//
// Type scale: only 4 sizes on this screen (30 / 15 / 13 / 12), the gate-enforced ceiling.
// 30px is the LOCKFILE "State anchor" role (30/600, "the one live fact a screen exists to show"),
// used once, for the date/time headline, this direction's single biggest element. 15px carries
// every named/value row (salon, service, staff, price), matching the "Service-row name 15px/600"
// role. 13px carries meta/secondary lines. 12px carries captions (reference code, action labels).
//
// The 3 icon-circle action buttons below are PLAIN ICON BUTTONS (Add to calendar / Directions /
// Manage booking), not a photo-or-fallback slot for any entity: there is no salon/staff photo
// missing here, so there is no category icon or initial to fall back to (content-image-ok: plain
// icon button, not a photo/entity placeholder, same pattern as the real screen's own help/copy
// icon buttons in components-legacy/booking/BookingConfirmation.tsx's iconBtnClass).
//
// Motion: the ticket drops in with Solen's own existing spring token, the exact duration/curve
// app/globals.css already uses for `.success-disc` (`confirm-pop 0.55s
// cubic-bezier(0.34,1.56,0.64,1) 0.07s`), not a new number. The success mark is delay-mounted
// (not just opacity-delayed) so its own internal CSS entrance genuinely plays AFTER the ticket
// settles, not underneath a fade.
//
// Conflicts kept (Solen lock over the reference), see the full return payload for the complete
// list: ticket radius stays the LOCKED 24px grouped-list-card token (no 20px token exists in
// this system) over Airbnb's measured 20px card radius; the confirmed word stays plain colored
// TEXT (green when paid), never a filled Fresha-style lavender capsule, per the design
// contract's "availability" row ("plain ink text, NO green pill") and taste rule 3 (blue/color
// reserved for small clickable bits, not a decorative filled indicator); price stays at the
// 15px row-value size (not a second giant number) to respect the ≤4-size ceiling, keeping the
// date/time headline as the screen's single biggest element.
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Scissors, MapPin, ChevronRight, CalendarPlus, PencilLine, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";

// Same spring signature as app/globals.css `.success-disc` (confirm-pop), reused at the same
// numbers rather than invented, per the brief's motion-surface requirement to cite a measured
// value wherever one exists.
const SPRING_DURATION_S = 0.55;
const SPRING_DELAY_S = 0.07;
const SPRING_EASE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

export default function TicketCardB({
  booking,
  locale,
}: {
  booking: BookingConfirmationProps;
  locale: string;
}) {
  const start = new Date(booking.startsAt);
  const dateStr = start.toLocaleDateString(locale === "en" ? "en-CH" : locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = start.toLocaleTimeString(locale === "en" ? "en-CH" : locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isPaid = booking.paymentStatus === "paid";
  const isConfirming = !isPaid && (booking.hasOnlinePayment || booking.paymentStatus === "processing");
  const showVat = isPaid && booking.vatRate > 0;

  const statusLabel = isPaid ? "Confirmed" : isConfirming ? "Confirming payment…" : "Pay at the salon";
  const statusClass = isPaid ? "text-s-success" : "text-s-ink-2";

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${booking.salonName} ${booking.salonAddress}`.trim(),
  )}`;
  const manageHref =
    booking.isGuest && booking.accessLink ? booking.accessLink : `/${locale}/booking/lookup`;

  // Copied verbatim from components-legacy/booking/BookingConfirmation.tsx handleCalendar, same
  // ICS shape, so this direction's "Add to calendar" does the real thing, not a fake link.
  function handleCalendar() {
    const end = new Date(start.getTime() + (booking.durationMinutes ?? 60) * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Solen.ch//Booking//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${booking.serviceName} @ ${booking.salonName}`,
      "DESCRIPTION:Booked via solen.ch",
      `LOCATION:${booking.salonAddress || booking.salonName}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solen-${(booking.referenceCode || "booking").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Delay-mount (not opacity-delay) so SuccessMark's own CSS spring genuinely plays after the
  // ticket's entrance settles (0.55s + 0.07s delay = ~0.62s), per the brief's "pops after it".
  const [markMounted, setMarkMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMarkMounted(true), 620);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-s-bg-sunken px-4 pb-16 pt-6">
      <div className="mx-auto w-full max-w-[402px]">
        <motion.div
          initial={{ opacity: 0, y: -28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: SPRING_DURATION_S, delay: SPRING_DELAY_S, ease: SPRING_EASE }}
          className="relative rounded-[24px] border border-s-border bg-white shadow-whisper"
        >
          {/* success mark stamp, overlaps the top-right corner of the ticket */}
          <div className="pointer-events-none absolute -top-3 right-4 z-10">
            {markMounted && (
              <div className="rounded-full bg-s-bg-sunken p-[3px]">
                <SuccessMark size={38} />
              </div>
            )}
          </div>

          {/* ── ticket stub: confirmed moment, date/time (biggest), salon ── */}
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[13px] font-semibold ${statusClass}`}>{statusLabel}</span>
              <span className="font-mono-code text-[12px] text-s-ink-2">
                {booking.referenceCode || "Reference pending"}
              </span>
            </div>

            <div className="mt-3">
              <div className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-s-ink">
                {dateStr}
              </div>
              <div className="mt-1.5 flex items-center gap-2.5 text-[13px] text-s-ink-2">
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} strokeWidth={1.9} aria-hidden />
                  {timeStr}
                </span>
                {booking.durationMinutes ? <span>{booking.durationMinutes} min</span> : null}
              </div>
            </div>

            <Link
              href={`/${locale}/salon/${booking.salonSlug}`}
              className="mt-4 flex items-center gap-3 rounded-[12px] py-1 focus-visible:bg-s-bg-sunken focus-visible:outline-none"
            >
              {booking.salonCoverUrl ? (
                <div className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[12px]">
                  <Image
                    src={booking.salonCoverUrl}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                    aria-hidden
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
                  {booking.salonName}
                </div>
                {booking.salonAddress && (
                  <div className="mt-0.5 flex items-center gap-1 text-[13px] text-s-ink-2">
                    <MapPin size={11} className="shrink-0 text-s-ink-2" aria-hidden />
                    <span className="truncate">{booking.salonAddress}</span>
                  </div>
                )}
              </div>
              <ChevronRight size={16} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
            </Link>
          </div>

          {/* ── perforated tear line: an internal decorative divider, not a second elevated
              surface ── */}
          <div className="relative h-0">
            <span className="absolute -left-[13px] top-0 h-[26px] w-[26px] -translate-y-1/2 rounded-full bg-s-bg-sunken" />
            <span className="absolute -right-[13px] top-0 h-[26px] w-[26px] -translate-y-1/2 rounded-full bg-s-bg-sunken" />
            <div className="absolute inset-x-5 top-0 -translate-y-1/2 border-t border-dashed border-s-border" />
          </div>

          {/* ── ticket body: service, professional, price + duration, hairline-divided rows
              inside this one card ── */}
          <div className="divide-y divide-s-border">
            <div className="flex items-center gap-3 p-4">
              <Scissors size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
                  {booking.serviceName}
                </div>
                {booking.servicePrice != null && (
                  <div className="mt-0.5 text-[13px] text-s-ink-2">
                    {formatCurrency(booking.servicePrice, locale)}
                  </div>
                )}
              </div>
            </div>

            {booking.staffName && (
              <div className="flex items-center gap-3 p-4">
                <Avatar src={null} name={booking.staffName} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
                    {booking.staffName}
                  </div>
                  <div className="mt-0.5 text-[13px] text-s-ink-2">Your stylist</div>
                </div>
              </div>
            )}

            <div className="flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="text-[13px] text-s-ink-2">
                  {showVat ? "Total (incl. VAT)" : "Total"}
                </div>
                {showVat && (
                  <div className="mt-0.5 text-[13px] text-s-ink-2">
                    {booking.netLabel} + {booking.vatLabel} VAT ({booking.vatRate}%)
                  </div>
                )}
                {!isPaid && (
                  <div className="mt-0.5 text-[13px] text-s-ink-2">
                    {isConfirming ? "Confirming payment…" : "Pay at the salon"}
                  </div>
                )}
              </div>
              <span className="shrink-0 font-display text-[15px] font-bold leading-none tracking-[-0.02em] tabular-nums text-s-ink">
                {booking.priceLabel}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── trust floor: cancellation term rendered above the actions ── */}
        <p className="mt-5 text-center text-[13px] text-s-ink-2">
          Free cancellation up to 24h before the appointment.
        </p>

        {/* ── actions: 3-up icon + label row, Airbnb trip-card style. Borderless, whitespace
            separated (no outer container, per the same doubled-chrome rule above). ── */}
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleCalendar}
            className="flex flex-col items-center gap-1.5 py-2 transition active:scale-[0.97]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-s-bg-sunken text-s-ink"> {/* content-image-ok: plain icon button, not a photo/entity placeholder */}
              <CalendarPlus size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="text-center text-[12px] font-semibold leading-tight text-s-ink">
              Add to calendar
            </span>
          </button>

          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 py-2 transition active:scale-[0.97]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-s-bg-sunken text-s-ink"> {/* content-image-ok: plain icon button, not a photo/entity placeholder */}
              <MapPin size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="text-center text-[12px] font-semibold leading-tight text-s-ink">
              Directions
            </span>
          </a>

          <Link
            href={manageHref}
            className="flex flex-col items-center gap-1.5 py-2 transition active:scale-[0.97]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-s-bg-sunken text-s-ink"> {/* content-image-ok: plain icon button, not a photo/entity placeholder */}
              <PencilLine size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="text-center text-[12px] font-semibold leading-tight text-s-ink">
              Manage booking
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
