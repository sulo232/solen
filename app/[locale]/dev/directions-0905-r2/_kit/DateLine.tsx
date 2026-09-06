"use client";

// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits
// (TRAY, home A/B/C, empty-state directions, search heading, review count, kit-preview switcher
// block, salon-book-button), none a date/time text component. No existing component in
// `_design-system/COMPONENT_REGISTRY.md` renders a booking's date+time as one text run.

// Depicts: a bookings card's date/time fact -> ROOT_CAUSES.md Part 3.3 item 3 ("Bookings" fix
// list): "The date and time become the second-largest text ... date and time to 14px/500
// #0A0A0A as ONE run (today 12px/400/#6B6B6B, the smallest and lightest thing on the page, split
// across 5 spans)." This is Cause 3's own fix ("the job fact is the smallest, lightest, greyest
// thing on it") applied to the one fact a bookings screen exists to deliver.

// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/Meta.tsx (the sibling text primitive
// this kit already pins to a TYPE_RAMP step; DateLine follows the identical shape, just at
// body's 14/500 slot instead of meta's 12/400).
//
// measured: ROOT_CAUSES.md Part 3.3 item 3 names the target size/weight/colour directly: 14px,
// weight 500 (font-medium, this kit's convention for a 500-weight body-family run, e.g.
// TYPE_RAMP.cta), colour #0A0A0A (COLOR.inkText). Date and time render as ONE text node
// (the item's own fix: "as ONE run", never split across spans); the join between them is a plain
// ASCII space (U+0020, {" "} at the render site below), NOT a middle dot -- LOCKFILE §2.5 A12 /
// V3-D463 forbids `·` as a separator glyph, and MetaDot.tsx's own component would introduce a
// second span, contradicting "ONE run".
//
// system: none. Every candidate renders the date/time fact the same way; only WHERE it sits on
// the card (Part 3.3 item 1, above the fold cut) is a layout decision the mockup makes, not a
// per-system delta.

import * as React from "react";
import { COLOR } from "./tokens";

export interface DateLineProps {
  /** A real, already-localised date string (e.g. "Thu, 17 Sep"). Never invent or reformat here. */
  date: string;
  /** A real, already-localised time string (e.g. "11:00"). */
  time: string;
  className?: string;
}

/** The date and time of a booking, as ONE 14px/500 ink text run (never split across spans, never
 * the smallest/lightest thing on a bookings card). Use for the next-appointment unit's second-
 * largest fact, per ROOT_CAUSES.md Part 3.3 item 3. */
export function DateLine({ date, time, className }: DateLineProps) {
  return (
    <p
      className={["font-body font-medium", className].filter(Boolean).join(" ")}
      style={{ fontSize: 14, color: COLOR.inkText, lineHeight: 1.4 }}
    >
      {date}
      {" "}
      {time}
    </p>
  );
}
