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

export type SystemKey = "lift" | "rule" | "tray";

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
}

export interface SystemEntry {
  key: SystemKey;
  /** The one-sentence definition, verbatim from Part B. */
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
