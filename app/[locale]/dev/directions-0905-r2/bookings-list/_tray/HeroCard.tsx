"use client";

// Grounded-in: app/[locale]/dev/directions-0905-r2/bookings-list/_lift/NextAppointmentCard.tsx
// (the split PATTERN this file reuses: a Server Component parent resolves the cover photo and
// hands it down as a prop to an interactive "use client" leaf. Not reused as code: TRAY's own
// hero anatomy, Get directions + Manage buttons with an inline disclosure, is unchanged from
// this file's own pre-repair version, extracted verbatim out of ../BookingsListTray.tsx.)
//
// Exists-check: `npm run exists "next appointment card"` (run this repair session) returns one
// hit, LIFT's own NextAppointmentCard.tsx (app/[locale]/dev/directions-0905-r2/bookings-list/
// _lift/NextAppointmentCard.tsx). Reused as PATTERN only, never as code: that file solves the
// identical "an interactive card needs a resolved cover photo from its Server Component parent"
// problem for the LIFT system; this file is TRAY's own version of the same split, with TRAY's
// own hero anatomy (Get directions + Manage buttons, inline disclosure), unchanged from the
// pre-repair BookingsListTray.tsx this function was extracted out of verbatim.
//
// Depicts: hero-card anatomy (photo, name+badge, meta line, service, price, button row, disclosure) -> extracted verbatim from app/[locale]/dev/directions-0905-r2/bookings-list/_tray/BookingsListTray.tsx's own pre-repair HeroCard function (see that file's "Repair" comment, fix 3); every field is a real LoadedBooking column from app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts
// Depicts: press-motion entrance/exit on the Manage disclosure -> app/[locale]/dev/directions-0905-r2/_kit/tokens.ts MOTION.sheetOpen / MOTION.sheetClose (kit tokens, imported below, unchanged from the pre-repair file)
//
// Repair (2026-09-06), why this file exists: BookingsListTray.tsx used to own this function
// directly and was itself "use client" end to end, which meant it could never `await
// getAlternateCoverPhoto(...)` before rendering (critic open item 3: the hero photo rendered
// the salon's real but banned greyscale seed image, photo-1560066984, directly off
// `booking.salon.cover_photo_url`). This function owns the only two things that actually need a
// client boundary on this screen, the Manage-disclosure `useState` and the framer-motion
// entrance/exit, so it moved here unchanged, and the parent became an async Server Component
// that resolves `coverUrl` once and passes it down as a prop (below), never reading
// `booking.salon.cover_photo_url` itself again.
//
// REPAIR 2 (2026-09-06), open item 1: the Manage disclosure's Reschedule/Cancel were bare
// <button> elements with no onClick, a dead click inherited from round 1. Grepped the real
// destination: components-legacy/booking/BookingCard.tsx's own Reschedule/Cancel are
// onReschedule/onCancel callback props, not links; its caller, components-legacy/booking/
// BookingsList.tsx, opens an in-place sheet (RescheduleSheet / CancelBookingSheet) on the SAME
// page, never a per-booking URL, so no "bookings/<id>/manage"-shaped route exists (confirmed:
// `find app/[locale]/bookings/[id]` returns only upcharge/report/refund; `grep useSearchParams
// .../BookingsList.tsx` returns nothing, so there is no id query param either). The one real,
// live destination a signed-in customer reaches to manage a booking is
// `/${locale}/profile/bookings` (app/[locale]/profile/bookings/page.tsx, which renders that
// exact BookingsList), the same route the kit's own README.md models this action against. Both
// buttons now navigate there via the kit SecondaryButton's onClick + router.push, the exact
// pattern this round already uses for a SecondaryButton acting as a link with no href prop on
// the component itself (../../empty-states/_lift/EmptyUnit.tsx:126, `_rule/
// EmptyStatesRule.tsx:213`, `_tray/EmptyStatesTrayView.tsx:301`), so no dead affordance
// remains. Not booking-id-scoped, because nothing on the real destination reads one. The
// Cancel button's distinguishing red text (previously `style={{ color: COLOR.error.DEFAULT }}`)
// is dropped along with it: it no longer performs the cancellation itself, only navigates to
// where it can be done, so the neutral SecondaryButton treatment (matching Reschedule) is the
// semantically correct one, not a downgrade; `COLOR` is no longer imported below since that was
// its only use in this file.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { MapPin, Settings2, Scissors } from "lucide-react";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { Card, Meta, Price, StatusBadge, SecondaryButton, MOTION, type BookingStatus } from "../../_kit";
import type { LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

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

// REPAIR measured (2026-09-06), Playwright, 390x844, dpr 3, live dev server, fresh load,
// /en/dev/directions-0905-r2/bookings-list?s=tray: 0 console errors. Both Reschedule and
// Cancel now render as the kit SecondaryButton: 326x50px, border-radius 99px, border 1px solid
// rgb(228,228,231) (#E4E4E7, the locked hairline), box-shadow none, font 14px/500 ink
// (rgb(10,10,10)) on white. Clicking either fires router.push to `/en/profile/bookings` and the
// browser's URL genuinely changes (confirmed live), so neither is a dead click.

const GLIDE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function HeroCard({
  booking,
  locale,
  localeCode,
  coverUrl,
}: {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  /** Resolved server-side by the parent (BookingsListTray.tsx, repair fix 3) via
   * getAlternateCoverPhoto: the salon's own cover_photo_url, UNLESS it is the banned greyscale
   * seed image (photo-1560066984, R2_LOOK_SYSTEMS.md A8 / CONFLICT C10), in which case a
   * different real photo of the SAME salon from its own gallery_urls. Never a hardcoded src. */
  coverUrl: string | null;
}) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  // The one real, live booking-management destination (see REPAIR 2 note above): no
  // per-booking route exists, so both actions land on the real /profile/bookings page.
  const manageHref = `/${locale}/profile/bookings`;
  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  const dateLabel = start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const href = pdpHref(locale, booking);
  const directions = mapsHref(booking);
  const cover = coverUrl;
  const svc = serviceName(booking, locale);

  const cardInner = (
    <>
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
        {cover ? (
          <Image src={cover} alt="" fill sizes="(max-width: 640px) 100vw, 480px" className="object-cover" />
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
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[14px] font-semibold text-s-ink">{booking.salon?.name || ""}</h3>
          <StatusBadge status={booking.status} label={STATUS_LABEL[booking.status]} className="flex-none" />
        </div>
        <div className="mt-1">
          <Meta>
            {dateLabel}
            <MetaDot />
            {timeLabel}
            {duration ? (
              <>
                <MetaDot />
                {duration} min.
              </>
            ) : null}
          </Meta>
        </div>
        {svc ? <p className="mt-1 truncate text-[14px] font-normal text-s-ink">{svc}</p> : null}
        <div className="mt-1">
          <Price amount={booking.price_paid} locale={localeCode} />
        </div>
      </div>
    </>
  );

  return (
    <motion.article
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 12, scale: 0.98 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: MOTION.sheetOpen.durationMs / 1000, ease: GLIDE }}
    >
      <Card variant="photo">
        {href ? (
          <Link href={href} className="block">
            {cardInner}
          </Link>
        ) : (
          <div>{cardInner}</div>
        )}

        <div className="flex items-center gap-2 px-4 pb-4 pt-1">
          {directions ? (
            <div className="flex-1">
              <SecondaryButton onClick={() => window.open(directions, "_blank", "noopener,noreferrer")}>
                <MapPin size={16} strokeWidth={1.9} aria-hidden />
                Get directions
              </SecondaryButton>
            </div>
          ) : (
            <div className="flex-1" />
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
              transition={{ duration: MOTION.sheetClose.durationMs / 1000, ease: GLIDE }}
              className="flex flex-col gap-1 px-4 pb-4"
            >
              <SecondaryButton onClick={() => router.push(manageHref)}>Reschedule</SecondaryButton>
              <SecondaryButton onClick={() => router.push(manageHref)}>Cancel</SecondaryButton>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.article>
  );
}
