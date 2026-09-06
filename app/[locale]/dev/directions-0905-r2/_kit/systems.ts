// exists-check: net-new. `npm run exists directions` (run this session) lists every round-1 and
// round-2 dev-direction file; none of them is a shared systems/deltas module, each screen just
// re-derives its own card/border/shadow choices inline, which is the exact drift this file (and
// the kit around it) exists to close. `npm run exists kit` returns no existing kit module.

/**
 * systems.ts
 *
 * The mechanical form of `_plans/R2_LOOK_SYSTEMS.md` Part B (THREE LOOK SYSTEMS). One entry per
 * system key. Each entry carries its one-sentence definition verbatim, its deltas from the base
 * (tokens.ts) as typed overrides, and its discriminator: the one measurable thing a critic
 * checks in the rendered fold to prove a screen actually belongs to this system.
 *
 * A mockup wraps its tree in <KitProvider system="lift" | "rule" | "tray"> (see KitProvider.tsx)
 * and every kit component reads its delta from here via useSystem().
 */

import { RADIUS, COLOR, OVER_PHOTO_CONTROL_C, MODE_TOGGLE_PILL_C } from "./tokens";

export type SystemKey = "lift" | "rule" | "tray" | "a" | "b" | "c";

/** ROUND 3 (`_plans/R3_ONE_SYSTEM.md`): the three candidate keys, a strict subset of SystemKey.
 * lift/rule/tray are round 2 and untouched by anything below; a/b/c are net-new. */
export type CandidateKey = "a" | "b" | "c";

export function isCandidateKey(key: SystemKey): key is CandidateKey {
  return key === "a" || key === "b" || key === "c";
}

export interface CardDelta {
  /** Whether a card carries a border in this system. */
  border: boolean;
  /** Whether a card carries a shadow in this system. */
  shadow: boolean;
  /** Whether a hairline divider is allowed at all, and if so, a rough per-fold ceiling. */
  hairlineCeiling: number | "unlimited";
  /** Whether the tray (#F4F4F5) is used as a page-background device. */
  usesTray: boolean;
  /**
   * The one named per-variant exception to this system's uniform border/shadow, if any (Part B,
   * SYSTEM 2 notes: "No card at all, except one identity block where the reference has one").
   * When set to a CardVariant name, Card.tsx forces `border: true` on that variant only,
   * regardless of this delta's own `border` value. Every other variant is unaffected. Only RULE
   * declares one today ("entity"); LIFT and TRAY leave this undefined.
   */
  borderExceptionVariant?: "photo" | "grouped" | "entity";
  /**
   * ROUND 3 only (`_plans/R3_ONE_SYSTEM.md` recommendation section + Candidate C rows).
   * When true, this system's card border/shadow is not a single static pair: a caller passing
   * `hasPhoto` to <Card> gets the photo-aware rule instead, resolved in Card.tsx per system key
   * (candidate "b": photo -> flush edge + whisper shadow, no photo -> hairline + no shadow,
   * never both, FLOORS LAW 4 cases b/c; candidate "c": photo -> flat, no border, no shadow, the
   * photo edge IS the boundary [row 10], no photo -> ambient rail shadow [row 37]). Undefined or
   * false everywhere else (lift/rule/tray/a) means the static `border`/`shadow` above still win,
   * so nothing about round 2 changes.
   */
  photoAware?: boolean;
}

/** ROUND 3 (`_plans/R3_ONE_SYSTEM.md`). The pill/chip recipe a candidate's Pill.tsx branch reads
 * when it differs from the round-2 default (TabPill's own calm-grey recipe, which A and B both
 * keep unchanged, per the sheet's "Pill / chip, both states: Identical to Candidate A" rows). */
export interface CandidatePillSpec {
  radiusPx: number;
  /** "grey" = today's shipped TabPill recipe, untouched (A and B). "borderOnly" = Candidate C's
   * ported Airbnb recipe (`airbnb/CAPTURE.md` Part A): fill stays white in BOTH states, text
   * stays ink in BOTH states, no bold ever, and selecting a chip changes ONLY the border colour. */
  selectionMode: "grey" | "borderOnly";
  /** Only read when selectionMode is "borderOnly": the selected border colour. Sheet: "Ported
   * ink would be #0A0A0A" (Part 4 item 2's own worked port of Airbnb's #DDDDDD -> #222222). */
  selectedBorderColor?: string;
  /** Only read when selectionMode is "borderOnly": both states render ink text (Airbnb row 21's
   * "12px/400 ink"), not TabPill's grey-when-inactive convention. */
  textColor?: string;
  provenance: string;
}

