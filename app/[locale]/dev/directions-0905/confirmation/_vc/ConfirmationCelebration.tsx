"use client";

// exists-check: net-new vs lib/verify-salon-client.ts, lib/cancellation-policy.ts (fee math,
// not a screen), app/[locale]/booking-action/page.tsx, lib/gdpr/purge-client-photo-storage.ts,
// _tasks/archive/SOLEN_BRAND_OVERVIEW.md, app/[locale]/dev/motion-recipe/page.tsx (a timing
// sign-off demo, not this screen), supabase/migrations/004_salon_photos.sql,
// app/[locale]/dev/airbnb-03-salon/page.tsx (a different surface, the salon page not
// confirmation) because none of them is the confirmation screen. This file is the Direction C
// treatment of the REAL app/[locale]/confirmation/page.tsx + BookingConfirmation.tsx (see
// Grounded-in below), not a duplicate of any file above.

/**
 * ConfirmationCelebration, Direction C ("What happens next") of the confirmation
 * screen comparison. Copy of the real BookingConfirmation.tsx screen with ONE
 * restructure applied: the screen leads with the timeline of what happens next
 * (confirmed, reminder, the visit) and the three actions, the booking facts collapse
 * into a compact summary that expands on tap, and the celebration (SuccessMark +
 * staggered timeline) is the single biggest motion moment on the page.
 *
 * Grounded-in: components-legacy/booking/BookingConfirmation.tsx (hero photo + frosted
 * help icon, salon name/address row, isPaid/isConfirming/isCancelledNow derivation,
 * handleCalendar's .ics technique, directionsHref, manageHref, and the VAT/total labels
 * -> all copied logic and copy, not re-invented), app/[locale]/_components/primitives/
 * SuccessMark.tsx (the existing celebration primitive, reused unmodified),
 * app/[locale]/_components/primitives/motion.ts (ENTER_RECIPE / GLIDE_EASE, reused not
 * forked), app/[locale]/_components/primitives/ServiceDisclosureRow.tsx (the shipped
 * chevron+AnimatePresence accordion technique this file's summary-card expand mirrors,
 * height/opacity not opacity+scale+blur, per that file's own "not a card ENTER" comment),
 * app/[locale]/_components/salon/MetaDot.tsx (the no-glyph separator, reused instead of a
 * middle-dot).
 *
 * Reference-checked: _design-system/references/fresha--confirmation.md,
 * _design-system/references/airbnb--look-recipe.md,
 * _design-system/references/airbnb--checkout-and-confirmation.md,
 * _design-system/references/airbnb--motion.md,
 * _design-system/references/21st-dev--motion-kit.md (all read in full this turn).
 *
 * Depicts: hero photo + frosted help icon -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: salon name/address row with chevron -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: celebration mark -> app/[locale]/_components/primitives/SuccessMark.tsx
 * Depicts: payment-state derivation (isPaid/isConfirming/isCancelledNow) -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: add-to-calendar .ics technique -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: directions link -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: manage booking link -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: cancellation policy line placement above actions -> components-legacy/booking/PayConfirmStep.tsx
 * Depicts: VAT total / net / rate labels -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: meta separator -> app/[locale]/_components/salon/MetaDot.tsx
 * Depicts: reference code footer -> components-legacy/booking/BookingConfirmation.tsx
 * Depicts: timeline anatomy (confirmed / reminder / the visit) -> NET-NEW: this direction's own idea, the assigned VARY axis
 * Depicts: compact expandable summary -> NET-NEW: this direction's own idea, the assigned VARY axis
 * Depicts: 24h reminder window copy -> app/api/cron/sms-reminders/route.ts
 *
 * Sources: fresha--confirmation.md (element roster: photo hero, status/date moment, action
 * rows, overview+total, cancellation policy, booking ref, nothing sticky, no primary CTA on
 * a receipt), airbnb--look-recipe.md + airbnb--checkout-and-confirmation.md (the reference
 * files record Airbnb's own multi-step commit as ink-black already, so the LOCKED Solen ink
 * CTA token was kept unchanged, only its radius stayed at Solen's own 16px lock rather than
 * Airbnb's 12px), airbnb--motion.md (press-feedback timing family) and
 * _design-system/MOTION.md (THE ENTER RECIPE: opacity+scale+blur, 280ms glide, LOCKED,
 * gate-enforced; the brief text said "opacity, y, scale" but the locked file has no y-axis
 * translate and a gate blocks opacity-without-blur, so the locked file's shape was followed).
 * Timeline stagger uses 60ms per this direction's own brief (not the shared enterStaggerContainer's
 * locked 50ms default, which is a different named token for a different context; this file
 * builds its own Variants off the same ENTER_RECIPE from/to values rather than editing the
 * shared primitive).
 *
 * Conflicts:
 * - CONFLICT [dated taste decision]: TASTE_LOG.md 2026-07-16 records "C4 celebration screens:
 *   KEEP the calm confirmation" (owner verbatim: "that's okay, but... not for that, not how
 *   you did it with c four"), and BookingConfirmation.tsx's own header comment states that
 *   the big SuccessMark disc is an owner-killed pattern for THIS exact screen. Direction C's
 *   assigned brief explicitly asks for "the celebration is the biggest motion on the page
 *   (SuccessMark...)", the opposite of that dated decision. Built exactly as briefed (this is
 *   the assigned VARY axis, not mine to overrule per the fan-out contract), flagged here so
 *   the orchestrator can weigh it against the 2026-07-16 kill before this direction is shown.
 * - CONFLICT [CTA radius]: Airbnb's own checkout/confirmation commit ("Next"/"Got it") is
 *   ink-black already (matches Solen's ink CTA lock), but at radius 12px against Solen's
 *   locked 16px button radius. Kept Solen's 16px lock.
 * - CONFLICT [confirmation background warmth]: Airbnb's confirmation screens use a warm cream
 *   background (the only warm surface in that whole capture). Taste rule 3 bans warm cream by
 *   name. Kept white per the lock.
 * - No conflict on stickiness: per fresha--confirmation.md, a post-purchase receipt carries no
 *   primary CTA and nothing sticky; the sticky-bar floor (hierarchy-density-06) is scoped to a
 *   screen with a single primary COMMIT action (Buchen/Bezahlen), which this is not. Actions
 *   render inline, matching the real BookingConfirmation.tsx.
 *
 * measured: measure-ok. Every rendered size (14px name, 12px meta, 15px CTA/button label,
 * 28px display anchor) is pulled from Solen's own LOCKED design-contract token table
 * (CLAUDE.md "Design contract" row "text size": name 14, meta 12, CTA 15, plus the FLOORS LAW
 * display-anchor floor >=28), not eyeballed off the Fresha/Airbnb stills. Both reference
 * captures explicitly tag their own confirmation-screen numbers `assume` (Mobbin stills only,
 * no computed styles reachable for someone else's app screen, stated in
 * airbnb--checkout-and-confirmation.md's own "Not measured" section), so porting a literal
 * px value from either reference here would itself be an eyeball, not a measurement; the
 * LOCKED Solen token table is the actual measured source for every size in this file.
 *
 * emphasis-ok: weight >=600 is deliberately kept to only THREE anchors on this screen (the
 * 28px celebration headline, the price value in the summary row, and the primary "Add to
 * calendar" ink CTA), per FLOORS LAW 7a ("keep weight on the ONE anchor per section... body and
 * meta text stay font-normal"). Every row title (timeline rows, salon name, expanded rows,
 * the secondary Directions button, the Manage booking link) stays font-normal; the signal for
 * those comes from the icon, the ink colour on a coloured link, or position, not weight.
 *
 * floors: (a) photo focal = the real salon cover photo hero; (b) one biggest element = the
 * 28px "Booking confirmed!" headline, matching the display-anchor floor even though the photo
 * already exempts it; (c) real tabular number = the real price (tabular-nums) + the real
 * reminder-window/cancellation-hours figures; (d) semantic colour = SuccessMark's green disc +
 * white check (icon-only, per the contrast tier rule); (e) no dead-grey zone = white throughout,
 * the one sunken tray is the timeline connector rail only; (f) worst-case content: salon name
 * truncates (line-clamp/truncate), the service name truncates, a long staff name truncates, none
 * of that breaks the two-ink-anchor rule (name+price) or the 28px anchor.
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
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import { ENTER_RECIPE, ENTER_DURATION, GLIDE_EASE } from "@/app/[locale]/_components/primitives/motion";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";

// This direction's own timeline stagger (60ms, per this direction's brief), built off the same
// ENTER_RECIPE opacity+scale+blur values rather than the shared enterStaggerContainer (which is
// locked to a 50ms step for its own callers, a different named token, not edited here).
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

  const confirmedSubtext = isCancelledNow
    ? "Cancelled"
    : isPaid
      ? "Paid online"
      : isConfirming
        ? "Confirming payment…"
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
          {/* ── salon row, trust floor: who you're booking with, visible above the actions ── */}
          <Link href={`/${locale}/salon/${booking.salonSlug}`} className="mt-4 flex items-center gap-2 py-1">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] tracking-[-0.01em] text-s-ink">
                {booking.salonName}
              </div>
              {booking.salonAddress && (
                <div className="mt-0.5 flex items-center gap-1 text-[12px] text-s-ink-2">
                  <MapPin size={12} className="shrink-0 text-s-ink-2" aria-hidden />
                  <span className="truncate">{booking.salonAddress}</span>
                </div>
              )}
            </div>
            <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
          </Link>

          {/* ── celebration: the biggest motion moment on the page ── */}
          <div className="mt-8 flex flex-col items-center text-center">
            {!isCancelledNow && <SuccessMark size={58} />}
            <h1
              className="celebrate-rise mt-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink"
              style={{ animationDelay: "0.2s" }}
            >
              {isCancelledNow ? "Appointment cancelled" : "Booking confirmed!"}
            </h1>
          </div>

          {/* ── timeline: what happens next, staggered 60ms apart ── */}
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
                <div className="text-[14px] text-s-ink">Confirmed</div>
                <div className="mt-0.5 text-[12px] text-s-ink-2">{confirmedSubtext}</div>
              </div>
            </motion.li>

            {!isCancelledNow && (
              <motion.li variants={reduceMotion ? undefined : timelineItem} className="relative flex gap-3">
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                  <Bell size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="text-[14px] text-s-ink">Reminder</div>
                  <div className="mt-0.5 text-[12px] text-s-ink-2">Sent 24 hours before your appointment</div>
                </div>
              </motion.li>
            )}

            {!isCancelledNow && (
              <motion.li variants={reduceMotion ? undefined : timelineItem} className="relative flex gap-3">
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                  <Calendar size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="text-[14px] text-s-ink">Your visit</div>
                  <div className="mt-0.5 flex items-center text-[12px] text-s-ink-2">
                    <span>{dateStr}</span>
                    <MetaDot />
                    <span>{timeStr}</span>
                    {booking.durationMinutes ? (
                      <>
                        <MetaDot />
                        <span>{booking.durationMinutes} min</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </motion.li>
            )}
          </motion.ol>

          {/* ── compact summary, collapsed by default, expands on tap (accordion technique
              mirrors ServiceDisclosureRow.tsx: height/opacity, not the card ENTER recipe) ── */}
          <div className="mt-6 overflow-hidden rounded-card border border-s-border bg-white">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <Scissors size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] tracking-[-0.01em] text-s-ink">
                  {booking.serviceName}
                </div>
                <div className="mt-0.5 text-[12px] text-s-ink-2">
                  {showVat ? "Total (incl. VAT)" : "Total"}
                </div>
              </div>
              <span className="shrink-0 text-[15px] font-semibold tabular-nums text-s-ink">
                {booking.priceLabel}
              </span>
              <ChevronDown
                size={18}
                strokeWidth={1.9}
                aria-hidden
                className={`shrink-0 text-s-ink-2 transition-transform duration-[180ms] ${expanded ? "rotate-180" : ""}`}
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
                  <hr className="border-s-border" />
                  <div className="flex items-center gap-3 p-4">
                    <Calendar size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-s-ink">{dateStr}</div>
                      <div className="mt-0.5 text-[12px] text-s-ink-2">{timeStr}</div>
                    </div>
                  </div>
                  {booking.staffName && (
                    <>
                      <hr className="border-s-border" />
                      <div className="flex items-center gap-3 p-4">
                        <Avatar src={null} name={booking.staffName} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] text-s-ink">{booking.staffName}</div>
                          <div className="mt-0.5 text-[12px] text-s-ink-2">your stylist</div>
                        </div>
                      </div>
                    </>
                  )}
                  {showVat && (
                    <>
                      <hr className="border-s-border" />
                      <div className="flex flex-col gap-1.5 p-4 text-[12px] text-s-ink-2">
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

          {/* ── trust floor: cancellation term, rendered in the DOM above the actions ── */}
          <div className="mt-4 flex items-start gap-2 px-1">
            <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
            <p className="text-[12px] leading-[1.5] text-s-ink-2">
              {`Free cancellation up to ${freeCancelHours}h before your appointment.`}
            </p>
          </div>

          {/* ── three actions ── */}
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
            className="mt-2.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-white text-[15px] text-s-ink"
          >
            <MapPin size={17} strokeWidth={1.9} aria-hidden />
            Directions
          </a>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-s-border pt-4 text-[12px]">
            {booking.referenceCode ? (
              <span className="text-s-ink-2">{booking.referenceCode}</span>
            ) : (
              <span />
            )}
            <Link href={manageHref} className="inline-flex items-center gap-0.5 text-s-accent">
              Manage booking
              <ChevronRight size={15} strokeWidth={1.9} aria-hidden />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
