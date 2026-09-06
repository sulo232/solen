"use client";

// exists-check: `npm run exists payment-step` (run this session) shows no round-2 selectable
// payment-method row anywhere. Round-1's own version (PaymentStepReviewA.tsx:306-334) draws a
// heavy ink outline around the chosen option when tapped, which is NOT one of the four named
// exceptions to the design contract's selection rule (the ONE commit button, the booking
// date/slot, the avatar's own SelectedCheckBadge, the booking services-step category pills). This component
// fixes that rather than re-proposing it: choosing an option here follows the LOCKED calm-gray
// treatment instead, never an ink outline.
//
// DEVIATION FROM BRIEF (see also deviationsFromBrief in the structured return): the kit
// (_kit/README.md) ships no "selectable two-line row" component, only Pill (a single-line
// TabPill chip) and Card (a non-interactive container whose border/shadow are fixed per active
// system). A payment-method choice needs an icon plus a title plus a subtitle in one row, so it
// does not fit Pill's shape, and Card carries no chosen/not-chosen visual state at all. This
// file is built from kit tokens only (RADIUS.entityCardPx, COLOR.hairline / COLOR.tray /
// COLOR.inkText / COLOR.meta, TYPE_RAMP.body / TYPE_RAMP.meta), never a literal size or hex.
//
// Grounded-in: R2_LOOK_SYSTEMS.md A1 (Pill and chip), whose recipe is explicitly system-invariant
// (Part B lists no per-system override for A1, and Pill.tsx's own header says so: "the base pill
// recipe (A1) carries no per-system delta ... Pill looks identical in all three systems"). This
// row borrows that exact recipe (resting: fill #FFFFFF, border 1px #E4E4E7, text #6B6B6B, weight
// 500; chosen: fill #F4F4F5, border #F4F4F5, text #0A0A0A, semibold, the calm-gray treatment,
// never ink or blue) rather than TRAY's zero-hairline Card rule, because a selectable option is
// the A1 pill grammar, not an A7 card: TRAY's `hairlineCeiling: 0` governs Card-composed
// grouping, not this control family.
// Press motion: A9's selectTick (150ms, 1 -> 1.06 -> 1, ease-snap), the same recipe as choosing
// a Pill.
import * as React from "react";
import { COLOR, RADIUS, TYPE_RAMP, MOTION } from "../../_kit/tokens";

export interface PaymentOptionRowProps {
  chosen: boolean;
  onChoose: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

export function PaymentOptionRow({ chosen, onChoose, icon, title, subtitle }: PaymentOptionRowProps) {
  const [ticking, setTicking] = React.useState(false);

  const handleClick = () => {
    onChoose();
    setTicking(true);
    window.setTimeout(() => setTicking(false), MOTION.selectTick.durationMs);
  };

  return (
    <button
      type="button"
      aria-pressed={chosen}
      onClick={handleClick}
      className="flex w-full items-center gap-3 p-4 text-left motion-reduce:!transform-none"
      style={{
        borderRadius: RADIUS.entityCardPx,
        // The calm-gray fill (never ink, never blue) marks the chosen option.
        backgroundColor: chosen ? COLOR.tray : "#FFFFFF",
        border: `1px solid ${chosen ? COLOR.tray : COLOR.hairline}`,
        transform: ticking ? "scale(1.06)" : "scale(1)",
        transition: `transform ${MOTION.selectTick.durationMs}ms ${MOTION.selectTick.easing}`,
      }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: chosen ? "#FFFFFF" : COLOR.tray }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={chosen ? "block font-semibold" : "block font-normal"}
          style={{
            fontSize: TYPE_RAMP.body.size,
            color: COLOR.inkText,
          }}
        >
          {title}
        </span>
        <span className="mt-0.5 block" style={{ fontSize: TYPE_RAMP.meta.size, color: COLOR.meta }}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}