/** ROUND 3. The one commit button and its neutral sibling, when a candidate's shape differs
 * from the round-2 default (ink capsule 52h / outline capsule 50h, kept by A and B unchanged). */
export interface CandidateButtonSpec {
  radiusPx: number;
  primaryHeightPx: number;
  secondaryHeightPx: number;
  /** "outline" = today's shipped hairline-bordered white secondary (A and B, unchanged).
   * "neutralFill" = Candidate C's "neutral grey fill, full width, one per card, inside the card"
   * (sheet's own note: exact hex not measured, see tokens.ts SECONDARY_BUTTON_FILL_C_PICK_NOTE). */
  secondaryFill: "outline" | "neutralFill";
  provenance: string;
}

/** ROUND 3. Whether a status badge colour-codes at all. "pastel" = today's shipped recipe
 * (pastel bg + ink text + saturated icon, A and B unchanged). "neutral" = Candidate C's own row
 * ("Colour never encodes state"), Part 4 item 3, shown per orchestrator decision (4) so he sees
 * both rather than only the pastel default. */
export interface CandidateStatusSpec {
  treatment: "pastel" | "neutral";
  provenance: string;
}

/** ROUND 3. Candidate C's over-photo controls (`_plans/R3_ONE_SYSTEM.md` Candidate C row
 * "Over-photo control", rows 27/29/28). No equivalent row exists in Candidate A or B's tables
 * (neither names an over-photo control), so this field is set only on candidate "c"; it is
 * absent, not zero-valued, on "a" and "b". */
export interface CandidateOverPhotoControlSpec {
  /** Back and share buttons: a frosted circle (`tokens.ts` OVER_PHOTO_CONTROL_C.backShare). */
  backShareSizePx: number;
  backShareTreatment: "frost";
  /** The save heart: a separate, darker, non-frosted circle, no pill behind it
   * (`tokens.ts` OVER_PHOTO_CONTROL_C.saveHeart). */
  saveHeartSizePx: number;
  saveHeartFill: string;
  saveHeartStroke: string;
  provenance: string;
}

/** ROUND 3. Candidate C's map / mode toggle pill (`_plans/R3_ONE_SYSTEM.md` Candidate C row
 * "Map / mode toggle pill", row 22 plus the touch-floor override). No equivalent row exists in
 * Candidate A or B's tables, so this field is set only on candidate "c". */
export interface CandidateModeTogglePillSpec {
  radiusPx: number;
  heightPx: number;
  widthPx: number;
  fill: string;
  textColor: string;
  provenance: string;
}

/** ROUND 3. The full per-candidate value sheet a round-3 kit component reads when its value
 * differs from the round-2 base. pill/button/status are present on a/b/c entries; undefined on
 * lift/rule/tray. overPhotoControl and modeTogglePill are Candidate-C-only rows (Candidate A and
 * B's tables carry no equivalent), so they stay undefined on "a" and "b" too. */
export interface CandidateSpec {
  label: string;
  pill: CandidatePillSpec;
  button: CandidateButtonSpec;
  status: CandidateStatusSpec;
  overPhotoControl?: CandidateOverPhotoControlSpec;
  modeTogglePill?: CandidateModeTogglePillSpec;
}

export interface SystemEntry {
  key: SystemKey;
  /** The one-sentence definition, verbatim from Part B (round 2) or R3_ONE_SYSTEM.md (round 3). */
  definition: string;
  /** Source screens this system was derived from (Part B "Source screens"). */
  sourceScreens: string[];
  /** The base value this system overrides, and to what, with the Part B line as provenance. */
  deltas: {
    card: CardDelta;
    /** Free-text notes on deltas that aren't reducible to the CardDelta shape (e.g. System 2's
     * "no card at all, except one identity block"). */
    notes: string[];
    provenance: string;
  };
  /** The one thing a critic measures to prove membership, verbatim from Part B. */
  discriminator: string;
  /** ROUND 3 only: the candidate's full pill/button/status value sheet. Undefined on lift/rule/
   * tray, which never touch it; Pill.tsx / PrimaryButton.tsx / SecondaryButton.tsx / StatusBadge.tsx
   * all check for its presence before branching away from their round-2 default behaviour. */
  candidate?: CandidateSpec;
}

