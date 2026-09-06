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
  /**
   * ROUND 3, candidate C only (`_plans/R3_ONE_SYSTEM.md` Candidate C rows "Radius, pill/chip",
   * "Radius, primary CTA", "Radius, card and photo"). Orchestrator decision (1) for this build:
   * the radius on pills/buttons is the candidate's OWN sheet value; C's sheet is the Airbnb port,
   * a third radius family end to end, never used by lift/rule/tray/a/b (which keep pillPx 9999
   * and photoCardPx/entityCardPx/groupedListCardPx above unchanged).
   */
  c: {
    /** Airbnb row 21, ported: 24px chip radius (fill/border/text unchanged besides the border-
     * only selected treatment, see systems.ts CANDIDATES.c.pill). Height stays the 44px touch
     * floor (TabPill's own h-11), not row 21's measured 34px. */
    pillPx: 24,
    /** Airbnb row 14: 12px rounded rect, NOT a pill. */
    ctaPx: 12,
    /** Airbnb rows 9, 37, 38 (three independent measurements agree): 20px, replacing Solen's 16
     * (entity/photo) and 24 (grouped) for the duration of this one candidate only. */
    cardPx: 20,
    /** Airbnb row 14 ported height: 40px is REFUSED (below the 44px statutory touch floor, Part
     * 4 item 7), so 44px minimum, same floor override as the chip. */
    ctaHeightPx: 44,
  },
} as const;

// ---------------------------------------------------------------------------------------------
// ROUND 3. Values every candidate's card/pill/badge needs that the round-2 ramp above has no
// slot for. Read alongside systems.ts's CANDIDATES map, which is where each value is actually
// wired to a component.
// ---------------------------------------------------------------------------------------------

/** Candidate C's on-photo timing pill (`_plans/R3_ONE_SYSTEM.md` "On-photo pill geometry";
 * ROOT_CAUSES.md Part 3.3 item 2 and Part 1 Cause 3 "the same number on Airbnb"). Ratios, not raw
 * px, are the load-bearing numbers (`airbnb/CAPTURE.md` Part B, measured off a 299px still); a
 * 358px-wide photo (the kit's own card width, 390 viewport minus 2x16 margin) makes these ~30px
 * tall, ~11px top inset, ~14px left inset, which is why TimingPill.tsx takes a photoWidthPx prop
 * and scales from it rather than hardcoding those three numbers. */
export const TIMING_PILL = {
  heightRatio: 0.084, // 8.4% of photo width
  topInsetRatio: 0.032, // 3.2% of photo width
  leftInsetRatio: 0.04, // 4.0% of photo width
  fill: "#FFFFFF", // opaque white ~99.5% lightness (CAPTURE.md Part B)
} as const;

/** Candidate C's chrome-edge hairline (`_plans/R3_ONE_SYSTEM.md` "Hairline rule", row 39,
 * PICK: no Solen token exists for this role). Content dividers stay COLOR.hairline (#E4E4E7,
 * ported from row 8's rgb(221,221,221)); this second value is for a CHROME boundary only (a tab
 * bar edge), never a content divider, and only candidate C uses it. */
export const CHROME_HAIRLINE_C = "#EBEBEB";

/** Candidate C's rail-card ambient shadow (`_plans/R3_ONE_SYSTEM.md` row 37; ROOT_CAUSES.md
 * Part 1 Cause 1 "the same number on Airbnb"), roughly 2.5x the alpha and 8x the blur radius of
 * Solen's own shadow-whisper. Used only on a candidate-C card with no photo (a "rail" card); a
 * candidate-C card WITH a photo stays flat (row 10: the photo edge is the boundary, no shadow at
 * all), per Card.tsx's photoAware branch for system "c". */
export const SHADOW_RAIL_C = "0 0 0 1px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.1)";

/** Candidate C's secondary in-card button fill. `_plans/R3_ONE_SYSTEM.md` names this row
 * explicitly as "exact fill hex not measured, the trips helper should have PIL-sampled it".
 * PICK, no source: Solen's own locked neutral tray token (COLOR.tray, #F4F4F5) stands in rather
 * than inventing an unsourced hex, and this constant exists so the substitution is named once
 * instead of silently baked into SecondaryButton.tsx. */
export const SECONDARY_BUTTON_FILL_C_PICK_NOTE =
  "PICK: COLOR.tray (#F4F4F5), no measured Airbnb hex exists for this row per R3_ONE_SYSTEM.md Candidate C 'Secondary button'";

/** Candidate C's over-photo controls (`_plans/R3_ONE_SYSTEM.md` Candidate C row "Over-photo
 * control", rows 27/29/28). Back and share render as a 40x40 frosted circle using Solen's own
 * over-photo recipe (`lib/frost-glass.ts` FROST_GLASS; CLAUDE.md shadow/depth row "over-photo =
 * frost"); the save heart is a SEPARATE, darker treatment per the sheet, not frosted: 32x32, no
 * pill behind it, icon fill `rgba(0,0,0,0.5)` with a white stroke. No equivalent row exists on
 * Candidate A or B's tables, so this value is read only under system "c". */
export const OVER_PHOTO_CONTROL_C = {
  backShare: {
    sizePx: 40,
    treatment: "frost" as const, // lib/frost-glass.ts FROST_GLASS, not a new recipe
  },
  saveHeart: {
    sizePx: 32,
    fill: "rgba(0,0,0,0.5)",
    stroke: "#FFFFFF",
    strokeWidthPx: 1.5,
  },
} as const;

/** Candidate C's map / mode toggle pill (`_plans/R3_ONE_SYSTEM.md` Candidate C row "Map / mode
 * toggle pill", row 22 plus the touch-floor override). Solid ink fill (matches COLOR.inkFill
 * below, `#1C1C1F`, hardcoded here since COLOR is declared later in this file), 93px wide, white
 * text; height ported from Airbnb's measured 38px to Solen's 44px touch floor, the same override
 * pattern as RADIUS.c.ctaHeightPx above. No equivalent row exists on Candidate A or B's tables. */
export const MODE_TOGGLE_PILL_C = {
  radiusPx: 24,
  heightPx: 44, // ported from Airbnb's measured 38px; 44px touch-floor override
  widthPx: 93,
  fill: "#1C1C1F", // COLOR.inkFill
  textColor: "#FFFFFF",
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
