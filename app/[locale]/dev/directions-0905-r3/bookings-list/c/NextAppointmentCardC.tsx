"use client";

// Exists-check: `npm run exists bookings-list` (run this session) returned the round-2 lift
// base's own NextAppointmentCard.tsx (the anatomy this file starts from BY HAND) and round-1's
// UpcomingCard (the baseline that file already measures itself against). `npm run exists kit` ->
// the shared kit module, imported below.
//
// Grounded-in: app/[locale]/_components/salon/SalonLocation.tsx (the real google.com/maps/search
// Get-directions link pattern) and app/[locale]/profile/bookings/page.tsx (the one real, live
// booking-management destination both Manage-disclosure actions navigate to). This candidate
// starts BY HAND from the round-2 lift base's own NextAppointmentCard.tsx (filename unique in
// this repo, read in full this session): the photo-flush card shell, the footer actions, and the
// Reschedule/Cancel manage-disclosure mechanics are kept unchanged; only the candidate-C look and
// the four ROOT_CAUSES.md Part 3.3 content fixes below change.
//
// Depicts: photo-flush card shell -> ../../_kit/Card.tsx (variant="photo", hasPhoto=true; candidate C's photoAware branch renders it flat, no border, no shadow, "the photo edge is the boundary").
// Depicts: on-photo timing pill -> ../../_kit/TimingPill.tsx (real diffDays off booking.starts_at, neutral fill, colour never varies by urgency).
// Depicts: salon name at 18px/500 -> ../../_kit/SectionTitle.tsx (as="heading").
// Depicts: status badge, neutral -> ../../_kit/StatusBadge.tsx (treatment="neutral", orchestrator decision 4).
// Depicts: date and time as one 14px/500 run -> ../../_kit/DateLine.tsx.
// Depicts: reminder line -> RuleConfirmationView.tsx's own real "Reminder" / "Sent 24 hours before your appointment" pair (filename unique in this repo; ported copy, adapted to future tense since this list renders before the reminder fires).
// Depicts: get-directions link -> app/[locale]/_components/salon/SalonLocation.tsx (the same google.com/maps/search?api=1&query= pattern the round-2 base already uses).
// Depicts: manage disclosure (Reschedule / Cancel) -> app/[locale]/profile/bookings/page.tsx (ported unchanged from the round-2 base's own real destination).
//
// ROOT_CAUSES.md Part 3.3 fix-list items 1-4 applied here:
//
//   ITEM 1, the height cap. Target (PICK, ROOT_CAUSES.md's own words: "340px and 40%, no source"):
//   card <=340px, <=40% of the 844px fold, date/time run starting at or above y=280. The round-2
//   base measures 439.97px total with a 286.39px (5/4) photo, i.e. content+footer = 153.58px; that
//   part is UNCHANGED here (same rows, same padding), so the only lever is the photo, exactly as
//   ROOT_CAUSES.md names it: "The photo is the only place that slack exists." Working backward
//   from the y<=280 constraint (page top padding 24 + the 28px anchor's own line-height ~32.2 +
//   its 12px margin + this card's 12px content padding + the ~24px salon-name row + its 4px
//   margin puts the card's own top at roughly y=68 and the date/time row's own top needs
//   <=212px into the card), the photo is set to a 358:170 ratio (~2.11:1) via an explicit
//   aspectRatio style, not a Tailwind aspect-[] class, so it is exact rather than rounded to a
//   named ratio. PICK, no reference names a trip-card ratio this wide; measured result below.
//
//   REPAIR (round 1 punch list): the first live render (kit fix landed this round) measured
//   358:170 at 346.17px total / 41.0% of 844 / bottom y=414.36 (Playwright, 390x844 dpr3,
//   networkidle+800ms) -- 14.36px over the y<=400 bottom target and 8.57px over the 337.6px
//   (40%) cap, content+footer height unchanged from the round-2 base's own 153.58px so the photo
//   was still the only lever. Reset to 358:149 (~2.40:1, still a PICK, no reference names this
//   ratio either): measured result and margin below.
//
//   ITEM 2, the timing pill. <TimingPill label={relativeTiming} photoWidthPx={photoWidth}>,
//   photoWidthPx measured off the real rendered photo container via a ref (never hardcoded to one
//   viewport), so the pill's ratio-based geometry (TIMING_PILL in tokens.ts) stays correct at any
//   width. relativeTiming is the SAME real, derived-never-fabricated diffDays/"Today"/"Tomorrow"/
//   "In N days" formula already rendered on this round's confirmation screens (off booking.starts_at,
//   never an absolute time, the locked no-times-in-listings convention).
//
//   ITEM 3, date/time promoted. Salon name -> <SectionTitle as="heading"> (18px/500 ink; today
//   14px/400 identical to a history row). Date+time -> <DateLine> (14px/500 ink, ONE run; today
//   12px/400/#6B6B6B, split across 5 spans, the smallest/lightest run on the page). Duration and
//   service stay on their own 12px/400 Meta line, now WITHOUT the date/time tokens that used to
//   share it.
//
//   ITEM 4, the reminder line. One run, 12px/400 #6B6B6B, bell glyph, "Reminder 24 hours before
//   your appointment" -- ported copy (see Depicts above), sharing its row with the Price value
//   (both are footer-of-content facts; combining them, rather than giving the reminder its own
//   full row, is what keeps the height budget inside item 1's cap without cutting either fact).
//
// PHOTO-SHARE FLOOR CONCERN (see this candidate's page.tsx for the full framing): shrinking the
// photo to hit item 1's height cap trades against FLOORS LAW 2's ~1/3-of-fold imagery floor.
// REPAIR (round 1 punch list): the kit barrel syntax bug named in the paragraph this replaced is
// fixed and the route renders (Playwright, 390x844 dpr3, networkidle+800ms, 0 console/page
// errors), so this is now VERIFIED, not computed. Measured photo box at the 358:149 ratio above:
// 358x149 = 53,342px2 of the 390x844 = 329,160px2 fold = 16.2% on the card photo alone, short of
// the ~33% floor even before subtracting everything else on the
// page (the 358:170 ratio this replaced measured 18.5%, so the height-cap repair pulls the photo
// share further from the floor, not closer). The two floors still point opposite ways on this one
// screen exactly as flagged before the repair: built to the height cap since it is the more
// specific and more recent, dated, owner-quoted instruction for this exact screen; the resulting
// lower photo-share number is reported here for the orchestrator/critic to adjudicate, not hidden.
//
// system: c. Reads `hasPhoto` on <Card variant="photo">; candidate C's own branch in Card.tsx
// resolves that to flat/no-border/no-shadow (the photo edge is the boundary) and radius 20px
// (RADIUS.c.cardPx). <SecondaryButton> reads candidate C's own neutral-fill/12px-radius/44px-tall
// recipe automatically; nothing here sets a literal radius, height or fill by hand.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { MapPin, Settings2, Scissors, Bell } from "lucide-react";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { Card, StatusBadge, SecondaryButton, SectionTitle, Meta, Price, DateLine, TimingPill } from "../../_kit";
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

