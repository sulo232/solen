"use client";

// exists-check: `npm run exists "directions-0905-r2 payment-step"` (run this session) -> the
// shared page.tsx + the _tray builder's PaymentStepTray.tsx, neither a body-text wrapper. `npm
// run exists kit` returns the _kit folder; its own exports cover the 28/18/16 tier (SectionTitle)
// and the 12 tier (Meta) and money (Price), but nothing wraps the 14px body tier that
// tokens.ts's own TYPE_RAMP.body already defines. Meta.tsx's file header names exactly this
// pattern ("the 12px meta tier is a locked design-contract row, never previously pinned to its
// own component") one size up; body was simply never pinned either.

// Depicts: the 14px body/row-label tier -> ../_kit/tokens.ts TYPE_RAMP.body (14/400, "body copy,
// row labels")

// Grounded-in: ../_kit/tokens.ts (TYPE_RAMP.body, COLOR.inkText and COLOR.meta), read the same
// way Meta.tsx reads TYPE_RAMP.meta. No literal font-size, weight or hex is written below.
//
// deviation: kit-lacking component, built here with kit tokens only (this builder's structured
// output lists it under deviationsFromBrief). Two tones only, both already-defined kit colours:
// "ink" (COLOR.inkText, the primary fact on a row: a name, a date value, a price-adjacent label)
// and "meta" (COLOR.meta, a supporting line under an ink row) -- meta tone reuses the SAME 14px
// size as ink, it is not a second Meta.tsx; a genuinely smaller supporting line still goes
// through Meta (12px) instead.
//
// system: none. Body text carries no per-system delta (Part B systems change GROUPING devices,
// not the type ramp), same as SectionTitle/Meta/Price.

import * as React from "react";
import { TYPE_RAMP, COLOR } from "../../_kit";

export interface BodyTextProps {
  children: React.ReactNode;
  tone?: "ink" | "meta";
  className?: string;
}

/** The 14px body/row-label tier RULE leans on for its "populated middle type tier": names,
 * dates, times, service labels. Plain weight (400) by default -- RULE's whole point is that the
 * anchor and the three section headings carry the emphasis, not individual rows. */
export function BodyText({ children, tone = "ink", className }: BodyTextProps) {
  return (
    <span
      className={["font-body", TYPE_RAMP.body.weightClass, className].filter(Boolean).join(" ")}
      style={{
        fontSize: TYPE_RAMP.body.size,
        lineHeight: TYPE_RAMP.body.lineHeight,
        color: tone === "meta" ? COLOR.meta : COLOR.inkText,
      }}
    >
      {children}
    </span>
  );
}
