// exists-check: net-new vs the flagged matches (Airbnb spacing plans, Airbnb reference captures,
// a customer_preferences migration, an Airbnb aspect-ratio spec, and two Airbnb-look mockup
// files under directions-0905). None of those are a token FILE a mockup imports: the plans and
// migration are unrelated documents, and the two AirbnbSections/SalonOfMonthAirbnb components
// are round-1 screen implementations, not a shared token module. `npm run exists kit` (run this
// session) returned only a REMOVED continue-card hit and an unrelated DB table, no existing
// round-2 kit. This file IS the thing that should have existed and did not: the mechanical form
// of _plans/R2_LOOK_SYSTEMS.md Part A, so every round-2 mockup reads sizes/spacing/radius/colour
// from one place instead of re-deriving them per screen the way the round-1 folds did.

/**
 * tokens.ts
 *
 * The mechanical form of `_plans/R2_LOOK_SYSTEMS.md` Part A (THE BASE). One constant per
 * recipe row, and every constant carries its provenance in a comment: the reference file and
 * the section/line it was read from this run. Nothing here is invented. Where Part A left a
 * value open to an orchestrator override (the radius conflict, C1), the override actually
 * shipped is recorded next to the base value, not silently substituted.
 *
 * A round-2 mockup imports from here, never writes a size, weight, spacing, radius or hex of
 * its own. See README.md.
 */

// ---------------------------------------------------------------------------------------------
// A5. The type ramp. Four sizes, two weights, one use each, integers only.
// Illegal on any round-2 screen: 12.5, 13.5, 14.5, 15.5, 17, 19 (R2_LOOK_SYSTEMS.md A5).
// ---------------------------------------------------------------------------------------------

export interface TypeStep {
  /** Pixel font size. */
  size: number;
  /** Tailwind font-weight class name (the CLASS, not the computed value: see WEIGHT_CLAMP note
   * below). "font-semibold" and "font-bold" both compute to 500 inside <main> on customer
   * surfaces per the orchestrator override; that is expected, not a bug to fix. */
  weightClass: "font-semibold" | "font-medium" | "font-normal";
  /** Line-height as a unitless multiplier. */
  lineHeight: number;
  /** What this step is FOR, verbatim intent from Part A (not a generic label). */
  use: string;
  /** Reference file / section this row was read from. */
  provenance: string;
}

