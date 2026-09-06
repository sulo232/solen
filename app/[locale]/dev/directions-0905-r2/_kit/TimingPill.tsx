"use client";

// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a timing-pill or on-photo badge component (they cover the TRAY look system, the
// home A/B/C directions, empty-state directions, the search heading line, the review count, the
// kit-preview switcher block, and the salon-book-button harness). No existing on-photo timing
// pill exists anywhere in the round-1/round-2 kit or in `_design-system/COMPONENT_REGISTRY.md`.

// Depicts: an on-photo relative-timing badge -> ROOT_CAUSES.md Part 3.3 item 2 ("Bookings" fix
// list): "A timing pill goes on the photo, top-left corner, per airbnb--trips.md item 4 ... Cheaper
// and more consistent alternative: reuse the existing StatusBadge shape ... at those same insets,
// since composing the registered component is FLOORS LAW 9." Geometry ratios from
// airbnb/CAPTURE.md Part B (ROOT_CAUSES.md Part 1 Cause 3 "the same number on Airbnb").

// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/StatusBadge.tsx (its own shape constants,
// STATUS_BADGE_BASE: 12px text, 14px icon-slot padding) and this folder's tokens.ts (the new
// TIMING_PILL ratios). This is a compose, not a redraw: same padding/text-size family as the
// badge already in this kit, positioned with the measured on-photo insets instead of
// StatusBadge's inline flow position.
//
// measured (ROOT_CAUSES.md Part 3.3 item 2, on a 358px-wide photo): height ~30px (8.4% of photo
// width), top inset ~11px (3.2%), left inset ~14px (4.0%), opaque white fill. Ratios, not the raw
// px, are load-bearing (airbnb/CAPTURE.md Part B was measured off a 299px still), so this
// component scales from the caller's real rendered photo width via `photoWidthPx` rather than
// hardcoding the 358px-derived numbers.
//
// system: none directly -- every candidate that uses a timing pill (today: candidate B's
// bookings-list fix) renders the SAME neutral white pill regardless of which system is active,
// per the sheet's own instruction: "Neutral fill, and the colour does not encode urgency
// (Airbnb's own pill is the same treatment for 'In 2 weeks', 'In 3 months' and 'Pending')." A
// caller must never vary `className`'s background by proximity/urgency; that would silently
// reintroduce Cause 3's own colour-encodes-urgency failure this component exists to avoid.

import * as React from "react";
import { STATUS_BADGE_BASE, TIMING_PILL } from "./tokens";

export interface TimingPillProps {
  /** A relative timing phrase ("In 4 days", "Tomorrow"), never an absolute time (the locked
   * no-times-in-listings convention, `feedback_no_times_in_listings`). Colour must never vary by
   * how soon this is; if a caller finds itself branching fill by urgency, that is the Cause 3
   * regression this component exists to prevent. */
  label: string;
  /** The photo's actual rendered width in px. The caller's photo container MUST be
   * `position: relative` (or contain one) so this pill's `position: absolute` resolves against
   * it, and MUST NOT clip overflow above the pill (a Card `variant="photo"` wrapper already sets
   * `overflow-hidden` on the outer card, which is fine since the pill sits inside the photo's own
   * bounds, never outside them). */
  photoWidthPx: number;
  className?: string;
}

/** An on-photo, top-left, relative-timing badge. Composed from the same shape family as
 * StatusBadge (12px text, 14px-slot padding), positioned by the measured Airbnb ratios rather
 * than StatusBadge's inline flow. Always neutral white: colour never encodes urgency. */
export function TimingPill({ label, photoWidthPx, className }: TimingPillProps) {
  const heightPx = photoWidthPx * TIMING_PILL.heightRatio;
  const topPx = photoWidthPx * TIMING_PILL.topInsetRatio;
  const leftPx = photoWidthPx * TIMING_PILL.leftInsetRatio;
  return (
    <span
      className={["absolute inline-flex items-center rounded-full font-medium text-s-ink", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        top: topPx,
        left: leftPx,
        height: heightPx,
        backgroundColor: TIMING_PILL.fill,
        paddingLeft: STATUS_BADGE_BASE.paddingXPx,
        paddingRight: STATUS_BADGE_BASE.paddingXPx,
        fontSize: STATUS_BADGE_BASE.fontSizePx,
        lineHeight: 1,
        // soft contact shadow (airbnb/CAPTURE.md Part B), not Solen's shadow-whisper: this sits
        // on a photo, not on white, so it needs enough contrast to read against any photo tone.
        boxShadow: "0 1px 3px rgba(0,0,0,0.16)",
      }}
    >
      {label}
    </span>
  );
}