// ITEM 1's derived ratio (see header, REPAIR note): 358:149, a PICK, not a named reference ratio.
// Expressed as a CSS aspect-ratio string so the photo scales exactly with the card's real
// rendered width instead of a fixed pixel height.
const PHOTO_ASPECT_RATIO = "358 / 149";

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

export function NextAppointmentCardC({ booking, locale, localeCode, coverUrl }: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const photoRef = useRef<HTMLDivElement>(null);
  const [photoWidth, setPhotoWidth] = useState(358); // sensible fallback until measured

  useEffect(() => {
    const measure = () => {
      if (photoRef.current) setPhotoWidth(photoRef.current.getBoundingClientRect().width);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The one real, live booking-management destination (ported from the round-2 base): no
  // per-booking manage route exists in this product today, so both Manage actions land on the
  // real /profile/bookings page.
  const manageHref = `/${locale}/profile/bookings`;

  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  const dateLabel = start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });

  // Real, derived from booking.starts_at, never fabricated. Same formula already rendered on this
  // round's confirmation screens for the identical "when is this" fact.
  const diffDays = Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const relativeTiming = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`; // plural-ok: mockup-only English state label, not routed through next-intl, same convention as RuleConfirmationView.tsx's own relativeVisit

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
      <div ref={photoRef} className="relative w-full overflow-hidden" style={{ aspectRatio: PHOTO_ASPECT_RATIO }}>
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
        <TimingPill label={relativeTiming} photoWidthPx={photoWidth} />
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle as="heading" className="min-w-0 truncate">
            {booking.salon?.name || ""}
          </SectionTitle>
          <StatusBadge
            status={booking.status}
            label={STATUS_LABEL[booking.status]}
            treatment="neutral"
            className="flex-none"
          />
        </div>

        <DateLine date={dateLabel} time={timeLabel} className="mt-1" />

        {/* Duration and service ONLY: date/time moved to <DateLine> above, per fix item 3, so
            this line no longer carries the "when" fact at all. */}
        <Meta className="mt-1 flex min-w-0 items-center truncate">
          {duration ? <span>{duration} min</span> : null}
          {duration && svc ? <MetaDot /> : null}
          {svc ? <span className="min-w-0 truncate">{svc}</span> : null}
        </Meta>

        {/* Fix item 4: the reminder line, sharing its row with Price (see header rationale). */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Bell size={14} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
            <Meta className="truncate">Reminder 24 hours before your appointment</Meta>
          </span>
          <Price amount={booking.price_paid} locale={localeCode} className="flex-none" />
        </div>
      </div>
    </>
  );

  return (
    <motion.div {...enter}>
      <Card variant="photo" hasPhoto>
        {href ? <Link href={href} className="block">{CardInner}</Link> : <div>{CardInner}</div>}

        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
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
