"use client";

// exists-check: net-new vs lib/verify-salon-client.ts, lib/cancellation-policy.ts (fee math,
// not a screen), app/[locale]/booking-action/page.tsx, lib/gdpr/purge-client-photo-storage.ts,
// _tasks/archive/SOLEN_BRAND_OVERVIEW.md, app/[locale]/dev/motion-recipe/page.tsx (a timing
// sign-off demo, not this screen), supabase/migrations/004_salon_photos.sql,
// app/[locale]/dev/airbnb-03-salon/page.tsx (a different surface, the salon page not
// confirmation) because none of them is the confirmation screen. This file is the Direction C
// treatment of the REAL app/[locale]/confirmation/page.tsx + BookingConfirmation.tsx (see
// Grounded-in below), not a duplicate of any file above. Filename kept (`ConfirmationCelebration.tsx`)
// so the sibling server wrapper's import does not need touching; the export symbol
// `ConfirmationCelebration` is also kept for the same reason, even though the content below no
// longer renders a celebration of any kind, see REBUILD note.

/**
 * ConfirmationCelebration (component name kept for import stability; the screen it renders is
 * "What happens next", not a celebration), Direction C of the confirmation screen comparison.
 *
 * REBUILD 2026-09-05: this file previously shipped the big 58px `<SuccessMark>` disc as the
 * page's centered hero moment and rendered the salon row ABOVE that celebration block, in an
 * order its own header called "a bespoke order without naming it." Both are wrong and are
 * corrected here:
 *   1. The big SuccessMark celebration disc is OWNER-KILLED for this screen (TASTE_LOG.md
 *      2026-07-16 "C4 celebration screens: KEEP the calm confirmation", plus
 *      components-legacy/booking/BookingConfirmation.tsx's own header: "The big SuccessMark disc
 *      is an owner-killed pattern and does not come back for any state"). It does not come back
 *      in this rebuild, or in any other direction of this surface.
 *   2. CONTRADICTION FOUND AND SURFACED (CLAUDE.md rule 18, "surface contradictions, don't
 *      proceed on the wrong framing"): the brief for this rebuild describes the calm confirmed
 *      moment as "the small success disc and the confirmed line the real screen uses". Reading
 *      components-legacy/booking/BookingConfirmation.tsx end to end (this turn) shows it renders
 *      NO disc of any size for the confirmed moment, small or big, only a colour-branched
 *      headline (green when paid, ink when confirming/pay-at-salon, red when cancelled) plus,
 *      separately, a small pale-green check chip in its MONEY card ("Paid"). There is no disc
 *      anywhere on the real screen. Built on what is actually true: the calm confirmed moment
 *      below reuses the real screen's two ACTUAL ingredients (the small pale-green check chip,
 *      only when the booking is actually paid, plus the colour-branched headline text), never the
 *      SuccessMark component, at any size.
 *   3. This direction's own declared order is now: confirmed moment, date and time, timeline
 *      plus actions, salon, collapsed facts (the assigned VARY axis for this direction, replacing
 *      Fresha's plain top-to-bottom order per this direction's own brief; see Conflicts).
 *
 * Grounded-in: components-legacy/booking/BookingConfirmation.tsx (hero photo + frosted help icon,
 * salon name/address row + chevron, isPaid/isConfirming/isCancelledNow derivation, the paid-chip
 * markup, handleCalendar's .ics technique, directionsHref, manageHref, referenceCode footer, and
 * the VAT rate/net/vat labels , all copied logic and copy, not re-invented),
 * app/[locale]/_components/primitives/motion.ts (ENTER_RECIPE / ENTER_DURATION / GLIDE_EASE,
 * reused not forked), app/[locale]/_components/primitives/ServiceDisclosureRow.tsx (the shipped
 * chevron+AnimatePresence accordion technique the summary-card expand below mirrors exactly:
 * height/opacity, 180ms GLIDE_EASE, chevron rotate over 260ms ease-glide , confirmed by reading
 * that file this turn, not re-derived), app/[locale]/_components/salon/MetaDot.tsx (the no-glyph
 * separator, used instead of a middle-dot or pipe per LOCKFILE §2.5 A12).
 *
 * Reference-checked this turn: _design-system/references/fresha--confirmation.md (Fresha's own
 * small confirmed-state chip sits alone, then the biggest text on the screen is the date/time
 * headline , that pairing is exactly what this rebuild's "confirmed moment" -> "date and time"
 * order borrows), _design-system/references/airbnb--look-recipe.md, _design-system/references/
 * airbnb--checkout-and-confirmation.md, _design-system/references/airbnb--motion.md (read in
 * full; it has NO section actually titled or covering "the confirmation moment" , its ten
 * measured sections are search-expand, category-switch, gallery-open, reserve-entry, card-tap,
 * back-nav and button press/hover feedback, none of them Airbnb's own post-booking confirmation
 * screen; see Conflicts for this contradiction between the brief's phrasing and the file's actual
 * contents), _design-system/references/21st-dev--motion-kit.md (read in full; its own "NOT
 * CAPTURED" section explicitly names "a dedicated success/confirmation checkmark animation" as
 * not captured this session either).
 *
 * Depicts: hero photo + frosted help icon -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: calm confirmed moment (pale-green check chip + colour-branched headline text) -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: date/time as the display anchor -> components-legacy/booking/BookingConfirmation.tsx (date row, size/position treated as this direction's anchor)
 * Depicts: duration subtext below the date/time anchor -> components-legacy/booking/BookingConfirmation.tsx (same date row already carries duration)
 * Depicts: timeline anatomy (confirmed / reminder / the visit) -> NET-NEW: this direction's own idea, the assigned VARY axis
 * Depicts: relative visit countdown (Tomorrow / In N days) -> NET-NEW: computed from the real booking.startsAt, never fabricated
 * Depicts: reminder window copy (24 hours before) -> app/api/cron/sms-reminders/route.ts
 * Depicts: cancellation policy line placement above the actions -> components-legacy/booking/PayConfirmStep.tsx
 * Depicts: cancellation window hours -> ./getCancellationInfo.ts
 * Depicts: add-to-calendar .ics technique -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: directions link -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: manage booking link and reference code footer -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: salon row (name, address, chevron) -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: compact expandable summary header -> NET-NEW: this direction's own idea, the assigned VARY axis
 * Depicts: professional row inside the expanded summary -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: VAT net/rate/amount rows inside the expanded summary -> components-legacy/booking/BookingConfirmation.tsx
 *
 * Direction: "What happens next" (v=c). The screen leads with the sequence of what happens after
 * booking (confirmed now, reminder day-before, the visit) and the three actions; the booking
 * facts (service, professional, price+VAT, duration) collapse into a tap-to-expand summary rather
 * than sitting in an always-open card.
 *
 * Sources: fresha--confirmation.md (small confirmed-state chip then the biggest text is
 * date/time; no primary CTA on a receipt; nothing sticky), airbnb--look-recipe.md +
 * airbnb--checkout-and-confirmation.md (Airbnb's own multi-step commit is ink-black already, so
 * Solen's locked ink CTA token needed no change), airbnb--motion.md (press-feedback timing
 * family; NO confirmation-moment section exists in it, see Conflicts), 21st-dev--motion-kit.md
 * (no success-checkmark capture exists in it either; its Tabs finding, 150ms
 * `cubic-bezier(0.4,0,0.2,1)` = Solen's own locked `snap` token exactly, is not used on this
 * screen since nothing here is an in-place state flip), _design-system/MOTION.md (THE ENTER
 * RECIPE: opacity+scale+blur together, 280ms, `glide` ease, LOCKED, used for the timeline rows'
 * entrance). Timeline stagger uses 60ms per this direction's own brief (not the shared
 * `enterStaggerContainer`'s locked 50ms default, a different named token for a different
 * context); this file builds its own Variants off the same ENTER_RECIPE from/to values rather
 * than editing that shared primitive.
 *
 * Conflicts:
 * - CONFLICT [contradiction, resolved above]: the brief describes the calm confirmed moment as
 *   pairing "the small success disc" with "the confirmed line the real screen uses". The real
 *   screen (read in full this turn) has no disc, small or big, only a colour-branched headline
 *   plus a separate small pale-green check chip in its money card. Built on the real screen's
 *   actual two ingredients (chip + headline text), never a disc.
 * - CONFLICT [reference gap]: the brief names "airbnb--motion.md (the confirmation moment)" as a
 *   motion source. That file's own scope note and its ten measured section headings (search-
 *   expand, category-switch, gallery-open, reserve-entry, card-tap, back-nav, press/hover) do not
 *   include Airbnb's own post-booking confirmation screen at all; it was never captured. Per
 *   CLAUDE.md's "look at the reference, not only the spec" rule, the stills/file win over the
 *   brief's paraphrase: there is no Airbnb confirmation-moment motion data to build against. The
 *   timeline entrance below is grounded instead in Solen's own locked ENTER RECIPE (the only
 *   actually-measured entrance timing available for this exact use), and the summary-expand is
 *   grounded in the shipped `ServiceDisclosureRow.tsx` accordion (also actually measured, live in
 *   this codebase). Nothing here was invented to fill the gap; the gap is named instead.
 * - CONFLICT [dated taste decision, upheld not revived]: TASTE_LOG.md 2026-07-16 records "C4
 *   celebration screens: KEEP the calm confirmation" and BookingConfirmation.tsx's own header
 *   states the big SuccessMark disc is owner-killed for this exact screen. The PREVIOUS revision
 *   of this direction's file violated that decision (58px SuccessMark, centered celebration
 *   block). This rebuild removes it entirely; no conflict remains, flagged here only as the
 *   record of what was wrong and is now fixed.
 * - CONFLICT [CTA radius]: Airbnb's own checkout/confirmation commit is ink-black already (matches
 *   Solen's ink CTA lock) but at radius 12px against Solen's shipped `rounded-btn` 99px capsule.
 *   Per this round's settled radius note (a 16px button corner was shown and rejected 2026-09-02,
 *   "I never wanted this corner thing"), the shipped capsule token is kept unchanged; button
 *   radius is not re-litigated by this file.
 * - CONFLICT [confirmation background warmth]: Airbnb's confirmation screens use a warm cream
 *   background. Taste rule 3 bans warm cream by name. Kept white per the lock.
 * - No conflict on stickiness: per fresha--confirmation.md, a post-purchase receipt carries no
 *   primary CTA and nothing sticky; the sticky-bar floor (hierarchy-density-06) is scoped to a
 *   screen with a single primary COMMIT action (Buchen/Bezahlen), which this is not. All three
 *   actions render inline.
 * - Scope limit, named not silently dropped: the real screen's GUEST access-link block
 *   (`props.isGuest && props.accessLink`) is not reproduced here, same as the previous revision of
 *   this direction. This is a structure/treatment exploration of the confirmed-and-owner-linked
 *   path, not a full parity rebuild of every guest-specific affordance.
 *
 * measured: measure-ok. Every rendered size (28px display anchor, 15px CTA/price, 14px
 * name/title, 12px meta) is pulled from Solen's own LOCKED design-contract token table
 * (CLAUDE.md "Design contract" row "text size": name 14, meta 12, CTA 15, plus the FLOORS LAW
 * display-anchor floor >=28), never eyeballed off the Fresha/Airbnb stills, both of which tag
 * their own confirmation-screen numbers `assume` in their own text (no computed styles reachable
 * for someone else's app screen). Exactly four distinct sizes render on this screen: 28 / 15 / 14
 * / 12 (the confirmed-state chip text is set to 12, the meta bucket, rather than the real
 * screen's literal 13px chip size, specifically so this screen does not add a fifth distinct
 * size).
 *
 * emphasis-ok: weight is deliberately binary, font-semibold (600) or font-normal (400), so the
 * whole screen carries exactly two weight classes (FLOORS LAW type budget: <=4 sizes AND <=2
 * weights). Semibold is spent on only four elements: the 28px date/time anchor, the 15px price
 * value in the collapsed summary header, and the two 15px action-button labels. Every row title
 * (confirmed-moment line, timeline row titles, salon name, service name, staff name, the
 * secondary Directions button's own row context) and every meta line stays font-normal.
 *
 * floors: (a) photo focal = the real salon cover photo hero; (b) one biggest element = the 28px
 * date/time headline (Fresha's own "biggest text on the screen" position), which also satisfies
 * the FLOORS LAW display-anchor floor even though the photo already exempts it; (c) real tabular
 * number = the real price (tabular-nums), the real duration in minutes, the real relative-visit
 * countdown computed from `booking.startsAt`, and the real cancellation-window hours; (d)
 * semantic colour = the pale-green paid chip + green confirmed-row disc (icon-only per the
 * contrast-tier rule, never body text); (e) no dead-grey zone = white throughout, the one sunken
 * tray is the timeline connector rail hairline only; (f) worst-case content: the salon name and
 * service name both truncate, a long staff name truncates, none of that breaks the two-ink-anchor
 * rule (name+price) or the 28px anchor.
 */
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import {
  Check,
  Calendar,
  MapPin,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Bell,
  Scissors,
  ShieldCheck,
} from "lucide-react";
import { FROST_GLASS } from "@/lib/frost-glass";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { ENTER_RECIPE, ENTER_DURATION, GLIDE_EASE } from "@/app/[locale]/_components/primitives/motion";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";

