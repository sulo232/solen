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
// (the existing overflow menu, same two actions, same open/close motion; unchanged from the
// pre-repair BookingsListRule.tsx, moved here verbatim).
//
// Grounded-in: ../../_kit/SecondaryButton.tsx (both buttons, unmodified) and
// ../../_kit/tokens.ts (MOTION.sheetClose for the disclosure close timing, TYPE_RAMP.body for
// the two menu-item labels, which render only once opened and so are not part of the resting
// fold's 4-size count, per R2_LOOK_SYSTEMS.md cross-system rule "measured on the rendered DOM").
//
// system: none directly; composes the kit's SecondaryButton (A4, no per-system delta) and
// MOTION.sheetClose (A9, locked to round-1 direction A). Does not read useSystem() itself.

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { MapPin, Settings2 } from "lucide-react";
import { SecondaryButton } from "../../_kit/SecondaryButton";
import { TYPE_RAMP, MOTION } from "../../_kit/tokens";

export function NextAppointmentActions({ directionsHref }: { directionsHref: string | null }) {
  const [manageOpen, setManageOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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
            <button
              type="button"
              className="w-full rounded-[12px] px-3 py-2.5 text-left font-body font-normal text-s-ink hover:bg-s-bg-sunken"
              style={{ fontSize: TYPE_RAMP.body.size }}
            >
              Reschedule
            </button>
            <button
              type="button"
              className="w-full rounded-[12px] px-3 py-2.5 text-left font-body font-normal text-s-error hover:bg-s-error/10"
              style={{ fontSize: TYPE_RAMP.body.size }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
