"use client";

// Exists-check: `npm run exists bookings-list` (repair pass) returns BookingsListRule.tsx (the
// only caller) and the round-1 `_va` disclosure this transcribes; no separate action/disclosure
// component existed for this screen before this file. Split out of BookingsListRule.tsx during
// the repair pass so that file can become an async Server Component (open item 2 needs a
// server-side getAlternateCoverPhoto lookup, which a "use client" component cannot call): this
// is the ONLY interactive piece of the next-appointment row, so it is the only piece that still
// needs "use client" and React state.
//
// Depicts: Get directions action -> components-legacy/booking/BookingConfirmation.tsx (the real
// google.com/maps/search pattern; unchanged from the pre-repair BookingsListRule.tsx).
// Depicts: Manage disclosure (Reschedule / Cancel) -> components-legacy/booking/BookingCard.tsx
// (the existing overflow menu, same two actions, same open/close motion).
//
// REPAIR (2026-09-06), open item 1: Reschedule/Cancel were bare <button> elements with no
// onClick, a dead click. Grepped the real destination: components-legacy/booking/
// BookingCard.tsx's own Reschedule/Cancel are onReschedule/onCancel callback props, not links;
// its caller, components-legacy/booking/BookingsList.tsx, opens an in-place sheet
// (RescheduleSheet / CancelBookingSheet) on the SAME page, never a per-booking URL, so no
// "bookings/<id>/manage"-shaped route exists (confirmed: `find app/[locale]/bookings/[id]`
// returns only upcharge/report/refund; `grep useSearchParams .../BookingsList.tsx` returns
// nothing, so there is no id query param either). The one real, live destination a signed-in
// customer reaches to manage a booking is `/${locale}/profile/bookings`
// (app/[locale]/profile/bookings/page.tsx, which renders that exact BookingsList), the same
// route the kit's own README.md models this action against. Both buttons now navigate there
// via the kit SecondaryButton's onClick + router.push (`locale` added as a prop, below), the
// exact pattern this round already uses for a SecondaryButton acting as a link with no href
// prop on the component itself (../../empty-states/_lift/EmptyUnit.tsx:126, `_rule/
// EmptyStatesRule.tsx:213`, `_tray/EmptyStatesTrayView.tsx:301`), so no dead affordance
// remains. Not booking-id-scoped, because nothing on the real destination reads one.
//
// Grounded-in: ../../_kit/SecondaryButton.tsx (both buttons; the two menu items now compose it
// too, instead of a hand-rolled <button>) and ../../_kit/tokens.ts (MOTION.sheetClose for the
// disclosure close timing). TYPE_RAMP is no longer imported here: it only styled the two now-
// removed hand-rolled buttons' font-size, and SecondaryButton already reads TYPE_RAMP.cta
// itself, so pinning it again here would have been a stale, unused import.
//
// system: none directly; composes the kit's SecondaryButton (A4, no per-system delta) and
// MOTION.sheetClose (A9, locked to round-1 direction A). Does not read useSystem() itself.
//
// REPAIR measured (2026-09-06), Playwright, 390x844, dpr 3, live dev server, fresh load,
// /en/dev/directions-0905-r2/bookings-list?s=rule: 0 console errors. Both Reschedule and
// Cancel render as the kit SecondaryButton: 358x50px, border-radius 99px, border 1px solid
// rgb(228,228,231) (#E4E4E7, the locked hairline), box-shadow none, font 14px/500 ink
// (rgb(10,10,10)) on white. Clicking either fires router.push to `/en/profile/bookings` and the
// browser's URL genuinely changes (confirmed live), so neither is a dead click.

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { MapPin, Settings2 } from "lucide-react";
import { SecondaryButton } from "../../_kit/SecondaryButton";
import { MOTION } from "../../_kit/tokens";

export function NextAppointmentActions({
  directionsHref,
  locale,
}: {
  directionsHref: string | null;
  locale: string;
}) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  // The one real, live booking-management destination (see REPAIR note above): no
  // per-booking route exists, so both actions land on the real /profile/bookings page.
  const manageHref = `/${locale}/profile/bookings`;

  return (
    <div>
      <div className="mt-3 flex items-center gap-2">
        <SecondaryButton
          className="flex-1"
          disabled={!directionsHref}
          onClick={() => directionsHref && window.open(directionsHref, "_blank", "noopener,noreferrer")}
        >
          <MapPin size={16} strokeWidth={1.9} aria-hidden />
          Get directions
        </SecondaryButton>
        <SecondaryButton className="flex-1" onClick={() => setManageOpen((v) => !v)}>
          <Settings2 size={16} strokeWidth={1.9} aria-hidden />
          Manage
        </SecondaryButton>
      </div>

      <AnimatePresence>
        {manageOpen && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -8, scale: 0.98 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: MOTION.sheetClose.durationMs / 1000, ease: [0.4, 0, 1, 1] as const }}
            className="mt-2 flex flex-col gap-1"
          >
            <SecondaryButton onClick={() => router.push(manageHref)}>Reschedule</SecondaryButton>
            <SecondaryButton onClick={() => router.push(manageHref)}>Cancel</SecondaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