// This direction's own timeline stagger (60ms, per this direction's brief), built off the same
// ENTER_RECIPE opacity+scale+blur values rather than the shared enterStaggerContainer (locked to
// a 50ms step for its own callers, a different named token, not edited here).
const timelineContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const timelineItem: Variants = {
  hidden: ENTER_RECIPE.initial,
  visible: { ...ENTER_RECIPE.animate, transition: { duration: ENTER_DURATION, ease: GLIDE_EASE } },
};

export function ConfirmationCelebration({
  booking,
  freeCancelHours,
  locale,
}: {
  booking: BookingConfirmationProps;
  freeCancelHours: number;
  locale: string;
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const start = new Date(booking.startsAt);
  const dateStr = start.toLocaleDateString(localeCode, { weekday: "long", day: "numeric", month: "long" });
  const timeStr = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });

  // Same payment-truth derivation as the real screen (never an unconditional "paid").
  const isPaid = booking.paymentStatus === "paid";
  const isConfirming = !isPaid && (booking.hasOnlinePayment || booking.paymentStatus === "processing");
  const isCancelledNow = booking.status === "cancelled";
  const showVat = isPaid && booking.vatRate > 0;

  // Real, derived from booking.startsAt, never fabricated. A three-way STATE label (today /
  // tomorrow / N-days-out), not a counted-noun plural, so this is a status ternary, not the
  // "N items" pattern the plural-ternary check targets. plural-ok
  const diffDays = Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const relativeVisit = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`; // plural-ok: mockup-only English state label (today/tomorrow/in N days), not routed through next-intl per this dev comparison's own English-only rule

  const hasPhoto = Boolean(booking.salonCoverUrl);
  const helpHref = `/${locale}/help`;
  const manageHref = booking.isGuest && booking.accessLink ? booking.accessLink : `/${locale}/booking/lookup`;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${booking.salonName} ${booking.salonAddress}`.trim(),
  )}`;

  // Same .ics technique as BookingConfirmation.tsx's handleCalendar, not re-invented.
  const handleCalendar = () => {
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
      `DESCRIPTION:Booked via solen.ch`,
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
  };

  const confirmedLine = isCancelledNow
    ? "Appointment cancelled"
    : isPaid
      ? "Confirmed"
      : isConfirming
        ? "Confirming payment"
        : "Pay at the salon";

  return (
    <div className="min-h-[100dvh] bg-white text-s-ink">
      <main className="mx-auto w-full max-w-[440px] pb-16">
        {/* ── hero: real salon cover photo, frosted help circle (no back drawn, the global
            Header already owns that on this deep page, per BookingConfirmation.tsx's own note) ── */}
        {hasPhoto ? (
          <div className="relative h-[240px] w-full overflow-hidden">
            <Image
              src={booking.salonCoverUrl as string}
              alt=""
              fill
              sizes="(max-width: 440px) 100vw, 440px"
              className="object-cover"
              priority
              aria-hidden
            />
            <div className="absolute inset-x-4 top-4 flex items-center justify-end">
              <Link href={helpHref} aria-label="Help" className="grid h-11 w-11 place-items-center rounded-full text-s-ink" style={FROST_GLASS}>
                <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end px-4 pt-4">
            <Link href={helpHref} aria-label="Help" className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white text-s-ink">
              <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        )}

        <div className="px-5">
          {/* ── 1. calm confirmed moment: the real screen's own two ingredients (a small
              pale-green check chip, only when actually paid, plus the colour-branched headline
              text), never a disc, never centered, never the celebration size ── */}
          <div className="mt-5 flex items-center gap-2">
            {isPaid && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-s-success-bg px-2 py-[3px] text-[12px] font-normal text-s-success">
                <Check size={12} strokeWidth={2.6} aria-hidden />
                Paid
              </span>
            )}
            <span
              className={`text-[14px] font-normal ${
                isCancelledNow ? "text-s-error" : isPaid ? "text-s-success" : "text-s-ink"
              }`}
            >
              {confirmedLine}
            </span>
          </div>

          {/* ── 2. date and time: the display anchor, biggest text on the screen (Fresha's own
              structure), duration subtext directly below it ── */}
          <h1 className="mt-2 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
            {dateStr}
          </h1>
          <div className="mt-1 flex items-center text-[12px] font-normal text-s-ink-2">
            <span>{timeStr}</span>
            {booking.durationMinutes ? (
              <>
                <MetaDot />
                <span>{booking.durationMinutes} min</span>
              </>
            ) : null}
          </div>

          {/* ── 3. timeline plus the three actions ── */}
          <motion.ol
            variants={timelineContainer}
            initial={reduceMotion ? "visible" : "hidden"}
            animate="visible"
            className="relative mt-8 flex flex-col gap-5 pl-1"
          >
            <span aria-hidden className="absolute left-[19px] top-3 bottom-3 w-px bg-s-border" />

            <motion.li variants={reduceMotion ? undefined : timelineItem} className="relative flex gap-3">
              <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-success">
                <Check size={17} strokeWidth={2.4} className="text-white" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-1.5">
                <div className="text-[14px] font-normal text-s-ink">Confirmed</div>
                <div className="mt-0.5 text-[12px] font-normal text-s-ink-2">Just now</div>
              </div>
            </motion.li>

            {!isCancelledNow && (
              <motion.li variants={reduceMotion ? undefined : timelineItem} className="relative flex gap-3">
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                  <Bell size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="text-[14px] font-normal text-s-ink">Reminder</div>
                  <div className="mt-0.5 text-[12px] font-normal text-s-ink-2">Sent 24 hours before your appointment</div>
                </div>
              </motion.li>
            )}

            {!isCancelledNow && (
              <motion.li variants={reduceMotion ? undefined : timelineItem} className="relative flex gap-3">
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                  <Calendar size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="text-[14px] font-normal text-s-ink">Your visit</div>
                  <div className="mt-0.5 text-[12px] font-normal text-s-ink-2">{relativeVisit}</div>
                </div>
              </motion.li>
            )}
          </motion.ol>

          {/* ── trust floor: cancellation term, rendered in the DOM above the actions ── */}
          {!isCancelledNow && (
            <div className="mt-5 flex items-start gap-2 px-1">
              <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
              <p className="text-[12px] font-normal leading-[1.5] text-s-ink-2">
                {`Free cancellation up to ${freeCancelHours}h before your appointment.`}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCalendar}
            className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink text-[15px] font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-[0.94] active:scale-[0.98]"
          >
            <Calendar size={17} strokeWidth={1.9} aria-hidden />
            Add to calendar
          </button>
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-white text-[15px] font-semibold text-s-ink"
          >
            <MapPin size={17} strokeWidth={1.9} aria-hidden />
            Directions
          </a>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-s-border pt-4 text-[12px]">
            {booking.referenceCode ? (
              <span className="font-normal text-s-ink-2">{booking.referenceCode}</span>
            ) : (
              <span />
            )}
            <Link href={manageHref} className="inline-flex items-center gap-0.5 font-normal text-s-accent">
              Manage booking
              <ChevronRight size={15} strokeWidth={1.9} aria-hidden />
            </Link>
          </div>

          {/* ── 4. salon row, follows the timeline+actions per this direction's declared order ── */}
          <Link href={`/${locale}/salon/${booking.salonSlug}`} className="mt-6 flex items-center gap-2 border-t border-s-border py-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-normal tracking-[-0.01em] text-s-ink">
                {booking.salonName}
              </div>
              {booking.salonAddress && (
                <div className="mt-0.5 flex items-center gap-1 text-[12px] font-normal text-s-ink-2">
                  <MapPin size={12} className="shrink-0 text-s-ink-2" aria-hidden />
                  <span className="truncate">{booking.salonAddress}</span>
                </div>
              )}
            </div>
            <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
          </Link>

          {/* ── 5. collapsed facts: compact by default, expands on tap (accordion technique
              mirrors ServiceDisclosureRow.tsx exactly: height/opacity, 180ms GLIDE_EASE) ── */}
          <div className="overflow-hidden rounded-card border border-s-border bg-white">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <Scissors size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-normal tracking-[-0.01em] text-s-ink">
                  {booking.serviceName}
                </div>
                {booking.durationMinutes ? (
                  <div className="mt-0.5 text-[12px] font-normal text-s-ink-2">
                    {showVat ? `${booking.durationMinutes} min, incl. VAT` : `${booking.durationMinutes} min`}
                  </div>
                ) : null}
              </div>
              <span className="shrink-0 text-[15px] font-semibold tabular-nums text-s-ink">
                {booking.priceLabel}
              </span>
              <ChevronDown
                size={18}
                strokeWidth={1.9}
                aria-hidden
                className={`shrink-0 text-s-ink-2 transition-transform duration-[260ms] ease-glide ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: GLIDE_EASE }}
                  className="overflow-hidden"
                >
                  {booking.staffName && (
                    <>
                      <hr className="border-s-border" />
                      <div className="flex items-center gap-3 p-4">
                        <Avatar src={null} name={booking.staffName} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-normal text-s-ink">{booking.staffName}</div>
                          <div className="mt-0.5 text-[12px] font-normal text-s-ink-2">your stylist</div>
                        </div>
                      </div>
                    </>
                  )}
                  {showVat && (
                    <>
                      <hr className="border-s-border" />
                      <div className="flex flex-col gap-1.5 p-4 text-[12px] font-normal text-s-ink-2">
                        <div className="flex items-center justify-between">
                          <span>Net</span>
                          <span className="tabular-nums">{booking.netLabel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{`VAT ${booking.vatRate}%`}</span>
                          <span className="tabular-nums">{booking.vatLabel}</span>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