export const SYSTEMS: Record<SystemKey, SystemEntry> = {
  lift: {
    key: "lift",
    definition:
      "the lifted white card is the only grouping device on the screen, so nothing carries a " +
      "border and nothing carries a hairline; a soft shadow and the gap between cards do all the work.",
    sourceScreens: [
      "scratchpad/r2/refs/airbnb/01-home.png, 06-home-viewport.png (Airbnb home)",
      "scratchpad/r2/refs/fresha/02-search.png, 02b-search-scrolled.png, 03b-venue-services.png (Fresha search/venue)",
    ],
    deltas: {
      card: { border: false, shadow: true, hairlineCeiling: 1, usesTray: false },
      notes: [
        "Every group is a shadowed card with NO border; the entity-card border is dropped for the duration.",
        "The tray is not used; the page is white end to end. FLOORS LAW 4 is satisfied by case (b), the flush photo edge, on every card that has a photo.",
        "Card radius stays Solen's 16 (entity) / 24 (grouped); Airbnb's 20 is not adopted.",
        "Shadow value stays shadow-whisper, not Airbnb's 0 8px 24px rgba(0,0,0,.1).",
      ],
      provenance: "R2_LOOK_SYSTEMS.md, SYSTEM 1: LIFT, Deltas table",
    },
    discriminator:
      "In the 390x844 fold: count(elements with a box-shadow) > count(elements with a border) " +
      "AND count(elements carrying BOTH) = 0 AND count(hairline dividers) <= 1.",
  },
  rule: {
    key: "rule",
    definition:
      "there is no card anywhere on the screen; groups are separated by inset hairlines and gap " +
      "size alone, and the hierarchy is carried entirely by a big anchor sentence over a populated " +
      "middle type tier.",
    sourceScreens: [
      "scratchpad/r2/refs/airbnb/03-listing.png, crop-listing-top.png (Airbnb listing)",
      "scratchpad/r2/critique/mobbin/fr-appointments.webp, fr-confirmation.webp (Fresha appointment detail)",
    ],
    deltas: {
      card: {
        border: false,
        shadow: false,
        hairlineCeiling: "unlimited",
        usesTray: false,
        // The one documented exception below, made mechanical: Card.tsx forces a border on the
        // "entity" variant under RULE even though this system's own `border: false` applies to
        // every other variant.
        borderExceptionVariant: "entity",
      },
      notes: [
        "No card at all, except one identity block where the reference has one (Fresha profile hub keeps exactly one bordered identity card, forced via Card.tsx's borderExceptionVariant, not a hand-written border outside the shared component).",
        "The 18px section-heading tier is mandatory AND must carry at least three text runs, since it is the only separator besides the hairline.",
        "Hairlines are the primary device, #E4E4E7, inset 24px both sides, spanning about 88% of the width.",
        "Zero shadow on anything, including the sticky bar (separated by gradient fade instead).",
        "The anchor is a sentence carrying the fact, never a label with a number next to it.",
      ],
      provenance: "R2_LOOK_SYSTEMS.md, SYSTEM 2: RULE, Deltas table",
    },
    discriminator:
      "In the fold: count(elements with a box-shadow) = 0 AND every hairline is inset >= 24px " +
      "on both sides AND the 18px tier carries >= 3 text runs.",
  },
  tray: {
    key: "tray",
    definition:
      "the canvas does the separating, so white groups sit on a #F4F4F5 band carrying neither a " +
      "border nor a shadow, and the page alternates white and tray down the whole scroll.",
    sourceScreens: [
      "scratchpad/r2/critique/mobbin/ab-confirmpay.webp, ab-empty-trips.webp, scratchpad/r2/refs/airbnb/mobbin/confirmation.webp (Airbnb confirmation / wishlist empty)",
      "scratchpad/r2/refs/fresha/03b-venue-services.png (Fresha service-card stack, group shape once the canvas provides the boundary)",
    ],
    deltas: {
      card: { border: false, shadow: false, hairlineCeiling: 0, usesTray: true },
      notes: [
        "The page alternates #FFFFFF and #F4F4F5 band by band, at least twice per screen.",
        "A group sitting on the tray carries neither border nor shadow; the canvas is its boundary.",
        "Airbnb's own tint (#F4F1E9) is NOT used; the tint stays our own cool #F4F4F5 (taste rule 3 bans warm cream by name; see CONFLICT C5).",
        "The sticky bar is white above the tray, separated by gradient fade, never frost (frost is for controls over photography).",
      ],
      provenance: "R2_LOOK_SYSTEMS.md, SYSTEM 3: TRAY, Deltas table",
    },
    discriminator:
      "Down the full scroll: the page background alternates between #FFFFFF and #F4F4F5 at " +
      "least twice, AND every group whose computed background is white while its parent is " +
      "#F4F4F5 carries border-width: 0 and box-shadow: none.",
  },

  // =============================================================================================
  // ROUND 3 (`_plans/R3_ONE_SYSTEM.md`, PART 2: THE ONE SYSTEM, THREE CANDIDATES). Three complete
  // value sheets, applied identically across confirmation, search, bookings, pay, profile, empty
  // states and pills, per his own ask ("if the design system changes per screen it's gonna be
  // ass"). Each entry below carries the sheet's own values with the sheet's own citations; a PICK
  // is left as PICK, never silently filled from memory. lift/rule/tray above are untouched.
  // =============================================================================================

  a: {
    key: "a",
    definition:
      "CANDIDATE A, RULE REFINED: no cards, inset hairlines, bare rows. Groups are separated by " +
      "inset hairlines and gap size alone; one named exception, a single identity block per " +
      "screen, may carry a border, forced through Card.tsx's 'entity' variant, never hand-written.",
    sourceScreens: ["_plans/R3_ONE_SYSTEM.md, CANDIDATE A: RULE REFINED, value table"],
    deltas: {
      card: {
        border: false,
        shadow: false,
        hairlineCeiling: "unlimited",
        usesTray: false,
        borderExceptionVariant: "entity",
      },
      notes: [
        "Radius, pill/chip/button: 9999px capsule (RADIUS.pillPx; orchestrator decision (1) for this build, the candidate's own sheet value).",
        "Radius, the one entity card: 16px (RADIUS.entityCardPx).",
        "Radius, photo: 16px inside the entity card; 0px full-bleed when the photo is the screen hero (a layout choice, not a Card.tsx variant: a full-bleed hero renders outside Card entirely).",
        "Hairline: COLOR.hairline, 1px, inset 24px both sides (SPACING.dividerInset), spans ~88% of width; a hairline appears only at a group boundary, never between rows inside a group.",
        "Shadow: none, on anything, including the sticky bar (separated by gradient fade instead).",
        "Type ramp, spacing ladder, icon budget: identical to the round-2 base (TYPE_RAMP, SPACING); no per-candidate override.",
      ],
      provenance: "_plans/R3_ONE_SYSTEM.md, CANDIDATE A table, rows 'Container treatment' / 'Hairline rule' / 'Shadow'",
    },
    discriminator:
      "In the fold: count(elements with a box-shadow) = 0 AND every hairline is inset >= 24px " +
      "on both sides AND at most one bordered element exists (the named entity exception).",
    candidate: {
      label: "RULE refined",
      pill: {
        radiusPx: RADIUS.pillPx,
        selectionMode: "grey",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE A 'Pill / chip, unselected/selected' rows: identical to the round-2 TabPill recipe Pill.tsx already ships",
      },
      button: {
        radiusPx: RADIUS.pillPx,
        primaryHeightPx: 52,
        secondaryHeightPx: 50,
        secondaryFill: "outline",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE A 'Primary button' / 'Secondary button' rows: identical to PrimaryButton.tsx/SecondaryButton.tsx's shipped recipe",
      },
      status: {
        treatment: "pastel",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE A 'Status treatment' row: identical to StatusBadge.tsx's shipped pastel+ink+icon recipe",
      },
    },
  },

  b: {
    key: "b",
    definition:
      "CANDIDATE B, LIFT REFINED: every group of facts about one record is one white card, with " +
      "the card-edge rule written into the system rather than improvised, a card WITH a photo " +
      "takes the flush photo edge and the whisper shadow, a card with NO photo takes the 1px " +
      "hairline and no shadow, and nothing ever carries both.",
    sourceScreens: ["_plans/R3_ONE_SYSTEM.md, CANDIDATE B: LIFT REFINED, value table + RECOMMENDATION section"],
    deltas: {
      card: {
        border: false,
        shadow: true,
        hairlineCeiling: 1,
        usesTray: false,
        photoAware: true,
      },
      notes: [
        "Radius, pill/chip/button: 9999px capsule, same collision as A (orchestrator decision (1)).",
        "Radius, card: 16px for one entity/photo, 24px for a card holding multiple category members (RADIUS.entityCardPx / groupedListCardPx, unchanged from round 2).",
        "Card edge, the fix this candidate needs to be shippable (RECOMMENDATION section): pass `hasPhoto` to <Card>; Card.tsx's photoAware branch resolves shadow-if-photo / hairline-if-not, never both. This is the rule replacing profile-rule.md's 'someone had to swap to borders when the whisper shadow proved invisible' improvisation.",
        "Shadow value: shadow-whisper, rgba(10,10,10,0.04) 0 1px 2px (Card.tsx's existing constant, unchanged).",
        "Hairline: ceiling of 1 standalone hairline per fold; inside a card, rows separate by gap only, or an inset hairline above 3 rows.",
        "Spacing: identical to A, plus card internal padding 16px (SPACING.group) and card-to-card 12px (SPACING.sibling).",
      ],
      provenance: "_plans/R3_ONE_SYSTEM.md, CANDIDATE B table row 'Card edge, the resolution B needs' + RECOMMENDATION section",
    },
    discriminator:
      "In the fold: count(elements with a box-shadow) > count(elements with a border) AND " +
      "count(elements carrying BOTH) = 0 AND every card passed hasPhoto explicitly (no card left " +
      "to the old static shadow-always delta).",
    candidate: {
      label: "LIFT refined",
      pill: {
        radiusPx: RADIUS.pillPx,
        selectionMode: "grey",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE B 'Pill / chip, both states' row: 'Identical to Candidate A'",
      },
      button: {
        radiusPx: RADIUS.pillPx,
        primaryHeightPx: 52,
        secondaryHeightPx: 50,
        secondaryFill: "outline",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE B 'Primary button' / 'Secondary button' rows: same shape as A, secondary now explicitly 'inside the card it belongs to' (a layout placement, not a style delta)",
      },
      status: {
        treatment: "pastel",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE B 'Status treatment' row: 'Identical to Candidate A'",
      },
    },
  },

  c: {
    key: "c",
    definition:
      "CANDIDATE C, THE AIRBNB PORT: card per record, flat with no shadow or border when the " +
      "card carries a photo (the photo edge is the boundary), a soft ambient shadow when it does " +
      "not (a rail card); 20px radius throughout; a 12px rounded-rect CTA, not a pill; a 24px " +
      "chip whose selected state changes ONLY its border colour; status colour never encodes state.",
    sourceScreens: ["_plans/R3_ONE_SYSTEM.md, CANDIDATE C: THE AIRBNB PORT, value table (every row cites an airbnb--look-recipe.md row number or airbnb/CAPTURE.md measurement)"],
    deltas: {
      card: {
        border: false,
        shadow: false,
        hairlineCeiling: "unlimited",
        usesTray: false,
        photoAware: true,
      },
      notes: [
        "Radius, card and photo: 20px throughout (RADIUS.c.cardPx), a fourth radius value replacing Solen's 16/24 for the duration of this one candidate (rows 9, 37, 38).",
        "Card edge: a card WITH a photo is flat, no border, no shadow, the photo edge is the boundary (row 10); a card with NO photo (a 'rail' card) takes the ambient shadow SHADOW_RAIL_C (row 37), never Solen's whisper. Resolved in Card.tsx's photoAware branch keyed off system.key === 'c'.",
        "Hairline: content dividers stay COLOR.hairline #E4E4E7 (ported from row 8's rgb(221,221,221)); a CHROME edge (e.g. a tab bar) uses CHROME_HAIRLINE_C #EBEBEB instead (row 39), PICK, no Solen token for that role.",
        "Icon budget: zero icons on a card (search-result and trip cards carry none at this breakpoint); status is carried by pill text alone.",
        "Type ramp: same 4 sizes as the round-2 base (28/18/14/12) per the sheet's own port ('the ramp is cut to four sizes'); 600 demotes to 500 (two-weight ceiling, same as every other candidate).",
        "Spacing: page margin stays 16px (Solen's own locked px-4, not Airbnb's 24); 26 rounds to 24, 35 rounds to 32 to stay on the 4-point scale, per the sheet's own roundings.",
      ],
      provenance: "_plans/R3_ONE_SYSTEM.md, CANDIDATE C table, rows 'Container treatment' / 'Radius, card and photo' / 'Hairline rule' / 'Icon budget' / 'Type ramp' / 'Spacing ladder'",
    },
    discriminator:
      "In the fold: every card with a photo has border-width 0 and box-shadow none; every card " +
      "with no photo has box-shadow = SHADOW_RAIL_C and border-width 0; card/photo radius = 20 " +
      "on every instance; zero icons render inside a card body.",
    candidate: {
      label: "The Airbnb port",
      pill: {
        radiusPx: RADIUS.c.pillPx,
        selectionMode: "borderOnly",
        selectedBorderColor: COLOR.inkText,
        textColor: COLOR.inkText,
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE C 'Pill / chip, unselected/selected' rows, airbnb/CAPTURE.md Part A ('only the border colour changes, #DDDDDD to #222222 ... ported ink would be #0A0A0A'); orchestrator decision (this build only, Part 4 item 2 still ASK/SHOW for real product ship) is to render the port so he sees both",
      },
      button: {
        radiusPx: RADIUS.c.ctaPx,
        primaryHeightPx: RADIUS.c.ctaHeightPx,
        secondaryHeightPx: RADIUS.c.ctaHeightPx,
        secondaryFill: "neutralFill",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE C 'Primary button' row (row 14, height 40 REFUSED under the 44px statutory floor) and 'Secondary button' row ('neutral grey fill, full width, one per card, inside the card', hex not measured, see tokens.ts SECONDARY_BUTTON_FILL_C_PICK_NOTE)",
      },
      status: {
        treatment: "neutral",
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE C 'Status treatment' row ('Neutral. Colour never encodes state', rows 23/24/42); orchestrator decision (4) for this build: C renders status neutral exactly as its sheet says, so he sees both against A/B's pastel",
      },
      overPhotoControl: {
        backShareSizePx: OVER_PHOTO_CONTROL_C.backShare.sizePx,
        backShareTreatment: OVER_PHOTO_CONTROL_C.backShare.treatment,
        saveHeartSizePx: OVER_PHOTO_CONTROL_C.saveHeart.sizePx,
        saveHeartFill: OVER_PHOTO_CONTROL_C.saveHeart.fill,
        saveHeartStroke: OVER_PHOTO_CONTROL_C.saveHeart.stroke,
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE C 'Over-photo control' row (rows 27, 29, 28): 40x40 frosted circle for back/share (lib/frost-glass.ts FROST_GLASS), separate 32x32 rgba(0,0,0,0.5)-fill/white-stroke circle for the save heart, no pill behind it",
      },
      modeTogglePill: {
        radiusPx: MODE_TOGGLE_PILL_C.radiusPx,
        heightPx: MODE_TOGGLE_PILL_C.heightPx,
        widthPx: MODE_TOGGLE_PILL_C.widthPx,
        fill: MODE_TOGGLE_PILL_C.fill,
        textColor: MODE_TOGGLE_PILL_C.textColor,
        provenance: "_plans/R3_ONE_SYSTEM.md CANDIDATE C 'Map / mode toggle pill' row (row 22 plus the touch-floor override): solid ink fill, radius 24px, width 93px, white text, height ported from Airbnb's measured 38px to the 44px touch floor",
      },
    },
  },
};

/** Cross-system rules (Part B, "all three, no exceptions"). Not per-system deltas: these bind
 * every mockup regardless of which system it belongs to. Exported so a critic script (or the
 * preview page) can print them once rather than duplicating the list. */
export const CROSS_SYSTEM_RULES: string[] = [
  "Every mockup renders through the product chrome, or prints the offset (HideInBooking.tsx strips it on /dev paths).",
  "No scaffolding in the fold: no direction switchers, no strips naming components.",
  "Four sizes, two weights, per screen, measured on the rendered DOM.",
  "Zero half-pixel font sizes.",
  "One primary commit button, ink, per screen.",
  "Nothing carries a border and a shadow at once.",
];
