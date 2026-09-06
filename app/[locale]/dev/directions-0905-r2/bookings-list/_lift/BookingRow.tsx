"use client";

// Exists-check: `npm run exists bookings-list` -> round-1's PastRow (inline in
// BookingsListDirectionA.tsx), read below as the anatomy baseline (48px thumbnail + name +
// meta line), never imported directly (this file adds the kit StatusBadge and the LIFT card
// shell round 1's PastRow did not have, per the task brief's third screen delta). `npm run
// exists kit` -> the round-2 _kit module, imported below.
//
// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx
// (its PastRow function: 48px square photo thumbnail, salon name, date + service meta line,
// "Book again" text link), ../../_kit/* (Card, StatusBadge, TextLink, Meta, Price).
//
// Depicts: 48px-thumbnail lifted row -> NET-NEW: no existing row component pairs a 48px square thumbnail with a shadowed no-border card, specified in _plans/R2_LOOK_SYSTEMS.md Part B SYSTEM 1.
// Depicts: status badge per row -> ../../_kit/StatusBadge.tsx (the kit's own transcription of components-legacy/booking/BookingCard.tsx:84-90,138).
// Depicts: rebook text link -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx (its own "Book again" text-link action, same trigger, same s-accent recipe here via ../../_kit/TextLink.tsx).
//
// Screen delta honoured here: no Get-directions/Manage buttons on this row (those render
// ONLY on NextAppointmentCard.tsx, per the task brief's first screen delta), and every row
// gets a StatusBadge regardless of its status (confirmed/completed/cancelled/no_show), per the
// third screen delta, so a cancelled or completed row reads differently from the confirmed
// next appointment by badge colour + icon alone.
//
// The thumbnail's left corners are matched to the card's own radius (RADIUS.entityCardPx, a
// kit token, never a literal) and it sits flush against the card's left/top/bottom edges (no
// padding on that side), so the card's own overflow-hidden clips it into the flush-photo-edge
// shape LOCKFILE §17.2 case (b) describes, the same mechanism the next-appointment card gets
// from its full-width flush photo. No new radius value is invented for it.
//
// "Book again" routes to the real salon PDP (pdpHref), the same express-rebook entry point
// round-1's PastRow and the real BookingsList.tsx both resolve to; not a dead onClick.
//
// system: LIFT. Card variant="entity" reads its border/shadow delta from <KitProvider
// system="lift"> in the parent (BookingsListLift.tsx); this component does not set system
// itself.

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

const STATUS_LABEL: Record<LoadedBooking["status"], string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

export function BookingRow({ booking, locale, localeCode, coverUrl }: Props) {
  const start = new Date(booking.starts_at);
  const dateLabel = start.toLocaleDateString(localeCode, { day: "2-digit", month: "short", year: "numeric" });
  const href = pdpHref(locale, booking);
  const cover = coverUrl;
  const svc = serviceName(booking, locale);

  return (
    <Card variant="entity">
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
