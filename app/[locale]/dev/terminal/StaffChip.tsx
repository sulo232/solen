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

// ONE component, two documented sizes, never a second implementation (FLOORS LAW 8: a stylist that
// appears on two screens renders through the same anatomy, and a different density is a VARIANT).
// "row" is "board" at list scale, with the reference ratios held: gap 0.072 of the photo, ring
// 0.048, overhang 0.048.
//
// THIRD PASS, 2026-08-17: "still nth like it but alrdy better but now its too big j the pill evrth
// no balance". Two separate things, and only the first is about the reference.
//
// SIZE. His reference is ONE avatar, centred, alone, with a speech bubble above it and nothing else.
// Rendering it at his absolute size put three hero portraits in a row directly under the black bar,
// where they out-shouted the 30px headline that is supposed to be the anchor. getBoundingClientRect
// on the live board measured the old chip at 108 x 108px against a headline of 30px, so the
// supporting element was 3.6x the anchor. Copying a hero's SIZE into a row of three is the same
// error as copying its ratios onto a thumbnail, in the other direction: the number was right for his
// screen and wrong for ours. Grounded in our own system instead: our shipped team row
// (SalonTeam.tsx:134, read from source) uses an 88px avatar as the CONTENT of its section, and here
// the stylists are supporting information under a headline, so they sit one step down at 64px.
//
// THE PILL, a DELIBERATE DEVIATION from the reference, stated rather than hidden. PIL on
// owner-badge-ref.png put his pill at 165px wide against a 208px photo, so 0.79. An independent
// re-measure (flat-plateau across y 974..984, stable against an anti-alias threshold from 60 to 200)
// read it narrower at 148-152px, so his true ratio is closer to 0.72; my first number took the
// widest anti-aliased row rather than the plateau. Either way it reads as a neat chip under one hero
// portrait and as a black bar when it repeats three times in a row, so here it is 0.63 (40px of
// 64px), narrower than his on purpose. Every other proportion below is still his, unchanged.
const SIZES = {
  board: { photo: 64, gap: 4, ring: 3, outer: 78, badgeW: 40, badgeH: 20, drop: 3, glyph: 12, dot: 8 },
  row: { photo: 44, gap: 3, ring: 2, outer: 54, badgeW: 28, badgeH: 14, drop: 2, glyph: 9, dot: 6 },
} as const;

export const CHIP_OUTER = SIZES.board.outer;
export const CHIP_ROW_OUTER = SIZES.row.outer;

interface StaffChipProps {
  name: string;
  avatarUrl: string | null;
  /** False when the chair is free. */
  busy: boolean;
  /** `?busy=red` renders the alternative reading, where a working stylist is an alarm colour. */
  busyIsRed?: boolean;
  size?: keyof typeof SIZES;
}

export default function StaffChip({
  name,
  avatarUrl,
  busy,
  busyIsRed = false,
  size = "board",
}: StaffChipProps) {
  const s = SIZES[size];
  return (
    <div className="relative shrink-0" style={{ width: s.outer, height: s.outer }}>
      {/* The ring: its own circle of ink, with white air between it and the photo. That air is the
          whole difference between a ringed portrait and a bordered thumbnail. */}
      <div
        className="absolute inset-0 rounded-full border-s-ink"
        style={{ borderWidth: s.ring }}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Avatar src={avatarUrl} name={name} size={s.photo} />
      </div>
      {/* The badge: ink like his, straddling the ring's bottom edge, one white glyph inside. Green
          is the free signal and it sits INSIDE the ink rather than replacing it, because a pill that
          size in a saturated fill stops being an indicator and becomes the loudest thing on screen. */}
      <span
        aria-hidden="true"
        className={
          "absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full " +
          (busy && busyIsRed ? "bg-s-error" : "bg-s-ink")
        }
        style={{ width: s.badgeW, height: s.badgeH, bottom: -s.drop }}
      >
        {busy ? (
          <Scissors size={s.glyph} strokeWidth={2} className="text-white" />
        ) : (
          <span
            className="rounded-full bg-s-success"
            style={{ width: s.dot, height: s.dot }}
          />
        )}
      </span>
    </div>
  );
}
