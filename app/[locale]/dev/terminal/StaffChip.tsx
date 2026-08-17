"use client";

// StaffChip , the ringed avatar with a status badge, rebuilt from nothing on 2026-08-17 after
// "that sh is nth like the refference".
//
// exists-check: `npm run exists staffchip` / `avatar badge` return the Avatar primitive (used here,
// not duplicated) and nothing shaped like this. The previous attempt lived inline inside Screen.tsx;
// it is replaced by this file rather than edited, because the rejection was about the whole object.
//
// WHAT WAS ACTUALLY WRONG, measured rather than guessed. A vertical PIL scan straight down the
// centre of his screenshot (owner-badge-ref.png, x = 493) reads, top to bottom:
//     y 743..752   BLACK          10px  the ring
//     y 753..767   WHITE           15px the GAP
//     y 768...     photo pixels          the photo starts here
// The ring in his reference is a FLOATING circle with white air between it and the photo. Mine was
// a border painted straight onto the photo edge, with no gap at all. That single missing 15px is
// what made it read as a different object: a bordered thumbnail instead of a ringed portrait.
//
// measured: PIL on owner-badge-ref.png (919 x 1998px), converted at 919px / 390pt = 2.356 px per pt.
//     outer circle   x 366..621, y 743..999  = 256px   -> 108.7pt
//     ring stroke    y 743..752               = 10px   -> 4.2pt
//     white gap      y 753..767               = 15px   -> 6.4pt
//     photo          y 768..976               = 208px  -> 88.3pt
//     badge pill     x 419..583, y 934..1009  = 165 x 76px -> 70.0 x 32.3pt
//     badge overhang pill bottom 1009 vs circle bottom 999 = 10px -> 4.2pt below the RING
//     badge / photo  165 / 208 = 0.79 wide, 76 / 208 = 0.365 tall
// The reference photo is 88.3pt and ours is 88px, so this is rendered at 1:1 with his screenshot,
// no scaling factor and nothing to round away: photo 88, gap 6, ring 4, outer 108, badge 70 x 32.
//
// The earlier version got the badge ratio wrong on top of the missing gap, because it measured the
// photo as 237px (that is the ring's INNER edge, not the photo) and so sized the badge against a
// circle 14% larger than the real one.

import { Scissors } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";

export const CHIP_PHOTO = 88;
export const CHIP_OUTER = 108; // photo 88 + gap 6 x2 + ring 4 x2

interface StaffChipProps {
  name: string;
  avatarUrl: string | null;
  /** Null when the chair is free. */
  busy: boolean;
  /** `?busy=red` renders the alternative reading, where a working stylist is an alarm colour. */
  busyIsRed?: boolean;
}

export default function StaffChip({ name, avatarUrl, busy, busyIsRed = false }: StaffChipProps) {
  return (
    <div className="relative" style={{ width: CHIP_OUTER, height: CHIP_OUTER }}>
      {/* The ring: its own circle, 4px of ink, with 6px of white between it and the photo. */}
      <div className="absolute inset-0 rounded-full border-4 border-s-ink" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Avatar src={avatarUrl} name={name} size={CHIP_PHOTO} />
      </div>
      {/* The badge: ink like his, straddling the ring's bottom edge, one white glyph inside. Green
          is the free signal and it sits INSIDE the ink rather than replacing it, because a 70px
          saturated pill stops being an indicator and becomes the loudest thing on the screen. */}
      <span
        aria-hidden="true"
        className={
          "absolute left-1/2 flex h-[32px] w-[70px] -translate-x-1/2 items-center justify-center rounded-full " +
          (busy && busyIsRed ? "bg-s-error" : "bg-s-ink")
        }
        style={{ bottom: -4 }}
      >
        {busy ? (
          <Scissors size={18} strokeWidth={2} className="text-white" />
        ) : (
          <span className="h-3 w-3 rounded-full bg-s-success" />
        )}
      </span>
    </div>
  );
}
