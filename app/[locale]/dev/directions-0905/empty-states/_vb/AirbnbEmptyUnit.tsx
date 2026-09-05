"use client";

// exists-check: net-new vs components-legacy/ui/EmptyState.tsx (the primitive this file
// is a per-feature, Airbnb-look VARIANT of, not a duplicate: EmptyState stays untouched
// and every other direction of this surface still imports it), app/[locale]/dev/
// motion-recipe/page.tsx (a motion COMPARISON demo, not a shared empty-state unit), and
// the _plans/_tasks/_roadmaps design docs the exists-guard flagged (none defines this
// component; they are planning docs, not code). `npm run exists AirbnbEmptyUnit` -> 0
// hits before this file.
//
// Grounded-in: components-legacy/ui/EmptyState.tsx (the primitive this unit REPLACES for
// Direction B, same job: icon + headline + subline + one CTA), _design-system/references/
// airbnb--empty-states.md (copy shape: name what's missing, explain when it fills, one
// action) and airbnb--look-recipe.md (the numbers: headline 22/600 row 2, secondary grey
// row 4, ink row 5, CTA pill row 13). No new illustration binary: airbnb--empty-states.md's
// own "Not measured" section confirms no Airbnb icon glyph pt-size was ever captured (only
// Mobbin thumbnails were available), so this unit draws a single large Lucide glyph with NO
// background tile, matching the one Airbnb empty-state icon treatment that IS fully
// described in that file (Messages tab: "plain thin black/ink strokes, no colour and no
// background tile"), at 56px, a size chosen here (not Airbnb-measured, said so) to read as
// an object-illustration rather than the 32px-in-a-64px-tile Solen currently locks.
//
// Depicts: icon + headline + subline + one CTA shape -> components-legacy/ui/EmptyState.tsx
// Depicts: the copy strings themselves -> components-legacy/booking/BookingsList.tsx, app/[locale]/profile/vouchers/page.tsx (real render sites; the consuming Direction B file lists the exact key per state)
//
// motion-ok: entrance uses Airbnb's own measured cascade timing (airbnb--motion.md, back-nav
// card-grid stagger: 250ms duration, 50ms per-item delay step, curve cubic-bezier(0.2,0,0,1)),
// not Solen's locked ENTER RECIPE (opacity+scale+blur, 280ms, glide), because this file sits
// under app/**/dev/** (motion-recipe-gate.py's own scope note names this path exempt) and
// Direction B is LOOK-FULL: the point is showing the Airbnb motion feel at full strength.
// Still animates opacity + y + scale together (never opacity alone), per the richness note's
// paraphrase of the ENTER RECIPE, just on Airbnb's numbers instead of Solen's.
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

// LOOK-FULL direction, airbnb--look-recipe.md row 5 (verified rgb(34,34,34)), a named
// broken lock (Solen's frozen ink token #0A0A0A) listed in this direction's header Conflicts.
const AIRBNB_INK = "#222222"; // drift-ok: Airbnb-measured ink, LOOK-FULL broken lock vs ink token
// Row 4 (verified rgb(108,108,108)), effectively identical to Solen's ink-2 token (#6B6B6B);
// kept as the literal Airbnb value since this direction is LOOK-FULL.
const AIRBNB_SECONDARY_GREY = "#6C6C6C"; // drift-ok: Airbnb-measured secondary grey, ~= ink-2 token
// Darker stop of the measured two-stop rausch gradient (row 13, PIL-sampled rgb(228,28,92)),
// rendered solid (not the full gradient) because white CTA text on the lighter stop computes
// to ~3.57:1, under the 4.5:1 AA text floor that holds in every direction; this darker stop
// computes to ~4.55:1 (hand-computed WCAG relative luminance). A named broken lock (Solen's
// one commit button is filled with its own dark ink token, never a brand colour). This hue is
// not invented: it is the measured Airbnb rausch value, cited from a locked reference file,
// used here on purpose because the direction is LOOK-FULL.
const RAUSCH_SOLID = "#E41C5C"; // drift-ok hue-ok: Airbnb rausch CTA, measured not invented, LOOK-FULL broken lock vs ink CTA

export interface AirbnbEmptyUnitProps {
  icon: LucideIcon;
  /** Overrides the default Airbnb-ink icon colour. Used exactly once (the favorites
   * heart), per taste rule 4's universal save-heart colour, this direction's one
   * semantic-colour moment (floors item d). */
  iconColor?: string;
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  index: number;
}

export function AirbnbEmptyUnit({
  icon: Icon,
  iconColor,
  headline,
  subline,
  ctaLabel,
  ctaHref,
  index,
}: AirbnbEmptyUnitProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.25, delay: index * 0.05, ease: [0.2, 0, 0, 1] as const },
      };

  return (
    <motion.div className="flex flex-col items-center px-6 py-10 text-center" {...motionProps}>
      <Icon
        size={56}
        strokeWidth={1.5}
        style={{ color: iconColor ?? AIRBNB_INK }}
        aria-hidden
      />
      {/* fontWeight set via inline style, not the .font-semibold Tailwind class: globals.css
          line ~269 remaps `.font-semibold`/`.font-bold` to 500 inside <main> (owner-picked
          2026-08-15, "two text weights on customer surfaces", option C, zero bold). That is a
          dated, named lock; this direction is LOOK-FULL and the brief names "section-title
          size and weight" as an explicitly breakable lock, so headline + CTA render at
          Airbnb's true 600 via inline style, which the class-based selector cannot reach. */}
      <h3
        className="mt-4 text-[22px] leading-snug"
        style={{ color: AIRBNB_INK, fontWeight: 600 }}
      >
        {headline}
      </h3>
      <p
        className="mt-2 max-w-[280px] text-[14px] leading-relaxed"
        style={{ color: AIRBNB_SECONDARY_GREY, fontWeight: 400 }}
      >
        {subline}
      </p>
      <a
        href={ctaHref}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-full px-6 text-[16px] text-white transition-transform duration-150 active:scale-[0.97]"
        style={{ backgroundColor: RAUSCH_SOLID, fontWeight: 600 }}
      >
        {ctaLabel}
      </a>
    </motion.div>
  );
}
