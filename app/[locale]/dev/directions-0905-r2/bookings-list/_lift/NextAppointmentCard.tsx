"use client";

// Exists-check: `npm run exists bookings-list` -> round-1's UpcomingCard (inline in
// BookingsListDirectionA.tsx), read below as the compactness baseline, never imported (its
// anatomy is round 1's, this is round 2's own compact shape per the task brief's three
// screen deltas). `npm run exists kit` -> the round-2 _kit module, imported below.
//
// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx
// (its UpcomingCard function, the round-1 baseline this file is measured against and comes in
// smaller than), app/[locale]/_components/salon/SalonLocation.tsx (the google.com/maps/search
// Get-directions link pattern, same one round-1 used), ../../_kit/* (Card, StatusBadge,
// SecondaryButton, SectionTitle-adjacent Meta/Price primitives).
//
// Depicts: photo-flush lifted card, footer actions -> ../../_kit/Card.tsx (variant="photo", LIFT delta: shadow, no border, radius 16) composed with ../../_kit/SecondaryButton.tsx (Get directions, Manage) inside its own footer div.
// Depicts: get-directions link -> app/[locale]/_components/salon/SalonLocation.tsx (the same google.com/maps/search?api=1&query= pattern).
// Depicts: manage disclosure (Reschedule / Cancel) -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx (its own inline Reschedule/Cancel disclosure, same two actions, same trigger label).
//
// MEASURED, round 1 vs round 2 (Playwright, 390x844, dpr 3, live dev server, same seed
// customer's own real next booking both times, not estimated):
// round 1's UpcomingCard (`/en/dev/directions-0905/bookings-list?v=a`, first `article` under
// "Upcoming"): 483.39px tall.
// This card (`/en/dev/directions-0905-r2/bookings-list?s=lift`, the `[data-kit-card-variant=
// "photo"]` element): 439.97px tall, 43.4px (9.0%) shorter, entirely inside the content block
// (128px -> 111.8px) and the footer (69px -> 66px); the 5/4 photo itself is byte-identical
// (286.39px both times, LOCKED per A7).
//
// The three-way saving vs round 1, all inside the content/footer (the 5/4 photo itself is
// LOCKED per R2_LOOK_SYSTEMS.md A7 and is identical in both): (1) the status badge sits INLINE
// with the salon name instead of adding its own row; (2) date, time, duration and service
// collapse from three separate rows (round 1: an icon+date/time row, then a service+duration
// row, then price) into ONE combined meta line, Fresha's own anatomy per
// fresha--bookings-list.md Measured #3 ("duration, price, service name, dot-separated" on a
// single meta line); (3) content padding drops p-4 (16) to p-3 (12) and the footer drops its
// border-t + p-3 for a plain pt-1/pb-2 with no hairline (LIFT's own rule: nothing in this
// system carries a hairline).
//
// system: LIFT. Card variant="photo" reads its border/shadow delta from <KitProvider
// system="lift"> in the parent (BookingsListLift.tsx); this component does not set system
// itself.

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { MapPin, Settings2, Scissors } from "lucide-react";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { Card, StatusBadge, SecondaryButton, Meta, Price } from "../../_kit";
import type { LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";

interface Props {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  /** Resolved server-side by the parent via getAlternateCoverPhoto (see BookingsListLift.tsx):
   * the salon's own cover_photo_url, UNLESS it is the banned greyscale seed image
   * (photo-1560066984, R2_LOOK_SYSTEMS.md A8 / CONFLICT C10), in which case a different real
   * photo of the SAME salon from its own gallery_urls. Never a hardcoded src. */
  coverUrl: string | null;
}

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

const STATUS_LABEL: Record<LoadedBooking["status"], string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export function NextAppointmentCard({ booking, locale, localeCode, coverUrl }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  const dateLabel = start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
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
      <div className="relative aspect-[5/4] w-full overflow-hidden">
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
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[14px] font-normal text-s-ink">
            {booking.salon?.name || ""}
          </span>
          <StatusBadge status={booking.status} label={STATUS_LABEL[booking.status]} className="flex-none" />
        </div>

        {/* One combined meta line (date, time, duration, service), Fresha's own anatomy
            (fresha--bookings-list.md Measured #3: duration/price/service dot-separated on a
            single meta line under the date/time line) collapsed to a single row for the
            compactness delta the task brief asks for. Truncates as a whole; the salon name
            above it already carries its own truncate, so nothing load-bearing is hidden. */}
        <Meta className="mt-1 flex min-w-0 items-center truncate">
          <span>{dateLabel}</span>
          <MetaDot />
          <span>{timeLabel}</span>
          {duration ? (
            <>
              <MetaDot />
              <span>{duration} min</span>
            </>
          ) : null}
          {svc ? (
            <>
              <MetaDot />
              <span className="min-w-0 truncate">{svc}</span>
            </>
          ) : null}
        </Meta>

        <Price amount={booking.price_paid} locale={localeCode} className="mt-1 block" />
      </div>
    </>
  );

  return (
    <motion.div {...enter}>
      <Card variant="photo">
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
              <button
                type="button"
                className="w-full rounded-[12px] px-3 py-2.5 text-left text-[14px] font-normal text-s-ink hover:bg-s-bg-sunken"
              >
                Reschedule
              </button>
              <button
                type="button"
                className="w-full rounded-[12px] px-3 py-2.5 text-left text-[14px] font-normal text-s-error hover:bg-s-error/10"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
