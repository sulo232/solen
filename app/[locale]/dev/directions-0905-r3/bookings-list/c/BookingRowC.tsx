"use client";

// Exists-check: `npm run exists bookings-list` (run this session) returned the round-2 lift
// base's own BookingRow.tsx (the anatomy this file starts from BY HAND) and round-1's PastRow
// (the baseline that file already measures itself against: a 48px square photo thumbnail, salon
// name, date + service meta line, "Book again" text link). `npm run exists kit` -> the shared kit
// module, imported below.
//
// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (the real
// booking shape this row renders). This candidate starts BY HAND from the round-2 lift base's own
// BookingRow.tsx (filename unique in this repo, read in full this session): the 48px thumbnail,
// the "Book again" rebook link (routing to the real salon PDP, not a dead click), and the "no
// Get-directions/Manage on this row" screen delta are all kept unchanged; only the candidate-C
// look changes (Card hasPhoto -> flat by default, StatusBadge neutral).
//
// REPAIR (round 1 punch list, FLOORS LAW 4): candidate C's own photoAware branch (`hasPhoto` true
// -> flat, no border, no shadow) is written for a full-bleed photo card, where the photo's own
// flush edge is the boundary (FLOORS LAW 4 option b). This row's "photo" is only a 48px square
// thumbnail on the left; the remaining ~300px of the row sits on white with zero boundary, which
// is exactly the invalid configuration FLOORS LAW 4 names ("a white card with only a 4% shadow on
// white is invalid" -- here there was not even the 4% shadow). Card.tsx's own `bordered` prop is
// documented for precisely this case (LOCKFILE §17.2 edge case c: "a photo-less[-edge] entity card
// on white keeps the hairline, drops the shadow"), and it is a caller-side override, not a kit
// edit: passing `bordered` here does not touch ../../_kit/Card.tsx.
//
// Depicts: 48px-thumbnail row, hairline -> ../../_kit/Card.tsx (variant="entity", hasPhoto, bordered; the `bordered` override forces the locked 1px `#E4E4E7` hairline and shadow off, per that file's own documented per-instance exception, reproducing fresha--bookings-list.md item 5's "compact, no card shell" placement while still giving the row a perceivable edge against white).
// Depicts: status badge, neutral -> ../../_kit/StatusBadge.tsx (treatment="neutral", orchestrator decision 4).
// Depicts: rebook text link -> ../../_kit/TextLink.tsx (blue small-clickable-text recipe, routes to the real salon PDP).
//
// Screen delta honoured here (ROOT_CAUSES.md 3.3 "Stays", unchanged from round 2): no
// Get-directions/Manage buttons on this row (those render ONLY on NextAppointmentCardC.tsx), and
// every row gets a StatusBadge regardless of its status, so a cancelled or completed row reads
// differently from the confirmed next appointment by badge icon alone (neutral fill on both, per
// candidate C's own "colour never encodes state" row).
//
// The thumbnail's left corners are matched to the card's own radius (RADIUS.entityCardPx under
// lift/rule/a/b; under candidate C the Card component itself resolves radius to RADIUS.c.cardPx,
// 20px, so this row imports RADIUS from the kit rather than hardcoding either literal).
//
// system: c. Card variant="entity" hasPhoto reads candidate C's photoAware branch from
// <KitProvider system="c"> in the parent page.tsx; `bordered` (added in the repair pass above)
// overrides that branch's flat result for this row only; this component does not set system itself.

import Image from "next/image";
import Link from "next/link";
import { Scissors } from "lucide-react";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { Card, StatusBadge, TextLink, Meta, Price, RADIUS, useSystem } from "../../_kit";
import type { LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";

interface Props {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  /** Resolved server-side by the parent page.tsx: the salon's own cover_photo_url, unless it is
   * the banned low-saturation seed image, in which case a different real photo of the SAME salon
   * from its own gallery_urls. Never a hardcoded src. */
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

export function BookingRowC({ booking, locale, localeCode, coverUrl }: Props) {
  const system = useSystem();
  const isCandidateC = system.key === "c";
  const thumbnailRadius = isCandidateC ? RADIUS.c.cardPx : RADIUS.entityCardPx;

  const start = new Date(booking.starts_at);
  const dateLabel = start.toLocaleDateString(localeCode, { day: "2-digit", month: "short", year: "numeric" });
  const href = pdpHref(locale, booking);
  const cover = coverUrl;
  const svc = serviceName(booking, locale);

  return (
    <Card variant="entity" hasPhoto bordered>
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 flex-none overflow-hidden bg-s-bg-sunken"
          style={{ borderTopLeftRadius: thumbnailRadius, borderBottomLeftRadius: thumbnailRadius }}
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
            <StatusBadge
              status={booking.status}
              label={STATUS_LABEL[booking.status]}
              treatment="neutral"
              className="flex-none"
            />
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
