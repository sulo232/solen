"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a booking row. `npm run exists bookings-list` (run earlier this session) shows the
// previous round's own compact row, read in full below as the base this file starts from by
// hand.
//
// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (the real
// loader behind every field this row renders) and this screen's own previous-round LIFT row
// (bookings-list/_lift/BookingRow.tsx, the sibling round 2 folder), read in full and kept
// unchanged in anatomy and copy: 48px thumbnail flush to the card's own radius, salon name plus
// status badge, one date/service meta line, price, a "Book again" text link. ROOT_CAUSES.md Part
// 3.3's fix list names only the next-appointment unit (see NextAppointmentCardB.tsx); nothing in
// it asks this row to change, so this file's only real delta from its previous-round source is
// the explicit `bordered` prop this row's card-edge case needs (see "system" below).
//
// Depicts: 48px-thumbnail row, hairline card edge -> ../../_kit Card.tsx (variant="entity",
// `bordered` passed explicitly instead of the photoAware `hasPhoto` branch: this row's cover is a
// 48x48 corner thumbnail, never a flush edge along the card's other three sides, so candidate b's
// hasPhoto->shadow branch left every "More bookings" row with a 4%-whisper shadow on plain white
// and no perceivable boundary, the exact configuration FLOORS LAW 4 names invalid by text. `Card`
// already ships a documented per-instance override for this (LOCKFILE §17.2 edge case c, "a
// photo-less entity card on white keeps the hairline, drops the shadow"); using it here regardless
// of hasPhoto, since a corner thumbnail never satisfies the "flush photo edge" option either.
// Depicts: status badge -> ../../_kit StatusBadge.tsx (pastel treatment, unchanged default)
// Depicts: bold price -> ../../_kit Price.tsx (unchanged; this row keeps the standard bold Price,
// the fix-list's demotion to 12px/400 grey applies only to the next-appointment card)
// Depicts: rebook text link -> app/[locale]/_components/salon/SalonLocation.tsx (this project's
// own text-s-accent link recipe; the same one Price.tsx's sibling TextLink.tsx composes)
// Depicts: real cover thumbnail -> app/[locale]/dev/directions-0905/bookings-list/_va/
// loadBookingsA.ts (the real salon.cover_photo_url field, swapped through ./coverPhoto.ts when
// the seed photo is the banned greyscale one)
//
// measured: see BookingsListB.tsx's header for this build's full run; this row's own type sizes
// (14px name, 14px Price, 12px Meta) are unchanged from the previous round.
//
// system: b. Repair pass 2026-09-06: this row no longer reads candidate b's photoAware branch
// (hasPhoto->shadow) at all; it passes `bordered` so `Card` always renders the locked hairline
// (1px solid #E4E4E7) and never a shadow, matching FLOORS LAW 4's option (c) unconditionally,
// since the 48x48 corner thumbnail is never a flush photo edge either with or without a cover.

import Image from "next/image";
import Link from "next/link";
import { Scissors } from "lucide-react";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { Card, StatusBadge, TextLink, Meta, Price, RADIUS } from "../../_kit";
import type { LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";

interface Props {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
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

const STATUS_LABEL: Record<LoadedBooking["status"], string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export function BookingRowB({ booking, locale, localeCode, coverUrl }: Props) {
  const start = new Date(booking.starts_at);
  const dateLabel = start.toLocaleDateString(localeCode, { day: "2-digit", month: "short", year: "numeric" });
  const href = pdpHref(locale, booking);
  const cover = coverUrl;
  const svc = serviceName(booking, locale);

  return (
    <Card variant="entity" bordered>
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 flex-none overflow-hidden bg-s-bg-sunken"
          style={{ borderTopLeftRadius: RADIUS.entityCardPx, borderBottomLeftRadius: RADIUS.entityCardPx }}
        >
          {cover ? (
            <Image src={cover} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Scissors className="h-5 w-5 text-s-ink-2" strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-3 pr-3">
          <div className="flex items-center justify-between gap-2">
            {href ? (
              <Link href={href} className="min-w-0 truncate text-[14px] font-normal text-s-ink">
                {booking.salon?.name || ""}
              </Link>
            ) : (
              <span className="min-w-0 truncate text-[14px] font-normal text-s-ink">
                {booking.salon?.name || ""}
              </span>
            )}
            <StatusBadge status={booking.status} label={STATUS_LABEL[booking.status]} className="flex-none" />
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <Meta className="flex min-w-0 items-center truncate">
              <span>{dateLabel}</span>
              {svc ? (
                <>
                  <MetaDot />
                  <span className="min-w-0 truncate">{svc}</span>
                </>
              ) : null}
            </Meta>
            <Price amount={booking.price_paid} locale={localeCode} className="flex-none" />
          </div>
        </div>
      </div>

      <div className="flex justify-end px-3 pb-3">
        <TextLink href={href ?? undefined}>Book again</TextLink>
      </div>
    </Card>
  );
}
