"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits
// (the prior round's TRAY look system, its home A/B/C directions, its empty-state directions, the
// search heading line, the review count, a switcher block that previewed the three look systems in
// isolation, and a harness matching one service row's button to the sticky bar), none of them an
// actions/disclosure component for this screen. No round-3 bookings-list file existed before this
// build.
//
// Grounded-in (by hand, not copied): the prior round's own bookings-list RULE direction's
// `NextAppointmentActions.tsx` (read in full before writing this one). Same two actions (Get
// directions / a Manage disclosure with Reschedule + Cancel), same real destination for
// Reschedule/Cancel: a grep of components-legacy/booking/BookingsList.tsx and BookingCard.tsx this
// pass finds no per-booking manage route, so the one real, live destination a signed-in customer
// reaches to manage a booking is `/${locale}/profile/bookings`, the same route the prior file's
// own header already documented reaching for the identical reason.
//
// Depicts: Get directions action -> components-legacy/booking/BookingConfirmation.tsx (the real
// google.com/maps/search pattern).
// Depicts: Manage disclosure (Reschedule / Cancel) -> components-legacy/booking/BookingCard.tsx
// (the existing overflow menu, same two actions, same open/close motion).
//
// system: "a" (Candidate A, RULE refined). Button shape comes from the shared SecondaryButton,
// which for candidate A renders its original, unmodified capsule / 50px / outline recipe
// (Candidate A's own sheet row: "identical to the shipped Secondary button recipe"); this file
// does not branch on system, it only composes the kit component.
//
// measured: Playwright, 390x844, dpr 3, /en/dev/directions-0905-r3/bookings-list/a, fresh load.
// Both Reschedule and Cancel render as the kit SecondaryButton: 358x50px, radius 9999px
// (rounded-btn), border 1px solid rgb(228, 228, 231) (#E4E4E7), box-shadow none, 14px/500 ink.
// Clicking either fires router.push to `/en/profile/bookings` and the URL genuinely changes
// (confirmed live), so neither is a dead click.

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { MapPin, Settings2 } from "lucide-react";
import { SecondaryButton, MOTION } from "../../_kit";

export function NextAppointmentActionsA({
  directionsHref,
  locale,
}: {
  directionsHref: string | null;
  locale: string;
}) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  // The one real, live booking-management destination (see header note above): no per-booking
  // route exists, so both actions land on the real /profile/bookings page.
  const manageHref = `/${locale}/profile/bookings`;

  return (
    <div>
      <div className="flex items-center gap-2">
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
