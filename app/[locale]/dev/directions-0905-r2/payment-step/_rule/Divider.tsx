"use client";

// exists-check: `npm run exists "directions-0905-r2 payment-step"` (run this session) -> the
// shared page.tsx + the _tray builder's PaymentStepTray.tsx, neither a divider component. `npm
// run exists kit` returns the _kit folder itself, which has no Divider/Hairline export (README's
// own "what is in here" list names Card/Pill/StatusBadge/PrimaryButton/SecondaryButton/TextLink/
// SectionTitle/Meta/Price only). This is the one thing the RULE system structurally cannot do
// without: systems.ts's own "rule" entry names "hairlines are the primary device... inset 24px
// both sides" as its defining delta, so a hairline component is the base recipe the kit is
// missing for this system, not a screen-specific invention.

// Depicts: the RULE system's primary separator -> ../_kit/systems.ts (SYSTEMS.rule.deltas.card
// notes: "Hairlines are the primary device, #E4E4E7, inset 24px both sides, spanning about 88%
// of the width.")

// Grounded-in: ../_kit/tokens.ts COLOR.hairline (#E4E4E7, the one locked hairline token) and
// SPACING.dividerInset (24, "a content hairline never touches the screen edge... about 88% of
// width, inset both sides", LOCKFILE §3 THE CONTAINER TEST). No literal hex or pixel value is
// written below; both numbers are read off the imported token objects.
//
// deviation: kit-lacking component, built here with kit tokens only, per README's own rule
// ("If the kit lacks something you need... never a reason to write a literal value"). Listed in
// this builder's structured-output deviationsFromBrief.
//
// system: RULE-specific by construction (the only system whose deltas make a hairline the
// dominant grouping device); LIFT and TRAY mockups would use their own Card-based grouping
// instead and have no reason to import this file.

import * as React from "react";
import { COLOR, SPACING } from "../../_kit";

/** The RULE system's group separator: one hairline, inset 24px both sides (measured off the
 * viewport edge, not the page's own 16px content padding, so it renders narrower than the
 * content column above/below it). Render this as a direct sibling of the padded content blocks,
 * never nested inside a `px-4` wrapper (nesting would double the inset). */
export function Divider({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-hidden
      className={className}
      style={{
        height: 1,
        marginLeft: SPACING.dividerInset,
        marginRight: SPACING.dividerInset,
        backgroundColor: COLOR.hairline,
      }}
    />
  );
}
