"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them a cluster/unit component for this screen family (the closest, the round-2
// lift-system build's own EmptyUnit.tsx, is read and hand-adapted below, not reused as-is: this
// candidate's Fix items 1 and 3 below change its CTA and container rules). `npm run exists
// EmptyState` found the real, locked components-legacy/ui/EmptyState.tsx primitive -- not
// composed directly here, same call the round-2 lift-system build already made and documented:
// this screen family needs the exact kit tokens (SectionTitle/PrimaryButton) wired to candidate
// C's own value sheet, which the real EmptyState component has no prop surface for (it renders
// its own icon-in-a-circle anatomy and fixed CTA fill, neither of which this candidate's own
// value sheet allows unchanged).
//
// Depicts: icon, promise headline, gesture subline, one filled CTA -> components-legacy/ui/EmptyState.tsx (the locked anatomy this cluster's structure matches, tokens swapped for the kit's own).
//
// Real-source: components-legacy/ui/EmptyState.tsx (the locked anatomy this cluster's structure matches).
//
// Grounded-in: the round-2 lift-system build's own EmptyUnit.tsx (same anatomy order: icon,
// 28px headline, 14px subline, one action; this file keeps that order and its entrance-motion
// shape, changing only the two things Fix items 1 and 3 below name) and
// _design-system/references/fresha--look-recipes.md family (small icon, bold one-line headline
// naming the missing thing, grey one-line subline, exactly one button, no card or border directly
// around the cluster, positioned in the upper third rather than centred).
//
// ROOT_CAUSES.md Part 3.6 fix-list items this file applies, each line names where:
//   1. One CTA treatment, 3 of 3 filled ink (not 7 of 8 outline) -> every call below always
//      renders the kit's <PrimaryButton>, never a <SecondaryButton>, per the orchestrator's own
//      decision (2) for this build ("filled ink on every state ... because no dated decision
//      supersedes" the CLAUDE.md states-row lock). Candidate C's own button.secondaryFill ===
//      "neutralFill" flag (systems.ts) already makes every <PrimaryButton> under system="c" render
//      at 44px / 12px-radius ink automatically; this file adds no candidate-C styling of its own.
//   3. Each cluster sits on the #F4F4F5 sunken tray -> the outer wrapper below
//      (bg-s-bg-sunken, radius matches candidate C's own 20px card family so this build never
//      introduces a fifth radius value).
//   4. The icon stops being a bare Lucide glyph -> ./GhostContentPreview.tsx (see that file's own
//      header for its full citation chain).
// Items 2 ("No looks yet." over a live rail) and 5 (the "My vouchers" headline rewrite) do not
// apply: this build's three screens (bookings, saved, results) do not include a looks state or a
// vouchers state at all, so neither contradiction nor that headline exists here to fix. Item 6 (a
// rail with baked-in competitor branding) also does not apply for the same reason: this build
// renders no photographic rail.
//
// system: candidate C. <PrimaryButton>'s own useSystem() read resolves the 44px / 12px-radius ink
// shape automatically (see PrimaryButton.tsx); this file passes it no candidate-specific prop.

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { SectionTitle, PrimaryButton, TYPE_RAMP, COLOR } from "../../_kit";
import { GhostContentPreview } from "./GhostContentPreview";

export interface EmptyClusterCProps {
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  index: number;
  /** See ./GhostContentPreview.tsx's own header for why only the favorites state carries this. */
  withHeartAccent?: boolean;
}

export function EmptyClusterC({ headline, subline, ctaLabel, ctaHref, index, withHeartAccent }: EmptyClusterCProps) {
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
    <motion.div
      className="flex w-full flex-col items-center rounded-[20px] px-6 pt-8 pb-8 text-center"
      style={{ backgroundColor: COLOR.tray }}
      {...motionProps}
    >
      <GhostContentPreview withHeartAccent={withHeartAccent} />
      <SectionTitle as="anchor" className="mt-4 max-w-[280px]">
        {headline}
      </SectionTitle>
      <p
        className="mt-3 max-w-[280px] font-body"
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
  );
}
