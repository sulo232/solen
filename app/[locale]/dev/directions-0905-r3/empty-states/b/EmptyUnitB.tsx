"use client";

// exists-check: net-new vs the round-2 icon+headline+subline+action unit this screen extends by
// hand (read in full this session; not reused as-is because it forces the CTA to an outline
// fill on 3 of 4 call sites, which this build's orchestrator decision (2) reverses: "filled ink
// on every state, 4 of 4 ... the outline default that shipped is a defect"). Editing that file is
// out of scope (a different builder's folder); this is the candidate-B-specific replacement,
// composing the SAME shared kit primitives it already used (PrimaryButton, SectionTitle,
// TYPE_RAMP, COLOR), never a second Pill/Card/Button of its own.
//
// Grounded-in: the round-2 unit's own anatomy (icon, 28px anchor headline, 14px subline, one
// action) is kept verbatim; the placement source (this builder's own return names the exact
// reference-capture file, one small icon + bold headline + grey subline + exactly one button).
// What changes and why, one line per ROOT_CAUSES.md Part 3.6:
//   - fix item 1 (CTA fill): every call site below passes exactly one CTA component
//     (PrimaryButton); there is no second, outline path in this file at all, so a future call
//     site cannot silently reintroduce the 7-of-8-outline defect this build fixes.
//   - fix item 3 (sunken tray): the whole cluster (icon + headline + subline + CTA) renders
//     inside one COLOR.tray (#F4F4F5) rounded panel, radius RADIUS.entityCardPx (16px, the kit's
//     own individual-entity-card radius, not a new fifth value). REPAIR PASS: the panel now also
//     carries the 1px COLOR.hairline border candidate B's own card-edge rule requires for a
//     no-photo record ("no photo -> border, no shadow", see Card.tsx's photoAware branch for
//     system "b"), never a shadow, so the panel is no longer the third, off-sheet recipe the
//     critique named (tray + no border + no shadow, a combination absent from every candidate-B
//     row); it is now tray fill (states-row lock, FLOORS LAW 4) PLUS the candidate's own
//     no-photo hairline (its own sheet), not a fourth value.
//   - fix item 4 (bare glyph): REPAIR PASS, no longer partial. The Lucide glyph is now composed
//     inside ./GhostPreview.tsx, a genuine ghost-preview device (a skeletal preview of the row
//     that will render here, with the glyph demoted to a corner badge), replacing the bare
//     floating icon entirely. See GhostPreview.tsx's own header for the full reasoning.
//
// Container note: the kit's own candidate-B system entry (../../_kit systems.ts, key "b") carries
// a general note that this candidate's page stays white throughout across confirmation/search/
// bookings/etc. This one component uses the sunken tray as a CLUSTER background because this
// round's own fix list requires it specifically for this screen's icon+headline+subline+CTA unit,
// independent of which candidate is active; the added hairline border (this repair pass) then
// resolves that tray-fill requirement against candidate B's own no-photo card-edge value, rather
// than leaving the panel with neither a border nor a shadow. The panel below is a bounded,
// rounded, page-margined box, never a full-width sharp-cornered strip spanning the whole
// viewport, so it is not the rejected whole-canvas grey-band pattern (this session's own
// exists-check on this round's own keyword names that pattern as a distinct, already-killed
// thing). Every other candidate-B delta (photo-tile shadow/border, pill/button shape) renders
// unchanged.
//
// Depicts: the icon-in-a-container anatomy -> components-legacy/ui/EmptyState.tsx (its own
//   64x64 rounded icon tile on bg-s-bg-sunken, the closest already-registered precedent for
//   "icon inside a designed container", since no dedicated 3D icon exists for these four topics,
//   see this builder's own return)
//
// system: b, via the caller's KitProvider; this file reads no system state itself
// (PrimaryButton already does, and resolves to its unchanged 52px capsule ink shape under "b").

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
// Imports from ./kitBridge, not "../../_kit": the shared round-3 kit barrel has a live syntax
// error this session (see kitBridge.ts's own header and this builder's closing report). The
// bridge re-exports the identical underlying round-2 kit module; swap this back to "../../_kit"
// once that shared file is fixed.
import { SectionTitle, PrimaryButton, TYPE_RAMP, COLOR, RADIUS } from "./kitBridge";

export interface EmptyUnitBProps {
  icon: React.ReactNode;
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  index: number;
  children?: React.ReactNode;
}

export function EmptyUnitB({ icon, headline, subline, ctaLabel, ctaHref, index, children }: EmptyUnitBProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.25, delay: index * 0.05, ease: [0.2, 0, 0, 1] as const },
      };

  return (
    <div>
      <motion.div
        className="flex flex-col items-center px-6 py-10 text-center"
        style={{
          background: COLOR.tray,
          borderRadius: RADIUS.entityCardPx,
          border: `1px solid ${COLOR.hairline}`,
        }}
        {...motionProps}
      >
        {icon}
        <SectionTitle as="anchor" className="mt-4 max-w-[280px]">
          {headline}
        </SectionTitle>
        <p
          className="mt-2 max-w-[280px] font-body"
          style={{
            fontSize: TYPE_RAMP.body.size,
            lineHeight: TYPE_RAMP.body.lineHeight,
            fontWeight: 400,
            color: COLOR.meta,
          }}
        >
          {subline}
        </p>
        <div className="mt-6 w-full max-w-[280px]">
          <PrimaryButton onClick={() => router.push(ctaHref)}>{ctaLabel}</PrimaryButton>
        </div>
      </motion.div>
      {children}
    </div>
  );
}