export const TYPE_RAMP = {
  /** The screen's one display anchor. Must render as a SENTENCE carrying the fact, never a
   * label with a number beside it (LOCKFILE §2 "State anchor", measured off Airbnb's
   * "You've made $0.00 this month"). Anchor:body ratio is 28/14 = 2.0x, over the 1.8x
   * EMPHASIS BUDGET floor (CLAUDE.md). */
  anchor: {
    size: 28,
    weightClass: "font-medium",
    lineHeight: 1.15,
    use: "the screen's one display anchor, a sentence carrying the fact (FLOORS LAW 6, >=28px)",
    provenance: "R2_LOOK_SYSTEMS.md A5 row 1; CLAUDE.md FLOORS LAW 6; LOCKFILE §2 State anchor",
  },
  /** Mandatory, not optional (A5): round 1's commit screens jumped 16px straight to 28px with
   * one text run in between, a 12px hole. This tier fills it. */
  sectionHeading: {
    size: 18,
    weightClass: "font-medium",
    lineHeight: 1.3,
    use: "the section heading; mandatory on every screen, not optional",
    provenance: "R2_LOOK_SYSTEMS.md A5 row 2; LOCKFILE §2.5 Section H2, phone 18px",
  },
  /** The one legal substitution for sectionHeading: a screen whose anchor is 22px (a list
   * header rather than a fact) swaps 18 for 16 and still carries four sizes total. */
  sectionHeadingAlt: {
    size: 16,
    weightClass: "font-medium",
    lineHeight: 1.3,
    use: "legal substitute for sectionHeading ONLY when the screen anchor is 22px, a list header",
    provenance: "R2_LOOK_SYSTEMS.md A5 row 5; LOCKFILE §2.5 Subsection H3 16/600 phone",
  },
  /** Body copy, row labels. The CTA label sits at its own step (cta below), not this weight. */
  body: {
    size: 14,
    weightClass: "font-normal",
    lineHeight: 1.4,
    use: "body copy, row labels",
    provenance: "R2_LOOK_SYSTEMS.md A5 row 3; LOCKFILE §2.5 Core ramp, Body 14/400 phone",
  },
  /** Meta, address, duration, timestamps, badge text. */
  meta: {
    size: 12,
    weightClass: "font-normal",
    lineHeight: 1.35,
    use: "meta, address, duration, timestamps, badge text",
    provenance: "R2_LOOK_SYSTEMS.md A5 row 4; LOCKFILE.md:393-397, reconciled 2026-09-04",
  },
  /** The CTA label. CORRECTED: this step used to carry C7's 15px verdict, which put a 5th
   * distinct size (28/18/15/14/12) on every screen that renders a button next to the base's
   * own four-size table, tripping the CLAUDE.md NEVER-AGAIN floor-2 ceiling (measured live on
   * the lift confirmation mockup, critic pass 2026-09-06). A5's own row 3 already names the
   * fix and was never wired up: "14 / 400 | body, row labels, AND THE CTA LABEL AT 500"
   * (R2_LOOK_SYSTEMS.md A5, line "14 / 400 ... and the CTA label at 500"). So the CTA was
   * always specified to share body's 14px slot, distinguished by WEIGHT (500 vs 400) and
   * font-heading vs font-body, never by a size step of its own; C7 decided a real question
   * (is 15px the right CTA size in isolation) without checking it against A5's four-size
   * ceiling, and tokens.ts sided with C7's number instead of A5's table, which is the
   * contradiction this file's header already flagged. 14px still clears the CLAUDE.md
   * design-contract floor ("CTA never <=13 on a button"). */
  cta: {
    size: 14,
    weightClass: "font-medium",
    lineHeight: 1.2,
    use: "the primary/secondary button label (shares body's 14px slot per A5 row 3; 500 vs body's 400 is the distinction)",
    provenance: "R2_LOOK_SYSTEMS.md A5 row 3 (\"14 / 400 ... and the CTA label at 500\"); resolves the C7-vs-A5 contradiction in A5's favor since C7's 15px breaches the 4-size FLOORS LAW ceiling",
  },
} satisfies Record<string, TypeStep>;

export type TypeRampKey = keyof typeof TYPE_RAMP;

// ---------------------------------------------------------------------------------------------
// A6. The spacing ladder.
// ---------------------------------------------------------------------------------------------

export const SPACING = {
  /** Between one page section and the next. */
  section: 32,
  /** Between groups inside a card. */
  group: 16,
  /** Between sibling cards or list items in a section. */
  sibling: 12,
  /** Named exception: the home feed only. Do NOT re-inflate home to 32. */
  homeFeedSection: 24,
  /** Page margin, each side. Locked (`LOCKFILE.md` §7 Container widths, "Page outer": px-4
   * mobile). NOT an open axis: measured live at 390x844, 34 elements sit at x=16 on /en, 89 on
   * the salon page. */
  pageMargin: 16,
  /** A content hairline never touches the screen edge; only chrome boundaries may. About 88%
   * of width, inset both sides. */
  dividerInset: 24,
} as const;

// ---------------------------------------------------------------------------------------------
// A1 / A7 / C1. Radius. The orchestrator override wins here: the kit ships the CAPSULE
// (9999px), not the `rounded-[16px]` corner CLAUDE.md:134 still names, because that corner was
// landed unshown and rejected on sight 2026-09-02 ("I never wanted this corner thing"), and the
// live product renders the capsule on 359 call sites (`rounded-btn` + `rounded-pill`). Card
// radii are unaffected by C1 (that conflict is about pills/chips/buttons only) and stay at
// their own A7 values.
// ---------------------------------------------------------------------------------------------

export const RADIUS = {
  /** Pill / chip / button corner, orchestrator-decided capsule. Applied as an important
   * Tailwind utility (`!rounded-full`) where the underlying primitive (TabPill) ships its own
   * literal `rounded-[16px]` class that a plain override cannot out-rank without !important,
   * since `cn()` in this codebase is bare clsx with no tailwind-merge dedup. */
  pillPx: 9999,
  /** Same capsule, badges (A2) use the same corner as pills. */
  badgePx: 9999,
  /** A7: photo card (a salon). Shadow-led, no border. */
  photoCardPx: 16,
  /** A7: grouped list card (category members: services, staff). */
  groupedListCardPx: 24,
  /** A7: individual entity card (one person, one salon). Flat, hairline, gap-separated. */
  entityCardPx: 16,
} as const;

