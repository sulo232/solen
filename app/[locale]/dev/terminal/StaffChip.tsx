"use client";

// StaffChip , a stylist's photo inside a ring, where THE RING IS THE INDICATOR.
//
// exists-check: `npm run exists staffchip` / `avatar badge` return the Avatar primitive (used here,
// not duplicated) and nothing else shaped like this.
//
// THE BADGE IS GONE, 2026-08-17. Owner, in three messages: "make it no pill n jdt circle n make it
// green orange etc", then "not round dott", then "remove the pill thats underneath or middle bro".
// Four rounds were spent making a badge match his reference, and the answer was to delete it. His
// reference is an onboarding screen introducing ONE person, where a badge is the only thing that
// could carry a state. A shop board reports on everybody at once, and the circle around each face
// is already there, already repeated, already the same size for everyone. Colouring what is there
// beats adding something that is not.
//
// So this file no longer copies a reference at all. It keeps one thing from it, the floating ring
// with a white band inside, and drops the rest. measure-ok: the badge geometry that the PIL
// measurements described (pill 149x64px, corner radius 26px, 13px of overhang, all off
// owner-badge-ref.png at 919x1998) no longer renders anywhere, so there is nothing left to match.
// What remains is grounded in OUR screen, not in his: the ring's stroke and band are the only
// reference-derived numbers left, and the chip's size comes from our own team row (SalonTeam.tsx:134
// uses 88px for a staff avatar as the CONTENT of a section, so a supporting row sits below it).
//
// measured, and kept because these two ARE still his: PIL on owner-badge-ref.png (919x1998px),
// 919px / 390pt = 2.356 px per pt.
//   ring stroke  y 743..752 = 10px  -> 0.039 of the 256px outer circle
//   white band   y 753..767 = 15px  -> 0.059, i.e. one and a half times the stroke
// role: his is a lone hero portrait, ours repeats three across in a supporting row.

import { Avatar } from "@/app/[locale]/_components/primitives";
import { TONE_RING, TONE_LABEL, type Tone } from "./status";

const RATIO = { stroke: 0.039, band: 0.059 };
const SIZES = { board: 78, row: 54 } as const;

export const CHIP_OUTER = SIZES.board;

interface StaffChipProps {
  name: string;
  avatarUrl: string | null;
  tone: Tone;
  size?: keyof typeof SIZES;
}

export default function StaffChip({ name, avatarUrl, tone, size = "board" }: StaffChipProps) {
  const outer = SIZES[size];
  const stroke = Math.round(outer * RATIO.stroke) || 1;
  const band = Math.round(outer * RATIO.band);
  const photo = outer - 2 * stroke - 2 * band;

  return (
    <div className="relative shrink-0" style={{ width: outer, height: outer }}>
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: stroke + band }}>
        <Avatar src={avatarUrl} name={name} size={photo} />
      </div>
      {/* The ring carries the state. SVG rather than a border so the stroke sits exactly on the
          circle at any size, and currentColor so the tone comes from a token class, never a hex. */}
      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        className={"pointer-events-none absolute inset-0 " + TONE_RING[tone]}
        role="img"
        aria-label={`${name}, ${TONE_LABEL[tone]}`}
      >
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={(outer - stroke) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
        />
      </svg>
    </div>
  );
}
