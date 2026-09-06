"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) -> 7 REMOVED-list hits,
// none a divider/hairline component (see page.tsx's own header for the full list). `npm run
// exists kit` returns the round-2/round-3 kit folders; neither exports a Divider (the README's
// own "what is in here" list names Card/Pill/StatusBadge/PrimaryButton/SecondaryButton/TextLink/
// SectionTitle/Meta/Price only). Candidate A's own container rule ("Groups are separated by
// inset hairlines and gap size alone") needs a hairline primitive the kit does not ship, the
// same gap round-2's sibling "rule" system found and filled locally
// (payment-step/_rule/Divider.tsx, read this turn, not imported: that file lives in a sibling
// round-3-unrelated system's own private folder, so this is a same-shaped LOCAL rebuild from kit
// tokens only, not a duplicate of a shared kit export).
//
// Depicts: candidate A's group-boundary hairline -> _plans/R3_ONE_SYSTEM.md CANDIDATE A table,
// row "Hairline rule" ("#E4E4E7, 1px, inset 24px both sides... a hairline appears only at a
// group boundary, never between rows inside a group").
//
// Grounded-in: ../../_kit (COLOR.hairline #E4E4E7, SPACING.dividerInset 24, SPACING.pageMargin
// 16). No literal hex or pixel value is written below; the horizontal inset is computed as
// SPACING.dividerInset - SPACING.pageMargin (24 - 16 = 8) because this screen nests its content
// in ONE outer `px-4` wrapper (PaymentStepAReview's own top-level div, matching the approved
// LIFT anatomy this candidate must not restructure), so an 8px own-margin on top of the
// ancestor's 16px padding lands the hairline's true distance from the viewport edge at 24px,
// same as round-2 rule's own Divider.tsx achieves by NOT nesting inside a px-4 ancestor at all.
// Vertical spacing is left to the caller's className (a Tailwind spacing-ladder utility), same
// division of responsibility round-2 rule's Divider.tsx already uses.
//
// deviation: kit-lacking component, built here with kit tokens only, per the kit README's own
// escape hatch. Listed in this builder's structured-output deviationsFromBrief.
//
// system: candidate-A-specific by construction (the only round-3 candidate whose container
// delta makes a hairline the dominant grouping device beyond its one named entity-card
// exception); candidates B and C compose their own Card-based grouping and have no reason to
// import this file.
import * as React from "react";
import { COLOR, SPACING } from "@/app/[locale]/dev/directions-0905-r3/_kit";

export function Divider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-hidden
      className={className}
      style={{
        height: 1,
        marginLeft: SPACING.dividerInset - SPACING.pageMargin,
        marginRight: SPACING.dividerInset - SPACING.pageMargin,
        backgroundColor: COLOR.hairline,
      }}
    />
  );
}
