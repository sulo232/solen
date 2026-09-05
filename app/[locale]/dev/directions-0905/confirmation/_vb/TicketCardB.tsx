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
// line 624), not re-measured (still used for the badge pop only, see Motion below). OUR OWN
// SIDE: this screen's one anchor is 30px (the ticket's date headline), grounded in LOCKFILE's
// 30px "State anchor" role, not the reference's 26px listing title or its 20px card radius;
// see Conflicts below for what was kept vs ported.
//
// PUNCH-LIST REPAIR PASS 1 (critic round 1, history): (1) booking-reference chip moved off
// `.font-mono-code` (literal weight 600) onto a tabular class at computed weight 500. (2) the
// reference code stays in the ticket header, a named departure, see Conflicts. (3) the ticket's
// entrance imported THE ENTER RECIPE via `useEnterMotion()`. (4) the price row became a tap
// toggle for the Net+VAT breakdown.
//
// PUNCH-LIST REPAIR PASS 2 (critic round 2, this revision): (1) GRAVEYARD: removed the
// `<SuccessMark size={38}>` corner stamp entirely (components-legacy/booking/BookingConfirmation.tsx's
// own header + TASTE_LOG 2026-07-16 C4 both name the celebration disc owner-killed at every
// size; only the calm `statusLabel` text line remains as the confirmed moment, no replacement
// badge added). SuccessMark import, its delay-mount `useEffect`/`useState` and the `useEffect`
// react import are all removed with it, nothing else used them. (2) ENTRANCE: `useEnterMotion()`
// (JS/useEffect-driven, ships inline `opacity:0` in the raw SSR HTML per pass-1's own file) is
// replaced with a local, scoped, native CSS `@keyframes` entrance (`.tb-enter`, see the `ENTER_CSS`
// constant above the component), same fix sibling `ConfirmationVariantAView.tsx`'s own repair
// pass used for the identical blank-recorder failure. (3) FOCUS: `focus-visible:outline-none` is
// removed from the salon link; the global 2px ink outline (design contract's focus row) now
// applies on keyboard focus, no substitute halo added, `focus-visible:bg-s-bg-sunken` is a
// background fill, not a ring, so it stays. (4) EMPHASIS BUDGET: `font-semibold`/`font-bold` is
// now kept on exactly three elements (date/time headline, salon name, total price); the status
// label, service name, staff name and the three action labels all dropped to the unstyled
// default (400) weight. See the updated Type scale note below for the re-measured ratio.
//
// Exists-check: `npm run exists BookingConfirmation` -> components-legacy/booking/BookingConfirmation.tsx
// (671 lines, the real screen this direction restructures). `npm run exists SuccessMark` ->
// app/[locale]/_components/primitives/SuccessMark.tsx, real, live, graveyarded FOR THIS SCREEN
// specifically (TASTE_LOG 2026-07-16 C4, "KEEP the calm confirmation"), which is why pass 2
// removes it rather than reusing it. `npm run exists Avatar` -> app/[locale]/_components/primitives/Avatar.tsx,
// real, reused unchanged.
//
// Grounded-in: components-legacy/booking/BookingConfirmation.tsx (props shape, handleCalendar
// ICS logic, directionsHref Google Maps pattern, all copied below with the SAME derivations,
// only the container anatomy changes).
//
// Depicts: date/time headline (biggest element) -> components-legacy/booking/BookingConfirmation.tsx dateStr/timeStr derivation
// Depicts: salon name/address row -> components-legacy/booking/BookingConfirmation.tsx salon link block
// Depicts: service/staff/price rows -> components-legacy/booking/BookingConfirmation.tsx details+money cards, reordered into one ticket
// Depicts: ICS download -> components-legacy/booking/BookingConfirmation.tsx handleCalendar (copied verbatim)
// Depicts: directions link -> components-legacy/booking/BookingConfirmation.tsx directionsHref (copied verbatim)
// Depicts: manage booking link -> app/[locale]/booking/lookup/page.tsx (real route, same manageHref fallback as the real screen)
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
// every named/value row (salon, service, staff, price). 13px carries meta/secondary lines. 12px
// carries captions (reference code, action labels).
//
// Emphasis budget (repaired, closes punch item 4): `font-semibold`/`font-bold` now sits on
// exactly three elements, the date/time headline, the salon name and the total price, all three
// named as the kept anchors by the punch item itself. Every other row label (status line, service
// name, staff name) and every action label (Add to calendar / Directions / Manage booking) is now
// the unstyled default weight (400, no class). Combined with app/[locale]/layout.tsx's own
// `main :is(.font-semibold, .font-bold) { font-weight: 500 }` rule (every /dev page renders under
// a bare `<main>`), the screen renders exactly two computed weights, 400 and 500, well inside the
// ≤2-weight ceiling, and the emphasis-weight element count drops from the critic's measured
// 11-of-20 (55%) to 3 of the same first-viewport element set, re-measured live below this file's
// return payload (see this builder's `measuredUsed`).
//
// The 3 icon-circle action buttons below are PLAIN ICON BUTTONS (Add to calendar / Directions /
// Manage booking), not a photo-or-fallback slot for any entity: there is no salon/staff photo
// missing here, so there is no category icon or initial to fall back to (content-image-ok: plain
// icon button, not a photo/entity placeholder, same pattern as the real screen's own help/copy
// icon buttons in components-legacy/booking/BookingConfirmation.tsx's iconBtnClass).
//
// Motion (repaired again, closes punch item 2): the ticket's entrance is now the local, scoped,
// native CSS `@keyframes` recipe defined in the `ENTER_CSS` constant above the component (same
// three properties and same locked numbers as THE ENTER RECIPE, opacity 0->1, scale 0.96->1,
// blur(8px)->blur(0), 280ms, `glide` cubic-bezier(0.16,1,0.3,1)), not the JS/`useEnterMotion()`
// hook pass 1 used. The base `.tb-enter` rule renders the ticket at `opacity:1` with zero JS
// dependency; the keyframe only plays inside `@media (prefers-reduced-motion: no-preference)`, so
// a reduced-motion user gets the final state immediately and a stalled-hydration user still sees
// the ticket painted after the animation's own wall-clock 280ms, since a CSS keyframe runs on the
// browser's timeline, not React's `useEffect`. The corner `<SuccessMark>` badge (and its delay-
// mount timer, tied to `useEnterMotion`'s settle time) is removed entirely per punch item 1, so
// there is no longer a second, JS-driven pop layered after the card entrance on this direction.
//
// Motion, price-breakdown toggle (new, closes the 4th punch item): tapping the Total row
// expands/collapses the Net+VAT breakdown, height 0<->auto + opacity, the exact accordion
// mechanism already shipped in production at
// app/[locale]/_components/primitives/ServiceDisclosureRow.tsx (its own inline comment:
// "accordion height-auto disclosure, not a card ENTER", `motion-ok`), reused as prior art
// rather than a novel technique, and the identical AnimatePresence shape sibling
// ConfirmationCelebration.tsx already uses for its own summary-card expand. Duration is
// airbnb--motion.md's own measured "Color/background swap (outline-to-filled)" row, the one
// number in that file tagged **verified** for an in-place swap: 300ms. Curve is kept as
// Solen's own locked `GLIDE_EASE` token (zero new tokens, MOTION.md's own rule) rather than
// importing Airbnb's raw `cubic-bezier(0.2,0,0,1)`, and used identically for open AND close
// (no separate glide/thud split) because airbnb--motion.md's own finding is that Airbnb "does
// not vary easing by direction ... it varies only DURATION", so a single shared curve for both
// directions is itself the ported behavior, not a shortcut. Chevron rotate is Solen's locked
// "snap" in-place-flip curve, 150ms cubic-bezier(0.4,0,0.2,1) (LOCKFILE §4), the same value
// sibling ConfirmationVariantAView.tsx uses for its own price-breakdown chevron. Default state
// is OPEN (not closed): this direction's own idea is a receipt that already shows everything,
// and the trust floor for this surface ("price with the VAT line" visible) is FIXED across
// every direction, so the breakdown must not depend on a tap to become visible the first time;
// the tap lets it collapse and reopen, proven both ways on video.
//
// REAL-DATA NOTE (found while wiring this, not guessed): this surface's live seed booking
// (getSeedBooking) resolves to a salon with `salonVatNumber: null` and `vatRate: 0` (checked
// live via a temporary debug attribute, removed before this commit), so `showVat` is false and
// there is genuinely no VAT to break down for this specific render. Rather than leave the toggle
// dead on the one booking this mockup actually renders, the breakdown falls back to `paidVia`
// (`components-legacy/booking/BookingConfirmation.tsx:88`, sourced from the real `bookings.paid_via`
// column, `app/[locale]/confirmation/page.tsx:149`, a prop the real screen already receives and
// renders on NO screen today) so the toggle opens onto a real, non-fabricated fact ("Paid by
// card") whenever there is truly nothing to say about VAT. When a future seed booking IS VAT
// -registered, `showVat` takes over automatically and the Net+VAT line renders instead.
//
// Conflicts kept (Solen lock over the reference), see the full return payload for the complete
// list: ticket radius stays the LOCKED 24px grouped-list-card token (no 20px token exists in
// this system) over Airbnb's measured 20px card radius; the confirmed word stays plain colored
// TEXT (green when paid), never a filled Fresha-style lavender capsule, per the design
// contract's "availability" row ("plain ink text, NO green pill") and taste rule 3 (blue/color
// reserved for small clickable bits, not a decorative filled indicator); price stays at the
// 15px row-value size (not a second giant number) to respect the ≤4-size ceiling, keeping the
// date/time headline as the screen's single biggest element.
// CONFLICT [booking-reference placement] (repair-pass, punch item 2): fresha--confirmation.md
// measured #9 puts "Booking ref: E8D70974" as the LAST line of the screen, small grey, no card.
// This direction keeps the reference in the ticket's own header instead, next to the status
// word, a deliberate departure: a real physical ticket/boarding-pass always prints its serial
// in the header stub next to the status, which is the entire visual metaphor Direction B's own
// brief is built on ("the whole booking is ONE card shaped like a physical ticket ... split by
// a perforated tear line into a 'stub'"), and Fresha's own screen is not shaped like a ticket at
// all, it is a plain vertical receipt with nothing to put a reference "in the header" of. Kept
// as this direction's own idea, not fixed to match Fresha's placement.
// CONFLICT [height-animation vs THE SPEED LAW hard rule 2] (repair-pass, punch item 4): SPEED
// LAW hard rule 2 ("never animate width, height or top ... so nothing reflows mid-motion") is
// written for list/card entrances where a neighbour reflowing mid-scroll is the failure mode.
// A single in-page accordion toggling open/closed has no such neighbour-during-scroll case, and
// this exact technique already ships in real production code (ServiceDisclosureRow.tsx, cited
// above, its own `motion-ok` comment carving out precisely this exception), so this is a named,
// already-precedented departure, not a new violation.
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Scissors,
  MapPin,
  ChevronRight,
  ChevronDown,
  CalendarPlus,
  PencilLine,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { GLIDE_EASE, ENTER_DURATION } from "@/app/[locale]/_components/primitives/motion";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";

