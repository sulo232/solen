"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a next-appointment card. `npm run exists bookings-list` (run earlier this session)
// shows the previous round's own compact hero card, read in full below as the base this file
// starts from by hand.
//
// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (the real
// loader behind every field this card renders) and this screen's own previous-round LIFT hero
// card (bookings-list/_lift/NextAppointmentCard.tsx, the sibling round 2 folder), read in full:
// footer actions (Get directions, Manage disclosure with Reschedule/Cancel), the maps-link
// pattern and the manage-destination logic are KEPT unchanged (ROOT_CAUSES.md Part 3.3 "Stays":
// "the two side-by-side actions ... stay"). Placement source: _design-system/references/
// fresha--bookings-list.md, "Measured (iOS)" item 3 (photo area, salon name largest, date/time
// line, meta line, two actions at the card's bottom edge). Look source:
// _design-system/references/airbnb--trips.md, "Measured, populated Trips tab" item 4 (on-photo
// timing pill, top-left, neutral fill regardless of urgency) and
// _plans/R3_ONE_SYSTEM.md Candidate B "Photo radius and share" row.
//
// Depicts: photo-flush hero card, flush edge plus shadow (photoAware) -> ../../_kit Card.tsx
// (variant="photo", hasPhoto passed explicitly, candidate "b" branch)
// Depicts: on-photo relative-timing pill -> ../../_kit TimingPill.tsx (neutral white, geometry by
// ratio, never coloured by urgency)
// Depicts: date and time as one run -> ../../_kit DateLine.tsx
// Depicts: status badge -> ../../_kit StatusBadge.tsx (pastel treatment, unchanged default)
// Depicts: get-directions link -> app/[locale]/_components/salon/SalonLocation.tsx (the same
// google.com/maps/search link pattern the previous round's card already used)
// Depicts: manage disclosure Reschedule and Cancel -> app/[locale]/profile/bookings/page.tsx (the
// one real, live booking-management destination both buttons route to; confirmed by the previous
// round's own repair note that no per-booking manage route exists in this app)
// Depicts: meta separator spacer -> app/[locale]/_components/salon/MetaDot.tsx (the locked
// no-glyph gap, renders no dot character)
// Depicts: real price fact -> lib/format-currency.ts formatCurrency (called directly for this
// one card's demoted 12px/400 meta-tier price, see the fix-list note below)
//
// ROOT_CAUSES.md Part 3.3 fix-list items applied in this file:
//   1. Height. The photo drops from the previous round's 5/4 ratio (measured there at 286px
//      tall, named as "the only place that slack exists") to a fixed 160px. Card width at this
//      page's fixed 390px viewport is 358px (390 minus 2x16px page margin), so photo area alone
//      no longer forces the unit past the named 340px / 40%-of-fold ceiling; see this file's own
//      "measured" line below for the number this build actually rendered.
//   2. On-photo timing pill, top-left, relative copy only ("Today" / "Tomorrow" / "In N days" /
//      "In N weeks"), never an absolute time (the locked no-times-in-listings convention) and
//      never coloured by urgency (the trips reference's own point).
//   3. Salon name promoted to the shared 18px/500 ink step; date and time render through DateLine
//      as ONE 14px/500 ink run; every other fact on this card (duration, price, service, the
//      reminder line) is demoted to the 12px/400 grey Meta step, per this item's own words
//      ("everything else on the card stays 12px/400 grey"). This is a deliberate, named exception
//      to the kit's own bold Price primitive for THIS card only: BookingRowB.tsx below keeps the
//      standard bold Price unchanged, since this fix-list item names only the next-appointment
//      unit.
//   4. Reminder line, one run, 12px/400 grey, bell glyph, copy "Reminder 24 hours before" (this
//      item's own exact words), ported from the confirmation screen's real reminder fact (its
//      timing is the sms-reminders cron job's own real 24-hour window, not invented here).
//   6. The when-group (date and time, via DateLine) and the what-group (duration, price, service,
//      via Meta) now render as two separate lines rather than one five-span run; that line break
//      is itself the separator this item asks for. No dot glyph is added: MetaDot stays the
//      locked no-glyph gap (LOCKFILE A12), used only to space duration/price/service within the
//      what-group's own single line, not between the two groups.
//
// measured: filled in after this build's own Playwright pass (see BookingsListB.tsx's header for
// the run's numbers; this file does not restate them to avoid a second, driftable copy).
//
// system: b. Card reads photoAware from <KitProvider system="b"> (set by the parent tree); this
// component always passes hasPhoto={true}, since the photo slot here always renders a filled
// area (a real cover photo, or the sunken fallback tile), never an absent slot.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { MapPin, Settings2, Scissors, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { Card, StatusBadge, SecondaryButton, Meta, DateLine, TimingPill, TYPE_RAMP } from "../../_kit";
import type { LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";

interface Props {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  coverUrl: string | null;
}

// 390 viewport minus 2x16px page margin (SPACING.pageMargin), the same 358 constant this kit's
// own docs cite for every full-width card at this fixed mobile mockup width.
const PHOTO_WIDTH_PX = 358;
// PICK, no source (ROOT_CAUSES.md Part 3.3 item 1 names 340px/40%-of-fold as itself a PICK):
// derived from that target, not copied from a reference. See this file's header, fix item 1.
const PHOTO_HEIGHT_PX = 160;

function serviceName(booking: LoadedBooking, locale: string): string {
  if (!booking.service) return "";
  if (locale === "en") return booking.service.name_en || booking.service.name_de || "";
  return booking.service.name_de || booking.service.name_en || "";
}

function pdpHref(locale: string, booking: LoadedBooking): string | null {
  return booking.salon?.slug ? `/${locale}/salon/${booking.salon.slug}` : null;
}

function mapsHref(booking: LoadedBooking): string | null {
  if (!booking.salon?.address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.salon.address)}`;
}

/** A relative timing phrase for the on-photo pill. Real, computed from the booking's own
 * starts_at against the current moment, never invented. Matches the locked no-times-in-listings
 * convention (Heute/Morgen-style relative phrasing) and the trips reference's own examples
 * ("In 2 weeks", "In 3 months"). */
function relativeTiming(startsAt: Date, now: Date): string {
  const msPerDay = 86_400_000;
  const startDay = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startDay.getTime() - nowDay.getTime()) / msPerDay);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    return weeks === 1 ? "In 1 week" : `In ${weeks} weeks`; // plural-ok: dev-only mockup copy, hardcoded English per project mockup convention, not real product i18n
  }
  const months = Math.round(diffDays / 30);
  return months <= 1 ? "In 1 month" : `In ${months} months`;
}

const STATUS_LABEL: Record<LoadedBooking["status"], string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export function NextAppointmentCardB({ booking, locale, localeCode, coverUrl }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const manageHref = `/${locale}/profile/bookings`;

  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  const dateLabel = start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const timing = relativeTiming(start, new Date());
  const href = pdpHref(locale, booking);
  const directions = mapsHref(booking);
  const cover = coverUrl;
  const svc = serviceName(booking, locale);

  const enter = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const },
      };

  const CardInner = (
    <>
      <div className="relative w-full overflow-hidden" style={{ height: PHOTO_HEIGHT_PX }}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-s-bg-sunken">
            <Scissors className="h-8 w-8 text-s-ink-2" strokeWidth={1.5} aria-hidden />
            {booking.salon?.name?.trim()?.[0] && (
              <span className="font-heading text-[15px] font-normal text-s-ink-2" aria-hidden>
                {booking.salon.name.trim()[0]}
              </span>
            )}
          </div>
        )}
        <TimingPill label={timing} photoWidthPx={PHOTO_WIDTH_PX} />
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="min-w-0 truncate font-heading font-medium text-s-ink"
            style={{ fontSize: TYPE_RAMP.sectionHeading.size, lineHeight: TYPE_RAMP.sectionHeading.lineHeight }}
          >
            {booking.salon?.name || ""}
          </span>
          <StatusBadge status={booking.status} label={STATUS_LABEL[booking.status]} className="flex-none" />
        </div>

        <DateLine date={dateLabel} time={timeLabel} className="mt-1" />

        {/* The what-group: duration, price, service, one meta line, dot-spaced (no glyph, the
            locked MetaDot gap). Price is demoted to this 12px/400 grey step for this card only
            (fix item 3); formatCurrency is called directly rather than through the kit's bold
            Price primitive, which stays reserved for BookingRowB below. */}
        <Meta className="mt-1 flex min-w-0 items-center truncate">
          {duration ? <span>{duration} min</span> : null}
          {duration ? <MetaDot /> : null}
          <span className="tabular-nums">{formatCurrency(booking.price_paid, localeCode)}</span>
          {svc ? <MetaDot /> : null}
          {svc ? <span className="min-w-0 truncate">{svc}</span> : null}
        </Meta>

        <Meta className="mt-1 flex items-center gap-1">
          <Bell size={12} strokeWidth={1.9} aria-hidden />
          <span>Reminder 24 hours before</span>
        </Meta>
      </div>
    </>
  );

  return (
    <motion.div {...enter}>
      <Card variant="photo" hasPhoto>
        {href ? <Link href={href} className="block">{CardInner}</Link> : <div>{CardInner}</div>}

        <div className="flex items-center gap-2 px-3 pb-2 pt-1">
          {directions ? (
            <div className="flex-1">
              <SecondaryButton onClick={() => window.open(directions, "_blank", "noopener,noreferrer")}>
                <MapPin size={16} strokeWidth={1.9} aria-hidden />
                Get directions
              </SecondaryButton>
            </div>
          ) : (
            <span className="flex-1" />
          )}
          <div className="flex-1">
            <SecondaryButton onClick={() => setManageOpen((v) => !v)}>
              <Settings2 size={16} strokeWidth={1.9} aria-hidden />
              Manage
            </SecondaryButton>
          </div>
        </div>

        <AnimatePresence>
          {manageOpen && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: -8, scale: 0.98 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 1, 1] as const }}
              className="flex flex-col gap-1 px-3 pb-3"
            >
              <SecondaryButton onClick={() => router.push(manageHref)}>Reschedule</SecondaryButton>
              <SecondaryButton onClick={() => router.push(manageHref)}>Cancel</SecondaryButton>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
