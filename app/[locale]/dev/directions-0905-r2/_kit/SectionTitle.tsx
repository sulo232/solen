"use client";

// exists-check: `npm run exists directions` shows no round-2 typography kit wrapper; `npm run
// exists kit` returns no existing token/kit module. The 18px section-heading tier is a locked
// design-contract row (LOCKFILE §2.5 Section H2), never previously pinned to its own component.

// Depicts: the mandatory section heading tier -> _design-system/LOCKFILE.md section 2.5 Section H2 (18px phone, mandatory per R2_LOOK_SYSTEMS.md A5, not optional)

// Grounded-in: _design-system/LOCKFILE.md §2.5 (Section H2, phone 18px) and §2 (State anchor,
// for the anchor variant). Reads its size/weight straight from tokens.ts's TYPE_RAMP so a
// mockup never re-types 18 or 28 by hand.
//
// system: none directly (SectionTitle is a base-recipe text component, Part B systems change
// GROUPING devices, not the type ramp itself), but System 2 (RULE) makes this tier mandatory
// AND requires it to carry at least three text runs (systems.ts "rule" deltas), a content rule
// enforced by the mockup author, not by this component.

import * as React from "react";
import { TYPE_RAMP } from "./tokens";

export interface SectionTitleProps {
  children: React.ReactNode;
  /** "anchor" = the screen's one 28px display anchor (must be a sentence, not a label+number).
   * "heading" (default) = the mandatory 18px section heading.
   * "headingAlt" = the one legal substitution, 16px, ONLY when the screen's anchor is 22px. */
  as?: "anchor" | "heading" | "headingAlt";
  className?: string;
}

const STEP = {
  anchor: TYPE_RAMP.anchor,
  heading: TYPE_RAMP.sectionHeading,
  headingAlt: TYPE_RAMP.sectionHeadingAlt,
} as const;

export function SectionTitle({ children, as = "heading", className }: SectionTitleProps) {
  const step = STEP[as];
  const Tag = as === "anchor" ? "h1" : "h2";
  return (
    <Tag
      className={["font-heading text-s-ink", step.weightClass, className].filter(Boolean).join(" ")}
      style={{ fontSize: step.size, lineHeight: step.lineHeight }}
    >
      {children}
    </Tag>
  );
}