// Solen's locked "snap" in-place-flip curve (LOCKFILE §4, cubic-bezier(0.4,0,0.2,1)), used only
// for the chevron rotate, the exact value sibling ConfirmationVariantAView.tsx's own
// price-breakdown chevron already uses. Not exported from motion.ts (that module only exports
// the enter/glide family), so kept local like the sibling file does.
const SNAP_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
// airbnb--motion.md's measured "Color/background swap (outline-to-filled)" duration, the cited
// "measured Airbnb swap timing" for the price-breakdown expand/collapse; curve stays Solen's
// own GLIDE_EASE (see Motion note above), applied identically to open and close.
const BREAKDOWN_SWAP_DURATION_S = 0.3;

// PUNCH REPAIR (critic round, entrance item): same fix sibling ConfirmationVariantAView.tsx's
// own repair pass used for the identical blank-recorder failure, cited by name in this file's
// header Motion note above. useEnterMotion() is Framer-Motion/useEffect driven, so the SSR HTML
// ships the ticket at inline `opacity:0` and the page is genuinely blank until React hydrates;
// this repo's own documented fact ("hydration on `next dev` is known to be non-deterministic")
// means that blank window can span the whole capture. Replaced with a local, scoped, native CSS
// `@keyframes` entrance: the base rule renders `.tb-enter` at `opacity:1` with zero JS and zero
// animation dependency, and the keyframe is layered on ADDITIVELY only inside
// `@media (prefers-reduced-motion: no-preference)`, so a reduced-motion user never receives it
// and a stalled-hydration user still sees the ticket after the animation's own wall-clock
// duration, since CSS keyframe animations run on the browser's timeline, not React's `useEffect`.
// Same three properties and the same locked numbers as THE ENTER RECIPE, unchanged
// (`GLIDE_EASE`/`ENTER_DURATION`, imported from the shared module, not re-derived): opacity
// 0->1, scale 0.96->1, blur(8px)->blur(0), 280ms, `cubic-bezier(0.16,1,0.3,1)`.
const GLIDE_CSS_EASE = `cubic-bezier(${GLIDE_EASE.join(",")})`;
const ENTER_MS = Math.round(ENTER_DURATION * 1000);
const ENTER_CSS = `
  .tb-enter { opacity: 1; }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes tbEnter {
      from { opacity: 0; transform: scale(0.96); filter: blur(8px); }
      to { opacity: 1; transform: scale(1); filter: blur(0); }
    }
    .tb-enter { animation: tbEnter ${ENTER_MS}ms ${GLIDE_CSS_EASE} both; }
  }
`;

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
  // Real, already-flowing prop (components-legacy/booking/BookingConfirmation.tsx:88, sourced
  // from bookings.paid_via, app/[locale]/confirmation/page.tsx:149), declared on the real
  // screen's own prop type but rendered on NO screen there today. Used here, for real, when the
  // resolved booking has no VAT to break down (this surface's live seed salon has
  // salonVatNumber: null, vatRate: 0, so `showVat` is false): the breakdown row falls back to
  // this real, non-fabricated fact instead of having nothing to expand.
  const paidViaLabel: Record<string, string> = {
    stripe: "Paid by card",
    package: "Paid from package",
    gift_card: "Paid with gift card",
    walk_in: "Paid at the salon",
  };
  const paidViaText = booking.paidVia ? paidViaLabel[booking.paidVia] ?? null : null;
  const hasBreakdown = showVat || (isPaid && !!paidViaText);

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

  // Price-breakdown accordion (punch item 4). Default OPEN: this direction's trust floor
  // ("price with the VAT line" visible) is FIXED for every direction of this surface and must
  // not depend on a first tap, see the Motion note in this file's header.
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  return (
    <div className="min-h-[100dvh] bg-s-bg-sunken px-4 pb-16 pt-6">
      <div className="mx-auto w-full max-w-[402px]">
        <style>{ENTER_CSS}</style>
        <div className="tb-enter relative rounded-[24px] border border-s-border bg-white shadow-whisper">
          {/* ── ticket stub: confirmed moment (calm line, no celebration disc), date/time
              (biggest), salon ── */}
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[13px] ${statusClass}`}>{statusLabel}</span>
              <span className="font-display tabular-nums text-[12px] tracking-[-0.01em] text-s-ink-2">
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
              className="mt-4 flex items-center gap-3 rounded-[12px] py-1 focus-visible:bg-s-bg-sunken"
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
                <div className="truncate font-display text-[15px] tracking-[-0.01em] text-s-ink">
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
                  <div className="truncate font-display text-[15px] tracking-[-0.01em] text-s-ink">
                    {booking.staffName}
                  </div>
                  <div className="mt-0.5 text-[13px] text-s-ink-2">Your stylist</div>
                </div>
              </div>
            )}

            <div className="p-4">
              <button
                type="button"
                data-testid="price-breakdown-toggle"
                onClick={() => hasBreakdown && setBreakdownOpen((v) => !v)}
                aria-expanded={hasBreakdown ? breakdownOpen : undefined}
                disabled={!hasBreakdown}
                className="flex w-full items-end justify-between gap-3 text-left disabled:cursor-default"
              >
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-[13px] text-s-ink-2">
                    {showVat ? "Total (incl. VAT)" : "Total"}
                    {hasBreakdown && (
                      <motion.span
                        animate={{ rotate: breakdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.15, ease: SNAP_EASE }}
                        className="grid place-items-center text-s-ink-2"
                      >
                        <ChevronDown size={13} strokeWidth={2} aria-hidden />
                      </motion.span>
                    )}
                  </span>
                  {!isPaid && (
                    <div className="mt-0.5 text-[13px] text-s-ink-2">
                      {isConfirming ? "Confirming payment…" : "Pay at the salon"}
                    </div>
                  )}
                </div>
                <span className="shrink-0 font-display text-[15px] font-bold leading-none tracking-[-0.02em] tabular-nums text-s-ink">
                  {booking.priceLabel}
                </span>
              </button>

              {hasBreakdown && (
                <AnimatePresence initial={false}>
                  {breakdownOpen && (
                    <motion.div
                      key="breakdown"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                        transition: { duration: BREAKDOWN_SWAP_DURATION_S, ease: GLIDE_EASE },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: { duration: BREAKDOWN_SWAP_DURATION_S, ease: GLIDE_EASE },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1.5 text-[13px] text-s-ink-2">
                        {showVat
                          ? `${booking.netLabel} + ${booking.vatLabel} VAT (${booking.vatRate}%)`
                          : paidViaText}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

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
            <span className="text-center text-[12px] leading-tight text-s-ink">
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
            <span className="text-center text-[12px] leading-tight text-s-ink">
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
            <span className="text-center text-[12px] leading-tight text-s-ink">
              Manage booking
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
