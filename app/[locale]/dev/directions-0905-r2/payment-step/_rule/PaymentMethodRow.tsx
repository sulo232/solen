"use client";

// exists-check: `npm run exists "payment method row"` / `npm run exists "directions-0905-r2
// payment-step"` (run this session) -> the shared page.tsx + the sibling "lift"/"tray" builders'
// own review files, none a reusable icon-chip-plus-label row component. `npm run exists kit`
// returns the _kit folder; its own exports (Card, Pill, StatusBadge, PrimaryButton,
// SecondaryButton, TextLink, SectionTitle, Meta, Price) cover a filter chip (Pill) and three
// card shells (Card) but nothing shaped like an icon chip + two-line label + trailing check row.
// This is the RULE system's own gap, not a re-proposal of anything removed: PaymentStepRuleReview.tsx
// (per its own header comment) deliberately renders no Card anywhere on this screen, so Card is
// not the fix even though the kit has one. The two payment-method rows were previously
// hand-written inline inside the review file's JSX (the repair brief's own finding). This file
// is the extraction only: the same markup, moved out and named, reading every literal from kit
// tokens the way BodyText.tsx / Divider.tsx already do in this same folder.

// Depicts: the pay-online and pay-at-salon row anatomy (icon chip, two-line label, trailing check) -> components-legacy/booking/PayConfirmStep.tsx:549-555,618-633 (verbatim, unchanged from what PaymentStepRuleReview.tsx rendered inline before this extraction)
// Depicts: the highlighted row's fill -> app/[locale]/dev/directions-0905-r2/_kit/tokens.ts (COLOR.tray, #F4F4F5, the base A1 gray-fill convention, never blue and never a border, applied here to a row instead of a pill)
// Depicts: the row's corner -> app/[locale]/dev/directions-0905-r2/_kit/tokens.ts (RADIUS.entityCardPx, 16, the A7 individual-entity-card radius, reused here for a row since RULE draws no card shell on this screen)

// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/tokens.ts (COLOR.tray, RADIUS.entityCardPx,
// TYPE_RAMP.body) and app/[locale]/dev/directions-0905-r2/_kit/Meta.tsx (Meta) -- every size,
// weight and colour below is read off the imported token objects, no literal font-size, weight
// or hex is written in this file. The icon-chip backgrounds (bg-s-accent-pale / bg-s-bg-sunken)
// are real production Tailwind classes already live on components-legacy/booking/
// PayConfirmStep.tsx's own pay-method rows, kept unchanged, not new tokens.
//
// deviation: kit-lacking component, built here with kit tokens only, per the kit README's own
// escape hatch ("If the kit lacks something you need... never a reason to write a literal value
// inline"). Listed in this builder's structured-output deviationsFromBrief. Scoped to this
// screen's own _rule folder; the sibling "lift" system's identical inline row is a separate,
// out-of-scope finding for that system's own repair pass.
//
// system: RULE-specific by construction (no border, no shadow, a flat fill-only highlight);
// LIFT and TRAY compose their own Card-based chooser and have no reason to import this file.

import * as React from "react";
import { Check } from "lucide-react";
import { COLOR, RADIUS, TYPE_RAMP, Meta } from "../../_kit";

export interface PaymentMethodRowProps {
  isCurrentChoice: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  /** Icon-chip background, one of the two real production classes
   *  (bg-s-accent-pale for pay-online, bg-s-bg-sunken for pay-at-salon). */
  iconBg: string;
  title: string;
  subtitle: string;
}

/** The RULE system's payment-method row: an icon chip, a two-line label, and a trailing check
 * on the current choice. The current choice reads as a fill change only (COLOR.tray), never a
 * border, matching this screen's own "0 bordered elements in the fold" system note. */
export function PaymentMethodRow({ isCurrentChoice, onClick, icon, iconBg, title, subtitle }: PaymentMethodRowProps) {
  return (
    <button
      type="button"
      aria-pressed={isCurrentChoice}
      onClick={onClick}
      className="flex w-full items-center gap-3 p-2 text-left transition-colors"
      style={{ borderRadius: RADIUS.entityCardPx, backgroundColor: isCurrentChoice ? COLOR.tray : "transparent" }}
    >
      <span className={["grid h-10 w-10 shrink-0 place-items-center rounded-full", iconBg].join(" ")}>{/* content-image-ok: payment-method icon chip, not a photo fallback (verbatim PayConfirmStep.tsx) */}
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={["font-heading block", isCurrentChoice ? "font-semibold" : "font-normal"].join(" ")}
          style={{ fontSize: TYPE_RAMP.body.size, lineHeight: TYPE_RAMP.body.lineHeight, color: COLOR.inkText }}
        >
          {title}
        </span>
        <Meta className="mt-0.5 block">{subtitle}</Meta>
      </span>
      {isCurrentChoice && <Check size={18} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />}
    </button>
  );
}