// ---------------------------------------------------------------------------------------------
// A8. Colour role table.
// ---------------------------------------------------------------------------------------------

export const COLOR = {
  /** Primary text, the one commit fill's TEXT (white on ink). 19.80:1 on white. */
  inkText: "#0A0A0A",
  /** The ink FILL (LOCKFILE.md:41, s-ink-soft, owner-picked 2026-08-15). Every filled-black
   * surface: primary CTAs, selected pills, filled icon buttons. Write `bg-s-ink` in a mockup
   * (the globals.css override resolves it), never this hex directly as a fill. */
  inkFill: "#1C1C1F",
  /** Meta, chevrons, placeholders, timestamps, inactive tab. 5.33:1 white / 4.85:1 on tray. */
  meta: "#6B6B6B",
  /** One hairline token, every divider. 1.27:1 on white; it is a boundary, not text. */
  hairline: "#E4E4E7",
  /** Tray / selected pill fill. 1.10:1 on white. */
  tray: "#F4F4F5",
  /** Small clickable TEXT only. Never a fill, never a button, never body text on the tray
   * (4.17:1 there, fails AA). */
  accentText: "#276EF1",
  /** The rating star glyph. Never as text. */
  star: "#FFC32B",
  /** Save / heart. */
  save: "#FF3366",
  success: { DEFAULT: "#16A34A", bg: "#E8F5E9" },
  warning: { DEFAULT: "#F1AE27", bg: "#FDF6E7", text: "#B45309" },
  error: { DEFAULT: "#DC2626", bg: "#FEE2E2" },
} as const;

// ---------------------------------------------------------------------------------------------
// A9. Press motion, locked to round-1 direction A. Every value read this run from
// app/[locale]/dev/directions-0905/press-motion/_va/{PressPillA,PressMotionSceneA,PressSheetA}.tsx.
// B's spring is out, per his pick.
// ---------------------------------------------------------------------------------------------

export const MOTION = {
  pressDown: {
    transform: "scale(0.97)",
    filter: "brightness(0.96)",
    durationMs: 100,
    easing: "cubic-bezier(0.7,0,0.84,0)",
    name: "ease-thud",
    provenance: "PressPillA.tsx:129-132 / PressMotionSceneA.tsx:112-116 (PressableA)",
  },
  release: {
    transform: "scale(1)",
    filter: "brightness(1)",
    durationMs: 200,
    easing: "cubic-bezier(0.16,1,0.3,1)",
    name: "ease-glide",
    provenance: "PressPillA.tsx:133 / PressMotionSceneA.tsx:112-116 (PressableA)",
  },
  /** Selecting a pill: fill/border/text swap INSTANTLY (transition-none), a 150ms scale tick
   * 1 -> 1.06 -> 1 plays over it. */
  selectTick: {
    keyframes: [1, 1.06, 1] as const,
    durationMs: 150,
    easing: "cubic-bezier(0.4,0,0.2,1)",
    name: "ease-snap",
    provenance: "PressPillA.tsx:66-74, 86-97, 134",
  },
  sheetOpen: { durationMs: 320, easing: "ease-glide", provenance: "PressSheetA.tsx:92-108" },
  sheetClose: { durationMs: 220, easing: "ease-thud", provenance: "PressSheetA.tsx:92-108" },
} as const;

// ---------------------------------------------------------------------------------------------
// A2. Status badge base recipe (before per-status colour). The exact shipped shape/padding is
// KEPT from components-legacy/booking/BookingCard.tsx:84-90,138 ("the badge design system we
// already have"); only the text colour, the fill source and the leading icon change. See
// systems.ts / StatusBadge.tsx for the full per-status table.
// ---------------------------------------------------------------------------------------------

export const STATUS_BADGE_BASE = {
  paddingXPx: 10, // px-2.5
  paddingYPx: 4, // py-1
  fontSizePx: 12,
  iconSizePx: 14,
  provenance: "components-legacy/booking/BookingCard.tsx:138 (rounded-pill px-2.5 py-1 text-[12px] font-semibold)",
} as const;
